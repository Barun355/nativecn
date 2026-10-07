import { useMemo, type ReactNode } from "react";

import {
  ThemeContext,
  colors,
  resetStyles,
  scaleTokens,
  tokens,
  useTheme,
  type Theme,
} from "@/registry/theme";

import { presetTheme } from "./preset";
import { usePresetStore } from "./store";

/**
 * Layers the live Preset over the app's Theme, so every Component restyles the moment a Preset
 * control changes or a `nativecn://preset/<code>` link opens, with no remount (navigation and
 * scroll positions stay). Showcase only: in user apps the Preset is fixed (ADR 0006).
 *
 * The store has already written the colours and fonts into the Theme's module values; this adds
 * the radius (a constant in tokens.ts) and gives the Theme a new identity, which re-renders every
 * useTheme() reader. Renders nothing until the stored Preset has loaded.
 */
export function LivePreset({ children }: { children: ReactNode }) {
  const base = useTheme();
  const preset = usePresetStore((s) => s.preset);
  const hydrated = usePresetStore((s) => s.hydrated);

  const theme = useMemo<Theme>(() => {
    // Component styles are cached per (Scale, Scheme). A nested ThemeProvider (a dark hero) may
    // have cached them with the Theme's own radius, so rebuild them for this Theme.
    resetStyles();
    const radiusBase = presetTheme(preset).radiusBase ?? tokens.radiusBase;
    return {
      ...base,
      ...scaleTokens(base.scale, { radiusBase }),
      // A new object, so memoized readers of `t.colors` see the change.
      colors: { ...colors[base.scheme] },
    };
  }, [base, preset]);

  if (!hydrated) return null;
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
