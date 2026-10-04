// The installed Preset's Colour Roles. `create`/`init` rewrite this file from the chosen
// Base Colour + Accent Colour; this default is the neutral / neutral Preset.
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
  mutedForeground: "#737373",
  accent: "#f5f5f5",
  accentForeground: "#171717",
  destructive: "#dc2626",
  destructiveForeground: "#ffffff",
  success: "#16a34a",
  successForeground: "#ffffff",
  warning: "#d97706",
  warningForeground: "#ffffff",
  info: "#0284c7",
  infoForeground: "#ffffff",
  border: "#e5e5e5",
  input: "#e5e5e5",
  ring: "#a3a3a3",
  overlay: "rgba(0,0,0,0.5)",
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
  mutedForeground: "#a3a3a3",
  accent: "#262626",
  accentForeground: "#fafafa",
  destructive: "#f87171",
  destructiveForeground: "#0a0a0a",
  success: "#4ade80",
  successForeground: "#0a0a0a",
  warning: "#fbbf24",
  warningForeground: "#0a0a0a",
  info: "#38bdf8",
  infoForeground: "#0a0a0a",
  border: "#2e2e2e",
  input: "#333333",
  ring: "#737373",
  overlay: "rgba(0,0,0,0.7)",
};

// `satisfies` keeps light and dark in lockstep: a role missing in either is a type error.
export const colors = { light, dark } satisfies Record<"light" | "dark", Record<string, string>>;

export type ColorRole = keyof typeof light;
export type Colors = typeof light;
