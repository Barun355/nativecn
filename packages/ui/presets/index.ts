/**
 * Preset ingredients (never copied into apps). Used by the Registry build, the CLI and the builder.
 */
export { ACCENT_COLORS, BASE_COLORS } from "./source.ts";
export {
  ACCENT_COLOR_VALUES,
  BASE_COLOR_VALUES,
  CONTRAST_ADJUSTMENTS,
  SHARED_COLOR_VALUES,
} from "./colors.generated.ts";
export { COLOUR_ROLES, composeColors, isAccentColor, isBaseColor } from "./colors.ts";
export { contrastRatio, WCAG_AA } from "./color-math.ts";
export { CONTRAST_PAIRS } from "./types.ts";
export { contrastFailures } from "./contrast.ts";
export type {
  AccentColor,
  AccentColourRoles,
  AccentRole,
  BaseColor,
  BaseColourRoles,
  BaseRole,
  ColourRole,
  ColourRoles,
  ContrastAdjustment,
  PresetColors,
  SchemeName,
  SharedColourRoles,
  SharedRole,
} from "./types.ts";
