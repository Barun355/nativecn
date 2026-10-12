import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo, type ReactNode } from "react";

import {
  ThemeContext,
  resetStyles,
  scaleTokens,
  tokens,
  useTheme,
  type Theme,
} from "@/registry/theme";

import { presetTheme, type Preset } from "./preset";
import { usePresetStore } from "./store";

/**
 * The app's Theme with a Preset's colours and radius. Both are read from the Preset, never from
 * the Theme's module values: the store rewrites those in place, so they keep their identity, and
 * the React Compiler, which caches each part of a memo on what that part reads, would then reuse
 * its first copy of them forever (#156).
 */
function liveTheme(base: Theme, preset: Preset): Theme {
  // Component styles are cached per (Scale, Scheme) and were built for the old Theme (or by a
  // nested ThemeProvider, a dark hero, with the Theme's own radius), so rebuild them for this one.
  // It runs here, inside the memoized call, so it runs only when the Theme or the Preset changes
  // and before the children render with the new Theme; as a statement of its own in LivePreset,
  // the compiler would run it on every render.
  resetStyles();
  const values = presetTheme(preset);
  return {
    ...base,
    ...scaleTokens(base.scale, { radiusBase: values.radiusBase ?? tokens.radiusBase }),
    // A new object for each Preset, so memoized readers of `t.colors` see the change.
    colors: values.colors[base.scheme],
  };
}

/**
 * Layers the live Preset over the app's Theme, so every Component restyles the moment a Preset
 * control changes or a `nativecn://preset/<code>` link opens, with no remount (navigation and
 * scroll positions stay). Showcase only: in user apps the Preset is fixed (ADR 0006).
 *
 * The store has already written the colours and fonts into the Theme's module values (nested
 * ThemeProviders read them there); this takes the colours and the radius (a constant in
 * tokens.ts) from the Preset and gives the Theme a new identity, which re-renders every
 * useTheme() reader. Renders nothing until the stored Preset has loaded.
 */
export function LivePreset({ children }: { children: ReactNode }) {
  const base = useTheme();
  const preset = usePresetStore((s) => s.preset);
  const hydrated = usePresetStore((s) => s.hydrated);

  // With the React Compiler on, the compiler memoizes this call on its arguments instead.
  const theme = useMemo(() => liveTheme(base, preset), [base, preset]);

  // The ThemeProvider keeps the window background on the Scheme's background; a new Preset can
  // change that colour (its base colour) without a Scheme change.
  const background = theme.colors.background;
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(background).catch(() => {});
  }, [background]);

  if (!hydrated) return null;
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
