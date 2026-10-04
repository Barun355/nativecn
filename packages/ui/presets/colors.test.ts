import { colors as runtimeDefaultColors } from "../theme/colors";
import { oklchToHex, parseOklch } from "./color-math.ts";
import { generatePresetColors } from "./generate.ts";
import {
  ACCENT_COLOR_VALUES,
  ACCENT_COLORS,
  BASE_COLOR_VALUES,
  BASE_COLORS,
  COLOUR_ROLES,
  CONTRAST_ADJUSTMENTS,
  CONTRAST_PAIRS,
  SHARED_COLOR_VALUES,
  WCAG_AA,
  composeColors,
  contrastFailures,
  contrastRatio,
} from "./index.ts";

describe("option lists", () => {
  // Append-only: the Preset short code (#50) encodes each option by its index.
  test("Base and Accent Colours keep their order", () => {
    expect(BASE_COLORS).toEqual(["neutral", "stone", "zinc", "mauve", "olive", "mist", "taupe"]);
    expect(ACCENT_COLORS).toEqual([
      ...["neutral", "stone", "zinc", "mauve", "olive", "mist", "taupe"],
      ...["amber", "blue", "cyan", "emerald", "fuchsia", "green", "indigo", "lime", "orange"],
      ...["pink", "purple", "red", "rose", "sky", "teal", "violet", "yellow"],
    ]);
  });
});

describe("oklch → hex", () => {
  test.each([
    ["oklch(1 0 0)", "#ffffff"],
    ["oklch(0.145 0 0)", "#0a0a0a"],
    ["oklch(0.577 0.245 27.325)", "#e7000b"], // Tailwind red-600 (out of sRGB, clipped)
    ["oklch(0.488 0.243 264.376)", "#1447e6"], // Tailwind blue-700
    ["oklch(0.723 0.219 149.579)", "#00c950"], // Tailwind green-500
    ["oklch(1 0 0 / 10%)", "#ffffff1a"],
  ])("%s → %s", (oklch, hex) => {
    expect(oklchToHex(oklch)).toBe(hex);
  });

  test("parses percentage lightness", () => {
    expect(parseOklch("oklch(57.7% 0.245 27.325)").l).toBeCloseTo(0.577, 10);
    expect(oklchToHex("oklch(57.7% 0.245 27.325)")).toBe("#e7000b");
  });
});

test("colors.generated.ts matches the generator (run `pnpm --filter ui generate:preset-colors`)", () => {
  const generated = generatePresetColors();
  expect(BASE_COLOR_VALUES).toEqual(generated.base);
  expect(ACCENT_COLOR_VALUES).toEqual(generated.accent);
  expect(SHARED_COLOR_VALUES).toEqual(generated.shared);
  expect(CONTRAST_ADJUSTMENTS).toEqual(generated.adjustments);
});

test("each recorded adjustment lifts a failing upstream Foreground to WCAG AA", () => {
  for (const { from, to } of CONTRAST_ADJUSTMENTS) {
    expect(from.ratio).toBeLessThan(WCAG_AA);
    expect(to.ratio).toBeGreaterThanOrEqual(WCAG_AA);
    expect(oklchToHex(to.oklch)).toBe(to.hex);
  }
});

describe.each(BASE_COLORS)("base %s", (base) => {
  test.each(ACCENT_COLORS)(`accent %s: every Foreground pair reaches WCAG AA`, (accent) => {
    const colors = composeColors(base, accent);
    const failures: string[] = [];
    for (const scheme of ["light", "dark"] as const) {
      const roles = colors[scheme];
      expect(Object.keys(roles)).toEqual([...COLOUR_ROLES]);
      for (const value of Object.values(roles))
        expect(value).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);

      for (const { foreground, surfaces } of CONTRAST_PAIRS) {
        for (const surface of surfaces) {
          const ratio = contrastRatio(roles[foreground], roles[surface]);
          if (ratio < WCAG_AA) {
            failures.push(`${scheme} ${foreground} on ${surface}: ${ratio.toFixed(2)}:1`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

test("contrastFailures(), which the Registry build runs, finds none", () => {
  expect(contrastFailures()).toEqual([]);
});

test("the Theme runtime's default colors.ts is the neutral / neutral Preset", () => {
  expect(runtimeDefaultColors).toEqual(composeColors("neutral", "neutral"));
});
