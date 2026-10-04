import { ACCENT_COLOR_VALUES, BASE_COLOR_VALUES, SHARED_COLOR_VALUES } from "./colors.generated.ts";
import { ACCENT_COLORS, BASE_COLORS } from "./source.ts";
import type { AccentColor, BaseColor, ColourRole, ColourRoles, PresetColors } from "./types.ts";

/** The order Colour Roles are written in `{theme}/colors.ts`. */
export const COLOUR_ROLES = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "destructiveForeground",
  "success",
  "successForeground",
  "warning",
  "warningForeground",
  "info",
  "infoForeground",
  "border",
  "input",
  "ring",
  "overlay",
] as const satisfies readonly ColourRole[];

export function isBaseColor(value: string): value is BaseColor {
  return (BASE_COLORS as readonly string[]).includes(value);
}

export function isAccentColor(value: string): value is AccentColor {
  return (ACCENT_COLORS as readonly string[]).includes(value);
}

/**
 * The full light and dark Colour Role set for a Preset's Base and Accent Colour, in hex. The CLI
 * writes this into the user's `{theme}/colors.ts` at create/init.
 */
export function composeColors(base: BaseColor, accent: AccentColor): PresetColors {
  const baseValues = BASE_COLOR_VALUES[base];
  const accentValues = ACCENT_COLOR_VALUES[accent];
  if (!baseValues) throw new Error(`Unknown Base Colour "${base}"`);
  if (!accentValues) throw new Error(`Unknown Accent Colour "${accent}"`);

  const scheme = (name: "light" | "dark"): ColourRoles => {
    const merged: ColourRoles = {
      ...baseValues[name],
      ...accentValues[name],
      ...SHARED_COLOR_VALUES[name],
    };
    return Object.fromEntries(COLOUR_ROLES.map((role) => [role, merged[role]])) as ColourRoles;
  };
  return { light: scheme("light"), dark: scheme("dark") };
}
