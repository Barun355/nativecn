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
    categories: ["theme"],
    meta: {
      kind: "Theme",
      props: {
        ThemeProvider: {
          children: "the app; wraps the root Layout once",
          scheme: '"system" | "light" | "dark": forces a Scheme for this subtree (e.g. previews)',
          fonts: "Record<string, FontSource>: extra font faces to load",
        },
        useTheme: {
          "useTheme()":
            "Theme: the scaled Tokens (spacing, radius, type, iconSize, controlHeight, ...), colors for the current Scheme, scheme, schemePreference, setScheme, scale, scaleValue(n), elevation, borderWidth, motion, opacity, minTouchTarget and config",
          "setScheme(scheme)": '"system" | "light" | "dark": switches the Scheme and persists it',
          "scaleValue(n)":
            "number: scales a one-off literal like the Tokens (t.scale is the factor itself)",
        },
        createStyles: {
          "createStyles((t) => styles)":
            "returns a useStyles() hook; StyleSheet.create runs once per Scale and Scheme and is cached",
        },
        ThemeContext: {
          ThemeContext:
            "the React context useTheme() reads; ThemeProvider provides it. Only for previews that layer a Theme over the app's (the Showcase App's live Preset); apps never need it",
        },
        useNavigationTheme: {
          "useNavigationTheme()":
            "an Expo Router / React Navigation theme from the Theme, for headers, tab bars and drawers",
        },
        config: {
          fontScaling: "boolean (default false): respect the OS font size",
          defaultScheme: '"system" (default) | "light" | "dark": before the user picks one',
          scale: "{ baseline: 390, min: 0.85, max: 1.25 }: how Tokens adapt to the device",
          haptics: "boolean (default true): light tick on selection controls",
        },
        "colors, tokens": {
          colors: "the Colour Roles, with identical light and dark keys",
          tokens: "the unscaled Token values",
        },
      },
      docs: "The single source of truth for every Token. create/init install it and write colors.ts and the radius and font parts of tokens.ts from the Preset; edit Tokens there by hand when asked, keeping light and dark keys identical, but never re-run setup to change the Preset. ThemeProvider must wrap the root Layout; it also sets the window background (behind the status and navigation bars) to the Scheme's background with expo-system-ui. Components read Tokens through createStyles and never hard-code literals. The Scheme preference is kept in AsyncStorage (a non-sensitive preference).",
      keywords: [
        "theme",
        "tokens",
        "dark mode",
        "colors",
        "colour roles",
        "scheme",
        "createStyles",
        "useTheme",
        "design tokens",
      ],
    },
    dependencies: [
      "zustand@^5.0.15",
      "@react-native-async-storage/async-storage",
      "expo-font",
      "expo-splash-screen",
      "expo-system-ui",
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
