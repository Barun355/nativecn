import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DEFAULT_PRESET, encodePreset, type Preset } from "preset";

import { composeColors } from "../../../packages/ui/presets/colors.ts";
import { typeRamp } from "../../../packages/ui/theme/tokens.ts";
import {
  PRESET_CONTROLS,
  builderHref,
  presetFromSearch,
  presetType,
  previewValues,
  withSetting,
} from "./preset-builder.ts";

const NOVA_VIOLET: Preset = {
  style: "nova",
  baseColor: "zinc",
  accentColor: "violet",
  radius: "large",
  bodyFont: "lora",
  headingFont: "inter",
};

describe("the URL's ?preset=<code>", () => {
  test("a valid code opens its Preset", () => {
    const code = encodePreset(NOVA_VIOLET);
    assert.deepEqual(presetFromSearch(code), { preset: NOVA_VIOLET, invalid: false });
    assert.deepEqual(presetFromSearch([code]), { preset: NOVA_VIOLET, invalid: false });
  });

  test("no code opens the default Preset", () => {
    assert.deepEqual(presetFromSearch(undefined), { preset: DEFAULT_PRESET, invalid: false });
    assert.deepEqual(presetFromSearch(null), { preset: DEFAULT_PRESET, invalid: false });
    assert.deepEqual(presetFromSearch(""), { preset: DEFAULT_PRESET, invalid: false });
  });

  test("an invalid code opens the default Preset and says so (decoding is strict)", () => {
    for (const bad of ["b1", "a!!", "azzzzzzzz", "a01"])
      assert.deepEqual(presetFromSearch(bad), { preset: DEFAULT_PRESET, invalid: true }, bad);
  });

  test("builderHref round-trips through presetFromSearch", () => {
    const href = builderHref(NOVA_VIOLET);
    assert.equal(href, `/create?preset=${encodePreset(NOVA_VIOLET)}`);
    const code = new URL(href, "https://nativecn.dev").searchParams.get("preset");
    assert.deepEqual(presetFromSearch(code).preset, NOVA_VIOLET);
  });
});

describe("controls", () => {
  test("there is one control per Preset setting, in the decided order", () => {
    assert.deepEqual(
      PRESET_CONTROLS.map((c) => c.field),
      ["style", "baseColor", "accentColor", "radius", "bodyFont", "headingFont"],
    );
  });

  test("changing one setting keeps the others", () => {
    const next = withSetting(NOVA_VIOLET, "accentColor", "blue");
    assert.deepEqual(next, { ...NOVA_VIOLET, accentColor: "blue" });
    assert.notEqual(next, NOVA_VIOLET);
  });

  test("an option a control does not offer is rejected", () => {
    assert.throws(() => withSetting(NOVA_VIOLET, "accentColor", "chartreuse"), RangeError);
  });
});

describe("preview values (derived from the Preset, never by mutating the Theme)", () => {
  test("colours, radius and fonts follow the Preset", () => {
    const values = previewValues(NOVA_VIOLET);
    assert.deepEqual(values.colors, composeColors("zinc", "violet"));
    assert.equal(values.radiusBase, 14);
    assert.equal(values.fonts.body.regular, "Lora-Regular");
    assert.equal(values.fonts.heading.bold, "Inter-Bold");
  });

  test('the default radius keeps the Theme\'s own and "inherit" headings use the Body Font', () => {
    const values = previewValues(DEFAULT_PRESET);
    assert.equal(values.radiusBase, null);
    assert.equal(values.fonts.heading.bold, "Inter-Bold");
    assert.equal(
      previewValues({ ...NOVA_VIOLET, headingFont: "inherit" }).fonts.heading.bold,
      "Lora-Bold",
    );
  });

  test("each call returns new objects, so memoized readers see a change", () => {
    assert.notEqual(previewValues(NOVA_VIOLET).colors, previewValues(NOVA_VIOLET).colors);
  });

  test("the type ramp takes the Preset's faces and tracking, and keeps the scaled sizes", () => {
    const scaled = {
      h1: { fontFamily: "Inter-Bold", fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
      body: { fontFamily: "Inter-Regular", fontSize: 16, lineHeight: 24, letterSpacing: 0 },
    };
    const type = presetType(previewValues(NOVA_VIOLET).fonts, scaled, 1);
    // Headings use Inter (no correction), body text Lora (+0.0125 em).
    assert.deepEqual(type.h1, { ...scaled.h1, fontFamily: "Inter-Bold", letterSpacing: -0.6 });
    assert.equal(type.body.fontFamily, "Lora-Regular");
    assert.equal(type.body.letterSpacing, typeRamp.body.tracking + 0.0125 * typeRamp.body.size);
    assert.equal(type.body.fontSize, 16);
  });
});
