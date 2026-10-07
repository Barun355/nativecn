// The live Preset (#29, #28): `nativecn://preset/<code>` deep links, the Theme values a Preset
// applies, and the text shared for it.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

import {
  DEFAULT_PRESET,
  PRESET_OPTIONS,
  SCHEME,
  createCommand,
  describePreset,
  encodePreset,
  optionLabel,
  presetFromParam,
  presetLink,
  presetTheme,
  promptForAi,
  shareMessage,
  swatchColor,
  type Preset,
} from "../src/preset/preset.ts";

const NOVA_VIOLET: Preset = {
  style: "nova",
  baseColor: "zinc",
  accentColor: "violet",
  radius: "large",
  bodyFont: "lora",
  headingFont: "inter",
};

describe("deep links", () => {
  test("a valid code in the route param decodes to its Preset", () => {
    const code = encodePreset(NOVA_VIOLET);
    assert.deepEqual(presetFromParam(code), NOVA_VIOLET);
    assert.deepEqual(presetFromParam([code]), NOVA_VIOLET);
    assert.deepEqual(presetFromParam(` ${code} `), NOVA_VIOLET);
  });

  test("a missing or invalid code is null", () => {
    assert.equal(presetFromParam(undefined), null);
    assert.equal(presetFromParam(""), null);
    assert.equal(presetFromParam([]), null);
    assert.equal(presetFromParam("b123"), null);
    assert.equal(presetFromParam("a!!"), null);
    assert.equal(presetFromParam("azzzzzzzz"), null);
  });

  test("presetLink round-trips through presetFromParam", () => {
    const link = presetLink(NOVA_VIOLET);
    assert.ok(link.startsWith(`${SCHEME}://preset/`));
    assert.deepEqual(presetFromParam(link.split("/").at(-1)), NOVA_VIOLET);
  });

  test("the link's scheme is the app's scheme", () => {
    const appJson = JSON.parse(
      fs.readFileSync(path.join(import.meta.dirname, "..", "app.json"), "utf8"),
    ) as { expo: { scheme: string } };
    assert.equal(appJson.expo.scheme, SCHEME);
  });
});

describe("presetTheme", () => {
  test("the default Preset keeps the Theme's own radius and Inter", () => {
    const theme = presetTheme(DEFAULT_PRESET);
    assert.equal(theme.radiusBase, null);
    assert.equal(theme.fonts.body.regular, "Inter-Regular");
    assert.equal(theme.fonts.heading.bold, "Inter-Bold");
  });

  test("colours, radius and both fonts follow the Preset", () => {
    const theme = presetTheme(NOVA_VIOLET);
    assert.equal(theme.radiusBase, 14);
    assert.equal(theme.fonts.body.regular, "Lora-Regular");
    assert.equal(theme.fonts.body.letterSpacing, 0.0125);
    assert.equal(theme.fonts.heading.semibold, "Inter-SemiBold");
    assert.notEqual(theme.colors.light.primary, presetTheme(DEFAULT_PRESET).colors.light.primary);
    assert.deepEqual(Object.keys(theme.colors.light), Object.keys(theme.colors.dark));
  });

  test('headingFont "inherit" uses the Body Font for headings', () => {
    const theme = presetTheme({ ...NOVA_VIOLET, headingFont: "inherit" });
    assert.equal(theme.fonts.heading.bold, "Lora-Bold");
  });
});

describe("swatches", () => {
  test("every Base and Accent Colour has a hex swatch in both Schemes", () => {
    for (const field of ["baseColor", "accentColor"] as const)
      for (const option of PRESET_OPTIONS[field])
        for (const scheme of ["light", "dark"] as const)
          assert.match(swatchColor(field, option, scheme), /^#[0-9a-f]{6}$/i, option);
  });

  test("an Accent's swatch is the primary colour it applies", () => {
    assert.equal(
      swatchColor("accentColor", "violet", "light"),
      presetTheme({ ...DEFAULT_PRESET, accentColor: "violet" }).colors.light.primary,
    );
  });
});

describe("sharing", () => {
  test("the message has the code, the create command and the deep link", () => {
    const code = encodePreset(NOVA_VIOLET);
    const message = shareMessage(NOVA_VIOLET);
    assert.ok(message.includes(code));
    assert.ok(message.includes(createCommand(NOVA_VIOLET)));
    assert.ok(message.includes(presetLink(NOVA_VIOLET)));
    assert.equal(
      createCommand(NOVA_VIOLET),
      `npx nativecn-cli@latest create my-app --preset ${code}`,
    );
  });

  test("Copy for AI names the code, its settings and the command", () => {
    const prompt = promptForAi(NOVA_VIOLET);
    assert.ok(prompt.includes(encodePreset(NOVA_VIOLET)));
    assert.ok(prompt.includes(describePreset(NOVA_VIOLET)));
    assert.ok(prompt.includes(createCommand(NOVA_VIOLET)));
  });

  test("Presets are described in words", () => {
    assert.equal(
      describePreset(NOVA_VIOLET),
      "Nova, zinc, violet accent, large radius, Lora with Inter headings",
    );
    assert.equal(
      describePreset(DEFAULT_PRESET),
      "Vega, neutral, neutral accent, default radius, Inter",
    );
  });

  test("option ids read as names", () => {
    assert.equal(optionLabel("source-serif-4"), "Source Serif 4");
    assert.equal(optionLabel("dm-sans"), "DM Sans");
    assert.equal(optionLabel("jetbrains-mono"), "JetBrains Mono");
    assert.equal(optionLabel("inherit"), "Same as body");
  });
});
