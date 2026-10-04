import expoConfig from "eslint-config-expo/flat.js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.expo/**",
      "**/.next/**",
      "apps/web/public/r/**",
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
