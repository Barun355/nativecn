import type { AccentColor, BaseColor, SchemeName } from "./source.ts";

export type { AccentColor, BaseColor, SchemeName };

/** The neutral Colour Roles, picked by the Base Colour. */
export const BASE_ROLES = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "border",
  "input",
] as const;

/** The Colour Roles picked by the Accent Colour. */
export const ACCENT_ROLES = ["primary", "primaryForeground", "ring"] as const;

/** The Colour Roles every Preset shares (status colours and the modal scrim). */
export const SHARED_ROLES = [
  "destructive",
  "destructiveForeground",
  "success",
  "successForeground",
  "warning",
  "warningForeground",
  "info",
  "infoForeground",
  "overlay",
] as const;

export type BaseRole = (typeof BASE_ROLES)[number];
export type AccentRole = (typeof ACCENT_ROLES)[number];
export type SharedRole = (typeof SHARED_ROLES)[number];
export type ColourRole = BaseRole | AccentRole | SharedRole;

/** Hex values: `#rrggbb`, or `#rrggbbaa` for translucent roles (dark `border`/`input`, `overlay`). */
export type BaseColourRoles = Record<BaseRole, string>;
export type AccentColourRoles = Record<AccentRole, string>;
export type SharedColourRoles = Record<SharedRole, string>;
export type ColourRoles = Record<ColourRole, string>;

/** A full Preset palette: one value per Colour Role for each Scheme. */
export type PresetColors = Record<SchemeName, ColourRoles>;

/**
 * Every Foreground-on-surface pair that must reach WCAG AA (4.5:1) in both Schemes.
 * `mutedForeground` is also checked on `background` and `card`, where it is used for secondary text.
 */
export const CONTRAST_PAIRS: readonly {
  foreground: ColourRole;
  surfaces: readonly ColourRole[];
}[] = [
  { foreground: "foreground", surfaces: ["background"] },
  { foreground: "cardForeground", surfaces: ["card"] },
  { foreground: "popoverForeground", surfaces: ["popover"] },
  { foreground: "primaryForeground", surfaces: ["primary"] },
  { foreground: "secondaryForeground", surfaces: ["secondary"] },
  { foreground: "mutedForeground", surfaces: ["muted", "background", "card"] },
  { foreground: "accentForeground", surfaces: ["accent"] },
  { foreground: "destructiveForeground", surfaces: ["destructive"] },
  { foreground: "successForeground", surfaces: ["success"] },
  { foreground: "warningForeground", surfaces: ["warning"] },
  { foreground: "infoForeground", surfaces: ["info"] },
];

/** A Foreground the generator darkened or lightened to reach WCAG AA. */
export type ContrastAdjustment = {
  ingredient: string;
  scheme: SchemeName;
  role: ColourRole;
  from: { oklch: string; hex: string; ratio: number };
  to: { oklch: string; hex: string; ratio: number };
};
