import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import { ACCENT_COLOR_VALUES } from "../../../packages/ui/presets/colors.generated.ts";
import {
  ACCENT_COLORS,
  ACCENT_SWATCHES,
  DEFAULT_PRESET_CODE,
  EXAMPLE_PRESET_CODE,
  FONTS,
  FONT_GROUPS,
  SHOWCASE_SCREENS,
} from "./landing.ts";

test("the landing page shows the documented Preset codes", () => {
  assert.equal(DEFAULT_PRESET_CODE, "a0");
  assert.equal(EXAMPLE_PRESET_CODE, "a1Q17B");
});

test("accent swatches match the Registry's primary colours", () => {
  assert.deepEqual(Object.keys(ACCENT_SWATCHES), [...ACCENT_COLORS]);
  for (const accent of ACCENT_COLORS) {
    assert.deepEqual(
      ACCENT_SWATCHES[accent],
      {
        light: ACCENT_COLOR_VALUES[accent].light.primary,
        dark: ACCENT_COLOR_VALUES[accent].dark.primary,
      },
      accent,
    );
  }
});

test("every Preset font is listed once", () => {
  assert.equal(FONT_GROUPS.flatMap((g) => g.fonts).length, FONTS.length);
});

test("every Showcase screen has a light and a dark image", () => {
  for (const { id } of SHOWCASE_SCREENS) {
    for (const scheme of ["light", "dark"]) {
      const image = new URL(`../public/showcase/${id}-${scheme}.webp`, import.meta.url);
      assert.ok(existsSync(image), `missing public/showcase/${id}-${scheme}.webp`);
    }
  }
});
