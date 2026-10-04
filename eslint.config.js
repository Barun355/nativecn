import expoConfig from "eslint-config-expo/flat.js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.expo/**",
      "**/.next/**",
      // Temporary per-Style copies written by `ui:build`; linting them races the build
      "**/.registry-build/**",
      // nativecn.dev (Next.js) lints with its own apps/web/eslint.config.mjs
      "apps/web/**",
      // The Starter is a standalone Expo app copied by `create`; its deps are not installed here
      "packages/cli/starter/**",
    ],
  },
  // Expo / React Native code: the component source and the Showcase App
  ...expoConfig.map((c) => ({
    ...c,
    files: ["packages/ui/**/*.{ts,tsx}", "apps/showcase/**/*.{ts,tsx}"],
  })),
  // Node / TypeScript code: the CLI, the agent kit and the Preset encoder
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ["packages/cli/**/*.ts", "packages/agent-kit/**/*.ts", "packages/preset/**/*.ts"],
  })),
];
