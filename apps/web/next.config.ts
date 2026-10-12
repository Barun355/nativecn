import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Cache rules for the served files (decision #27).
/** Registry and schema: redeployed on every merge to main (#30), so only minutes at the edge. */
const SHORT = "public, max-age=300, s-maxage=300, stale-while-revalidate=3600";
/** Font files never change in place. */
const FOREVER = "public, max-age=31536000, immutable";

/**
 * This app's react-native-web, by path: Reanimated `require`s react-native-web internals, and in
 * the pnpm store react-native-web is not next to Reanimated, so a bare name would not resolve.
 */
const REACT_NATIVE_WEB = dirname(
  createRequire(import.meta.url).resolve("react-native-web/package.json"),
);

/** Package → web stand-in for the preview (components/preview/shims). */
const PREVIEW_SHIMS: Record<string, string> = {
  "expo-haptics": "expo-haptics.ts",
  "expo-font": "expo-font.ts",
  "expo-image": "expo-image.tsx",
  "expo-splash-screen": "expo-splash-screen.ts",
  "expo-system-ui": "expo-system-ui.ts",
  "@react-native-async-storage/async-storage": "async-storage.ts",
};

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  // The Preset encoder is shared TypeScript source (packages/preset), not a built package.
  transpilePackages: ["preset"],
  // The live Preset preview (#80, decision #28) renders nativecn's own Components (packages/ui)
  // with react-native-web. The site builds with webpack (`next build --webpack`) because
  // Turbopack does not yet honour `.web.js` platform files inside node_modules
  // (vercel/next.js#91117), which react-native-svg and Reanimated need.
  webpack(config, { dev, webpack }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        // Globals React Native libraries expect from Metro.
        __DEV__: JSON.stringify(dev),
        "process.env.EXPO_OS": '"web"',
        global: "globalThis",
      }),
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-native$": REACT_NATIVE_WEB,
      "react-native-web": REACT_NATIVE_WEB,
      // Expo modules with no part in a web preview (they ship untranspiled TypeScript).
      ...Object.fromEntries(
        Object.entries(PREVIEW_SHIMS).map(([name, file]) => [
          `${name}$`,
          fileURLToPath(new URL(`./components/preview/shims/${file}`, import.meta.url)),
        ]),
      ),
    };
    config.resolve.extensions = [".web.tsx", ".web.ts", ".web.js", ...config.resolve.extensions];
    // Reanimated reaches react-native-web's style compiler with `require()` inside an ES module,
    // which webpack leaves alone in strict ESM; parsed as auto, the require is bundled.
    config.module.rules.push({
      test: /[\\/]react-native-reanimated[\\/].*\.js$/,
      type: "javascript/auto",
    });
    // Reanimated's worklets transform over the Registry source, before SWC (see the loader).
    config.module.rules.push({
      test: /\.tsx?$/,
      include: [fileURLToPath(new URL("../../packages/ui/", import.meta.url))],
      enforce: "pre",
      use: [fileURLToPath(new URL("./components/preview/worklets-loader.mjs", import.meta.url))],
    });
    return config;
  },
  async headers() {
    return [
      { source: "/r/:path*", headers: [{ key: "Cache-Control", value: SHORT }] },
      { source: "/schema/:path*", headers: [{ key: "Cache-Control", value: SHORT }] },
      { source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: FOREVER }] },
      { source: "/mcp", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  async rewrites() {
    return {
      // Append .md to any docs URL for its markdown twin (served by app/docs-md).
      beforeFiles: [
        { source: "/docs.md", destination: "/docs-md" },
        { source: "/docs/:slug([a-z0-9-]+)\\.md", destination: "/docs-md/:slug" },
        // Generated Registry item pages: /docs/components/button.md, /docs/blocks/drawer-01.md, ...
        {
          source: "/docs/:section([a-z0-9-]+)/:slug([a-z0-9-]+)\\.md",
          destination: "/docs-md/:section/:slug",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

// Plugins are given by package name so the options stay serialisable (as Turbopack requires).
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
