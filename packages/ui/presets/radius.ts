import type { Radius } from "preset";

/**
 * The radius base, in points, behind each Radius option (every radius step derives from it, see
 * `radius()` in theme/tokens.ts). `null` for "default": the Theme's own base stays.
 */
export const RADIUS_BASE: Record<Radius, number | null> = {
  default: null,
  none: 0,
  small: 7,
  medium: 10,
  large: 14,
};
