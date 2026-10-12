// The Registry's theme module as the preview's Components and Blocks see it: everything is the
// real module, except ThemeProvider. A Block that nests a ThemeProvider (sign-in-02's dark hero)
// would otherwise build that Theme from the Theme's module values (the default Preset), the
// window's Scale, and native-only calls (Appearance.setColorScheme). Inside the preview it
// derives the forced Scheme's Theme from the phone's Preset instead, as `create` would have
// baked it into the app. Never writes module values (#156).
//
// next.config.ts points `@/registry/theme` here for modules inside packages/ui only.

import { use, useMemo } from "react";

import {
  ThemeContext,
  ThemeProvider as RegistryThemeProvider,
} from "../../../../../packages/ui/theme/index.ts";
import { PreviewPresetContext } from "../preset-context";
import { presetTheme } from "../preset-theme";

export * from "../../../../../packages/ui/theme/index.ts";

type ThemeProviderProps = Parameters<typeof RegistryThemeProvider>[0];

export function ThemeProvider(props: ThemeProviderProps) {
  const preset = use(PreviewPresetContext);
  const parent = use(ThemeContext);
  if (!preset || !parent) return <RegistryThemeProvider {...props} />;
  return <PresetThemeProvider {...props} />;
}

function PresetThemeProvider({ scheme: forced, children }: ThemeProviderProps) {
  const preset = use(PreviewPresetContext)!;
  const parent = use(ThemeContext)!;
  const scheme = forced === "light" || forced === "dark" ? forced : parent.scheme;
  const theme = useMemo(
    () => presetTheme(preset, scheme, parent.setScheme),
    [preset, scheme, parent.setScheme],
  );
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
