// The preview's Theme, derived from a Preset. Browser-only (react-native-web), so it is imported
// only by the preview renderer, which is loaded without server rendering.

import type { Preset } from "preset";

import { setActiveStyle } from "@/registry/styles";
import { resetStyles, type Theme } from "@/registry/theme";

import { presetTheme, type PreviewScheme } from "./preset-theme";

export type { PreviewScheme } from "./preset-theme";

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
  return presetTheme(preset, scheme, setScheme);
}
