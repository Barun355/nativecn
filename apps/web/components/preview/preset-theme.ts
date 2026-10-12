// The Theme a Preset stands for, with no side effects (no Style switch, no style-cache reset):
// the preview's own Theme (theme.ts) and a ThemeProvider nested inside the phone
// (shims/registry-theme) both build on it. Kept apart from theme.ts so the shim does not import
// the Styles module, which imports the shimmed theme module back.

import type { Preset } from "preset";

import { previewValues, presetType } from "@/lib/preset-builder";
import { config, scaleTokens, scaleValue, tokens, type Theme } from "@/registry/theme";

export type PreviewScheme = "light" | "dark";

/**
 * The phone in the preview is the 390pt baseline phone, so Tokens are shown at Scale 1 whatever
 * the browser window's size.
 */
const SCALE = 1;

/** A new Theme for this Preset and Scheme; never writes the Theme's module values (#156). */
export function presetTheme(
  preset: Preset,
  scheme: PreviewScheme,
  setScheme: Theme["setScheme"],
): Theme {
  const values = previewValues(preset);
  const scaled = scaleTokens(SCALE, { radiusBase: values.radiusBase ?? tokens.radiusBase });
  return {
    ...scaled,
    type: presetType(values.fonts, scaled.type, SCALE),
    scheme,
    schemePreference: scheme,
    setScheme,
    scale: SCALE,
    scaleValue: (v) => scaleValue(v, SCALE),
    colors: values.colors[scheme],
    elevation: tokens.elevation[scheme],
    borderWidth: tokens.borderWidth,
    motion: tokens.motion,
    opacity: tokens.opacity,
    minTouchTarget: tokens.minTouchTarget,
    config,
  };
}
