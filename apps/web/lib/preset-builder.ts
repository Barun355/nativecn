// The Preset builder at /create (issue #80, decision #28): the Preset in the URL, the controls,
// and the Theme values the live preview derives from the Preset.
//
// The preview never writes a Preset into the Theme's module values: it derives a new Theme from
// the Preset each time (lesson from #156: with the React Compiler on, memoized readers keep the
// first copy of a value whose identity never changes).

import {
  DEFAULT_PRESET,
  PRESET_OPTIONS,
  decodePreset,
  encodePreset,
  optionLabel,
  type Preset,
  type PresetField,
} from "preset";

import { composeColors } from "../../../packages/ui/presets/colors.ts";
import { fontTokens, type FontTokens } from "../../../packages/ui/presets/fonts.ts";
import { RADIUS_BASE } from "../../../packages/ui/presets/radius.ts";
import type { PresetColors } from "../../../packages/ui/presets/types.ts";
import { typeRamp, type TextVariant, type TypeStyle } from "../../../packages/ui/theme/tokens.ts";

/** The Preset a `?preset=<code>` value opens. A missing or invalid code opens the default one. */
export function presetFromSearch(value: string | string[] | null | undefined): {
  preset: Preset;
  invalid: boolean;
} {
  const code = (Array.isArray(value) ? value[0] : value)?.trim();
  if (!code) return { preset: DEFAULT_PRESET, invalid: false };
  const preset = decodePreset(code);
  return preset ? { preset, invalid: false } : { preset: DEFAULT_PRESET, invalid: true };
}

/** The builder's shareable URL for a Preset. */
export function builderHref(preset: Preset): string {
  return `/create?preset=${encodePreset(preset)}`;
}

export type PresetControl = {
  field: PresetField;
  label: string;
  options: readonly { id: string; label: string }[];
};

const control = (field: PresetField, label: string): PresetControl => ({
  field,
  label,
  options: PRESET_OPTIONS[field].map((id) => ({ id, label: optionLabel(id) })),
});

/** The builder's controls, in the order decision #28 lists them. */
export const PRESET_CONTROLS: readonly PresetControl[] = [
  control("style", "Style"),
  control("baseColor", "Base colour"),
  control("accentColor", "Accent colour"),
  control("radius", "Radius"),
  control("bodyFont", "Body font"),
  control("headingFont", "Heading font"),
];

/** The Preset with one setting changed. Throws a RangeError for an option the list lacks. */
export function withSetting(preset: Preset, field: PresetField, value: string): Preset {
  if (!(PRESET_OPTIONS[field] as readonly string[]).includes(value)) {
    throw new RangeError(`Unknown ${field} "${value}"`);
  }
  return { ...preset, [field]: value };
}

/** The Theme values a Preset stands for: what `create`/`init` would write into the user's theme/. */
export type PreviewValues = {
  colors: PresetColors;
  /** The radius base, or null to keep the Theme's own ("default"). */
  radiusBase: number | null;
  fonts: FontTokens;
};

export function previewValues(preset: Preset): PreviewValues {
  const heading = preset.headingFont === "inherit" ? preset.bodyFont : preset.headingFont;
  return {
    colors: composeColors(preset.baseColor, preset.accentColor),
    radiusBase: RADIUS_BASE[preset.radius],
    fonts: fontTokens(preset.bodyFont, heading),
  };
}

/**
 * The Theme's type ramp with the Preset's fonts: each Text Variant keeps its scaled size and line
 * height and takes the Preset's face and letter-spacing correction (as scaleTokens computes it
 * from tokens.fonts in a user's app).
 */
export function presetType<V extends TextVariant>(
  fonts: FontTokens,
  scaled: Record<V, TypeStyle>,
  scale: number,
): Record<V, TypeStyle> {
  return Object.fromEntries(
    (Object.keys(scaled) as V[]).map((variant) => {
      const step = typeRamp[variant];
      const font = fonts[step.role];
      return [
        variant,
        {
          ...scaled[variant],
          fontFamily: font[step.face],
          letterSpacing: (step.tracking + font.letterSpacing * step.size) * scale,
        },
      ];
    }),
  ) as Record<V, TypeStyle>;
}
