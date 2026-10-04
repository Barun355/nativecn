// The canonical Preset option lists (decision #5, global ADR 0006).
//
// APPEND-ONLY. A Preset code stores each setting as an index into these lists,
// so removing or reordering an entry silently changes the meaning of every code
// already shared. Add new options at the end only, then update options.lock.json
// in the same change (the guard test in preset.test.ts enforces this).

export const STYLES = ["vega", "nova"] as const;

export const BASE_COLORS = ["neutral", "stone", "zinc", "mauve", "olive", "mist", "taupe"] as const;

export const ACCENT_COLORS = [
  "neutral",
  "stone",
  "zinc",
  "mauve",
  "olive",
  "mist",
  "taupe",
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "teal",
  "violet",
  "yellow",
] as const;

export const RADII = ["default", "none", "small", "medium", "large"] as const;

export const FONTS = [
  "inter",
  "geist",
  "dm-sans",
  "figtree",
  "lora",
  "source-serif-4",
  "geist-mono",
  "jetbrains-mono",
] as const;

/** "inherit" means the Heading Font is the same as the Body Font. */
export const HEADING_FONTS = ["inherit", ...FONTS] as const;

export type Style = (typeof STYLES)[number];
export type BaseColor = (typeof BASE_COLORS)[number];
export type AccentColor = (typeof ACCENT_COLORS)[number];
export type Radius = (typeof RADII)[number];
export type Font = (typeof FONTS)[number];
export type HeadingFont = (typeof HEADING_FONTS)[number];

/** A Preset: the six settings chosen once at `create`/`init` and stored in components.json. */
export type Preset = {
  style: Style;
  baseColor: BaseColor;
  accentColor: AccentColor;
  radius: Radius;
  bodyFont: Font;
  headingFont: HeadingFont;
};

export type PresetField = keyof Preset;

/** Every option list, keyed by Preset field. */
export const PRESET_OPTIONS = {
  style: STYLES,
  baseColor: BASE_COLORS,
  accentColor: ACCENT_COLORS,
  radius: RADII,
  bodyFont: FONTS,
  headingFont: HEADING_FONTS,
} as const satisfies { [K in PresetField]: readonly Preset[K][] };
