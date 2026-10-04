// The installed Preset's Colour Roles. `create`/`init` rewrite this file from the chosen
// Base Colour + Accent Colour (`composeColors` in presets/); this default is the neutral / neutral
// Preset, kept identical to `composeColors("neutral", "neutral")` by presets/colors.test.ts.
const light = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  card: "#ffffff",
  cardForeground: "#0a0a0a",
  popover: "#ffffff",
  popoverForeground: "#0a0a0a",
  primary: "#171717",
  primaryForeground: "#fafafa",
  secondary: "#f5f5f5",
  secondaryForeground: "#171717",
  muted: "#f5f5f5",
  mutedForeground: "#707070",
  accent: "#f5f5f5",
  accentForeground: "#171717",
  destructive: "#e7000b",
  destructiveForeground: "#fff7f7",
  success: "#008236",
  successForeground: "#f0fdf4",
  warning: "#bb4d00",
  warningForeground: "#fffbeb",
  info: "#0069a8",
  infoForeground: "#f0f9ff",
  border: "#e5e5e5",
  input: "#e5e5e5",
  ring: "#a1a1a1",
  overlay: "#00000080",
};

const dark: typeof light = {
  background: "#0a0a0a",
  foreground: "#fafafa",
  card: "#171717",
  cardForeground: "#fafafa",
  popover: "#171717",
  popoverForeground: "#fafafa",
  primary: "#e5e5e5",
  primaryForeground: "#171717",
  secondary: "#262626",
  secondaryForeground: "#fafafa",
  muted: "#262626",
  mutedForeground: "#a1a1a1",
  accent: "#262626",
  accentForeground: "#fafafa",
  destructive: "#ff6467",
  destructiveForeground: "#460809",
  success: "#05df72",
  successForeground: "#032e15",
  warning: "#ffb900",
  warningForeground: "#461901",
  info: "#00bcff",
  infoForeground: "#052f4a",
  border: "#ffffff1a",
  input: "#ffffff26",
  ring: "#737373",
  overlay: "#000000b3",
};

// `satisfies` keeps light and dark in lockstep: a role missing in either is a type error.
export const colors = { light, dark } satisfies Record<"light" | "dark", Record<string, string>>;

export type ColorRole = keyof typeof light;
export type Colors = typeof light;
