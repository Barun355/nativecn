// The live Preset's data: decoding deep links, the Theme values a Preset stands for, and the text
// shared for it. No React Native imports, so the node tests run it directly.
import {
  DEFAULT_PRESET,
  PRESET_OPTIONS,
  createCommand,
  decodePreset,
  describePreset,
  encodePreset,
  optionLabel,
  promptForAi,
  type AccentColor,
  type BaseColor,
  type Preset,
} from "preset";

import {
  ACCENT_COLOR_VALUES,
  BASE_COLOR_VALUES,
} from "../../../../packages/ui/presets/colors.generated.ts";
import { composeColors } from "../../../../packages/ui/presets/colors.ts";
import { fontTokens, type FontTokens } from "../../../../packages/ui/presets/fonts.ts";
import { RADIUS_BASE } from "../../../../packages/ui/presets/radius.ts";
import type { PresetColors } from "../../../../packages/ui/presets/types.ts";

// The Preset in words and as commands is shared with the builder on nativecn.dev (packages/preset).
export {
  DEFAULT_PRESET,
  PRESET_OPTIONS,
  createCommand,
  decodePreset,
  describePreset,
  encodePreset,
  optionLabel,
  promptForAi,
  type Preset,
};

/** The URL scheme the Showcase App answers to (app.json `scheme`). */
export const SCHEME = "nativecn";

/** The Preset in a `nativecn://preset/<code>` link's route param, or null if it isn't a valid code. */
export function presetFromParam(param: string | string[] | undefined): Preset | null {
  const code = Array.isArray(param) ? param[0] : param;
  return code ? decodePreset(code.trim()) : null;
}

/** The deep link that opens the Showcase App's Theme tab with this Preset applied. */
export function presetLink(preset: Preset): string {
  return `${SCHEME}://preset/${encodePreset(preset)}`;
}

/** What Share sends: the code, the command that uses it and the link that opens it here. */
export function shareMessage(preset: Preset): string {
  return [
    `nativecn Preset ${encodePreset(preset)}: ${describePreset(preset)}`,
    createCommand(preset),
    `Open in the Showcase App: ${presetLink(preset)}`,
  ].join("\n");
}

/** The Theme values a Preset stands for: what `create`/`init` write into theme/colors.ts and tokens.ts. */
export type PresetTheme = {
  colors: PresetColors;
  /** The radius base, or null to keep the Theme's own ("default"). */
  radiusBase: number | null;
  fonts: FontTokens;
};

export function presetTheme(preset: Preset): PresetTheme {
  const heading = preset.headingFont === "inherit" ? preset.bodyFont : preset.headingFont;
  return {
    colors: composeColors(preset.baseColor, preset.accentColor),
    radiusBase: RADIUS_BASE[preset.radius],
    fonts: fontTokens(preset.bodyFont, heading),
  };
}

/**
 * The colour a Base or Accent Colour option is shown as on the Theme tab: the Accent's `primary`,
 * or the Base's `mutedForeground` (its greys differ most there).
 */
export function swatchColor(
  field: "baseColor" | "accentColor",
  option: string,
  scheme: "light" | "dark",
): string {
  return field === "accentColor"
    ? ACCENT_COLOR_VALUES[option as AccentColor][scheme].primary
    : BASE_COLOR_VALUES[option as BaseColor][scheme].mutedForeground;
}
