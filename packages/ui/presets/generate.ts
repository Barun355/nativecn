/**
 * Turns the oklch source data into hex Colour Roles, raising any Foreground that misses WCAG AA.
 * Pure and deterministic: `scripts/generate-preset-colors.ts` writes its output to
 * `colors.generated.ts`, and a Jest test fails if that file drifts from this function's output.
 */
import {
  WCAG_AA,
  contrastRatio,
  formatOklch,
  oklchToHex,
  parseOklch,
  relativeLuminance,
} from "./color-math.ts";
import {
  ACCENT_COLORS,
  BASE_COLORS,
  SHADCN_ACCENT_THEMES,
  SHADCN_BASE_THEMES,
  TAILWIND,
  type AccentColor,
  type BaseColor,
  type SchemeName,
} from "./source.ts";
import {
  ACCENT_ROLES,
  BASE_ROLES,
  type AccentColourRoles,
  type BaseColourRoles,
  type ColourRole,
  type ContrastAdjustment,
  type SharedColourRoles,
} from "./types.ts";

const SCHEMES: readonly SchemeName[] = ["light", "dark"];

type TailwindStep = keyof typeof TAILWIND;

/**
 * Status Colour Roles, chosen per Scheme from Tailwind steps. Light uses a dark step under a
 * near-white Foreground; dark uses a light step under a near-black Foreground (as shadcn's
 * `destructive` does: red-600 light, red-400 dark). The 700 steps are used in light for
 * success/warning/info because their 600 steps can't carry near-white text at 4.5:1.
 */
export const STATUS_STEPS: Record<
  "destructive" | "success" | "warning" | "info",
  Record<SchemeName, { surface: TailwindStep; foreground: TailwindStep }>
> = {
  destructive: {
    light: { surface: "red-600", foreground: "red-50" },
    dark: { surface: "red-400", foreground: "red-950" },
  },
  success: {
    light: { surface: "green-700", foreground: "green-50" },
    dark: { surface: "green-400", foreground: "green-950" },
  },
  warning: {
    light: { surface: "amber-700", foreground: "amber-50" },
    dark: { surface: "amber-400", foreground: "amber-950" },
  },
  info: {
    light: { surface: "sky-700", foreground: "sky-50" },
    dark: { surface: "sky-400", foreground: "sky-950" },
  },
};

/**
 * The modal scrim: black at 50% (light) and 70% (dark), as 8-digit hex (`#rrggbbaa`), which
 * React Native reads natively. Same format as shadcn's translucent dark `border`/`input`.
 */
export const OVERLAY: Record<SchemeName, string> = { light: "#00000080", dark: "#000000b3" };

/** oklch lightness step used when nudging a failing Foreground. */
const STEP = 0.005;

/**
 * Returns `foreground` as hex, nudging its oklch lightness away from the surfaces (darker if it is
 * darker than them, lighter otherwise; chroma and hue kept) in 0.005 steps until it reaches
 * WCAG AA on every surface. Records the change in `adjustments`.
 */
function resolveForeground(
  foreground: string,
  surfaces: readonly string[],
  context: { ingredient: string; scheme: SchemeName; role: ColourRole },
  adjustments: ContrastAdjustment[],
): string {
  const minRatio = (hex: string) => Math.min(...surfaces.map((s) => contrastRatio(hex, s)));
  const original = parseOklch(foreground);
  const originalHex = oklchToHex(original);
  const originalRatio = minRatio(originalHex);
  if (originalRatio >= WCAG_AA) return originalHex;

  const direction = relativeLuminance(originalHex) < relativeLuminance(surfaces[0]!) ? -1 : 1;
  let candidate = original;
  let hex = originalHex;
  while (minRatio(hex) < WCAG_AA) {
    const l = Number((candidate.l + direction * STEP).toFixed(3));
    if (l < 0 || l > 1) {
      throw new Error(
        `${context.ingredient} ${context.scheme} ${context.role}: no lightness reaches ${WCAG_AA}:1`,
      );
    }
    candidate = { ...candidate, l };
    hex = oklchToHex(candidate);
  }
  adjustments.push({
    ...context,
    from: { oklch: foreground, hex: originalHex, ratio: round2(originalRatio) },
    to: { oklch: formatOklch(candidate), hex, ratio: round2(minRatio(hex)) },
  });
  return hex;
}

