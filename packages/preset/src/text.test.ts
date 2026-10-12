import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Preset } from "./options.ts";
import { DEFAULT_PRESET, encodePreset } from "./preset.ts";
import {
  createCommand,
  describePreset,
  initCommand,
  optionLabel,
  presetFlags,
  promptForAi,
} from "./text.ts";

const NOVA_VIOLET: Preset = {
  style: "nova",
  baseColor: "zinc",
  accentColor: "violet",
  radius: "large",
  bodyFont: "lora",
  headingFont: "inter",
};

describe("optionLabel", () => {
  it("reads option ids as people write them", () => {
    assert.equal(optionLabel("vega"), "Vega");
    assert.equal(optionLabel("dm-sans"), "DM Sans");
    assert.equal(optionLabel("source-serif-4"), "Source Serif 4");
    assert.equal(optionLabel("jetbrains-mono"), "JetBrains Mono");
    assert.equal(optionLabel("inherit"), "Same as body");
  });
});

describe("describePreset", () => {
  it("names every setting in one line", () => {
    assert.equal(
      describePreset(NOVA_VIOLET),
      "Nova, zinc, violet accent, large radius, Lora with Inter headings",
    );
  });

  it("names one font when the headings use the Body Font", () => {
    assert.equal(
      describePreset(DEFAULT_PRESET),
      "Vega, neutral, neutral accent, default radius, Inter",
    );
    assert.equal(
      describePreset({ ...NOVA_VIOLET, headingFont: "lora" }),
      "Nova, zinc, violet accent, large radius, Lora",
    );
  });
});

describe("commands", () => {
  const code = encodePreset(NOVA_VIOLET);

  it("create and init take the short code", () => {
    assert.equal(
      createCommand(NOVA_VIOLET),
      `npx nativecn-cli@latest create my-app --preset ${code}`,
    );
    assert.equal(initCommand(NOVA_VIOLET), `npx nativecn-cli@latest init --preset ${code}`);
  });

  it("the long flags spell out all six settings, as the MCP's build_preset_code does", () => {
    assert.equal(
      presetFlags(NOVA_VIOLET),
      "--style nova --base zinc --accent violet --radius large --font lora --heading-font inter",
    );
    assert.equal(
      createCommand(NOVA_VIOLET, { longFlags: true }),
      `npx nativecn-cli@latest create my-app ${presetFlags(NOVA_VIOLET)}`,
    );
    assert.equal(
      initCommand(NOVA_VIOLET, { longFlags: true }),
      `npx nativecn-cli@latest init ${presetFlags(NOVA_VIOLET)}`,
    );
  });
});

describe("promptForAi", () => {
  it("names the code, the settings in words and the command", () => {
    assert.equal(
      promptForAi(NOVA_VIOLET),
      `Use the nativecn Preset ${encodePreset(NOVA_VIOLET)} (${describePreset(NOVA_VIOLET)}). Create the app with: ${createCommand(NOVA_VIOLET)}`,
    );
  });
});
