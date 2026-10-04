import type { RegistryItem } from "shadcn/schema";

// The Theme runtime. `create`/`init` install it, then rewrite colors.ts and the radius/font
// parts of tokens.ts from the project's Preset.
export default [
  {
    name: "theme",
    type: "registry:lib",
    title: "Theme",
    description:
      "Tokens, Scale, Colour Roles, ThemeProvider, createStyles and the navigation theme.",
    dependencies: [
      "zustand@^5.0.15",
      "@react-native-async-storage/async-storage",
      "expo-font",
      "expo-splash-screen",
    ],
    files: [
      "colors.ts",
      "config.ts",
      "index.ts",
      "navigation.ts",
      "provider.tsx",
      "scale.ts",
      "scheme-store.ts",
      "tokens.ts",
    ].map((file) => ({
      path: `theme/${file}`,
      type: "registry:lib" as const,
      target: `{theme}/${file}`,
    })),
  },
] satisfies RegistryItem[];
