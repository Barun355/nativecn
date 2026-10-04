// Theme switches. One obvious place for app-wide behaviour (ADR 0004: font scaling off by default).
export const config = {
  /** Respect the OS font-size setting. Off by default; turn on for apps serving users who need larger text. */
  fontScaling: false,
  /** Light/dark before the user picks one: follow the system, or force a Scheme. */
  defaultScheme: "system" as "system" | "light" | "dark",
  /** Scale = shorter screen side ÷ baseline, clamped to [min, max]. */
  scale: { baseline: 390, min: 0.85, max: 1.25 },
  /** Light haptic tick on selection controls (Switch, Checkbox, Radio, SegmentedTabs, Chip, Slider). */
  haptics: true,
} as const;

export type ThemeConfig = typeof config;