const round2 = (n: number) => Math.floor(n * 100) / 100;

const kebab = (role: string) => role.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);

export type GeneratedPresetColors = {
  base: Record<BaseColor, Record<SchemeName, BaseColourRoles>>;
  accent: Record<AccentColor, Record<SchemeName, AccentColourRoles>>;
  shared: Record<SchemeName, SharedColourRoles>;
  adjustments: ContrastAdjustment[];
};

export function generatePresetColors(): GeneratedPresetColors {
  const adjustments: ContrastAdjustment[] = [];

  const base = {} as GeneratedPresetColors["base"];
  for (const name of BASE_COLORS) {
    base[name] = {} as Record<SchemeName, BaseColourRoles>;
    for (const scheme of SCHEMES) {
      const vars = SHADCN_BASE_THEMES[name][scheme] as Record<string, string>;
      const get = (role: string) => vars[kebab(role)]!;
      const roles = {} as BaseColourRoles;
      for (const role of BASE_ROLES) {
        if (!role.endsWith("Foreground")) roles[role] = oklchToHex(get(role));
      }
      for (const role of BASE_ROLES) {
        if (!role.endsWith("Foreground")) continue;
        const surface = role.replace(/Foreground$/, "") as keyof BaseColourRoles;
        const surfaces =
          role === "mutedForeground"
            ? [roles.muted, roles.background, roles.card]
            : role === "foreground"
              ? [roles.background]
              : [roles[surface]];
        roles[role] = resolveForeground(
          get(role),
          surfaces,
          { ingredient: `base/${name}`, scheme, role },
          adjustments,
        );
      }
      // Keep BASE_ROLES order in the output.
      base[name][scheme] = Object.fromEntries(
        BASE_ROLES.map((role) => [role, roles[role]]),
      ) as BaseColourRoles;
    }
  }

  const accent = {} as GeneratedPresetColors["accent"];
  for (const name of ACCENT_COLORS) {
    accent[name] = {} as Record<SchemeName, AccentColourRoles>;
    for (const scheme of SCHEMES) {
      // Grey accents take shadcn's base theme, ring included. Chromatic themes define no ring
      // (shadcn keeps the grey one); nativecn's Accent Colour owns `ring`, so it is the accent's
      // `primary`, as shadcn's earlier coloured themes did.
      const baseVars = (BASE_COLORS as readonly string[]).includes(name)
        ? SHADCN_BASE_THEMES[name as BaseColor][scheme]
        : undefined;
      const vars =
        baseVars ?? SHADCN_ACCENT_THEMES[name as Exclude<AccentColor, BaseColor>][scheme];
      const primary = oklchToHex(vars.primary);
      const roles: AccentColourRoles = {
        primary,
        primaryForeground: resolveForeground(
          vars["primary-foreground"],
          [primary],
          { ingredient: `accent/${name}`, scheme, role: "primaryForeground" },
          adjustments,
        ),
        ring: baseVars ? oklchToHex(baseVars.ring) : primary,
      };
      accent[name][scheme] = Object.fromEntries(
        ACCENT_ROLES.map((role) => [role, roles[role]]),
      ) as AccentColourRoles;
    }
  }

  const shared = {} as GeneratedPresetColors["shared"];
  for (const scheme of SCHEMES) {
    const roles = { overlay: OVERLAY[scheme] } as SharedColourRoles;
    for (const status of ["destructive", "success", "warning", "info"] as const) {
      const steps = STATUS_STEPS[status][scheme];
      const surface = oklchToHex(TAILWIND[steps.surface]);
      roles[status] = surface;
      roles[`${status}Foreground`] = resolveForeground(
        TAILWIND[steps.foreground],
        [surface],
        { ingredient: "shared", scheme, role: `${status}Foreground` },
        adjustments,
      );
    }
    shared[scheme] = {
      destructive: roles.destructive,
      destructiveForeground: roles.destructiveForeground,
      success: roles.success,
      successForeground: roles.successForeground,
      warning: roles.warning,
      warningForeground: roles.warningForeground,
      info: roles.info,
      infoForeground: roles.infoForeground,
      overlay: roles.overlay,
    };
  }

  return { base, accent, shared, adjustments };
}
