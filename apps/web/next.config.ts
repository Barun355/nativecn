import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// Cache rules for the served files (decision #27).
/** Registry and schema: redeployed on every merge to main (#30), so only minutes at the edge. */
const SHORT = "public, max-age=300, s-maxage=300, stale-while-revalidate=3600";
/** Font files never change in place. */
const FOREVER = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  // The Preset encoder is shared TypeScript source (packages/preset), not a built package.
  transpilePackages: ["preset"],
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
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

// Plugins are given by package name so the options stay serialisable for Turbopack.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
