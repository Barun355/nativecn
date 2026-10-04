import { contrastRatio, WCAG_AA } from "./color-math.ts";
import { composeColors } from "./colors.ts";
import { ACCENT_COLORS, BASE_COLORS } from "./source.ts";
import { CONTRAST_PAIRS } from "./types.ts";

/**
 * Every Foreground pair below WCAG AA (4.5:1) across all Base × Accent Colour combinations, in
 * light and dark. Empty means every Preset is readable; the Registry build fails otherwise.
 */
export function contrastFailures(): string[] {
  const failures: string[] = [];
  for (const base of BASE_COLORS) {
    for (const accent of ACCENT_COLORS) {
      const colors = composeColors(base, accent);
      for (const scheme of ["light", "dark"] as const) {
        const roles = colors[scheme];
        for (const { foreground, surfaces } of CONTRAST_PAIRS) {
          for (const surface of surfaces) {
            const ratio = contrastRatio(roles[foreground], roles[surface]);
            if (ratio < WCAG_AA)
              failures.push(
                `${base}/${accent} ${scheme}: ${foreground} on ${surface} is ${ratio.toFixed(2)}:1`,
              );
          }
        }
      }
    }
  }
  return failures;
}
