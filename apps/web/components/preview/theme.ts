// The preview's Theme, derived from a Preset. Browser-only (react-native-web), so it is imported
// only by the preview renderer, which is loaded without server rendering.

import type { Preset } from "preset";

import { previewValues, presetType } from "@/lib/preset-builder";
import { setActiveStyle } from "@/registry/styles";
import { config, resetStyles, scaleTokens, scaleValue, tokens, type Theme } from "@/registry/theme";

export type PreviewScheme = "light" | "dark";

/**
 * The phone in the preview is the 390pt baseline phone, so Tokens are shown at Scale 1 whatever
 * the browser window's size.
 */
const SCALE = 1;

/**
 * A new Theme for this Preset and Scheme. Nothing is written into the Theme's module values
 * (colors, tokens.fonts): every value comes from the Preset, so each Preset gets new objects and
 * memoized readers always see the change (#156).
 *
 * The Style is the one piece of module state: slot() reads the active Style, as it does in the
 * Showcase App. Component styles are cached per (Scale, Scheme), so they are dropped here and
 * rebuilt for the new Theme on the next render.
 */
export function previewTheme(
  preset: Preset,
  scheme: PreviewScheme,
  setScheme: Theme["setScheme"],
): Theme {
  setActiveStyle(preset.style);
  resetStyles();
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
