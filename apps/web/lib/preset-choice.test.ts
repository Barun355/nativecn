import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DEFAULT_PRESET, encodePreset, type Preset } from "preset";

import {
  PRESET_STORAGE_KEY,
  currentPreset,
  readRememberedPreset,
  rememberPreset,
} from "./preset-choice.ts";

const NOVA_VIOLET: Preset = {
  style: "nova",
  baseColor: "zinc",
  accentColor: "violet",
  radius: "large",
  bodyFont: "lora",
  headingFont: "inter",
};
const VEGA_ROSE: Preset = { ...DEFAULT_PRESET, accentColor: "rose" };

/** An in-memory Storage, or one whose every call throws (private mode, blocked site data). */
function storage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}
const throwing = {
  getItem: (): string | null => {
    throw new Error("SecurityError");
  },
  setItem: (): void => {
    throw new Error("QuotaExceededError");
  },
};

describe("the visitor's current Preset on a docs page", () => {
  test("the URL's ?preset=<code> comes first", () => {
    const got = currentPreset(`?preset=${encodePreset(NOVA_VIOLET)}`, encodePreset(VEGA_ROSE));
    assert.deepEqual(got, { preset: NOVA_VIOLET, from: "url" });
  });

  test("without one, the Preset last chosen on /create", () => {
    assert.deepEqual(currentPreset("", encodePreset(VEGA_ROSE)), {
      preset: VEGA_ROSE,
      from: "remembered",
    });
    assert.deepEqual(currentPreset("?q=button", encodePreset(VEGA_ROSE)), {
      preset: VEGA_ROSE,
      from: "remembered",
    });
  });

  test("an invalid URL code falls back to the remembered Preset, then the default", () => {
    assert.deepEqual(currentPreset("?preset=a!!", encodePreset(VEGA_ROSE)), {
      preset: VEGA_ROSE,
      from: "remembered",
    });
    assert.deepEqual(currentPreset("?preset=a!!", null), {
      preset: DEFAULT_PRESET,
      from: "default",
    });
  });

  test("a stale or tampered remembered code is ignored", () => {
    assert.deepEqual(currentPreset("", "zzz"), { preset: DEFAULT_PRESET, from: "default" });
  });

  test("nothing chosen: the default Preset", () => {
    assert.deepEqual(currentPreset("", null), { preset: DEFAULT_PRESET, from: "default" });
  });
});

describe("remembering the last Preset", () => {
  test("stores the short code and reads it back", () => {
    const s = storage();
    rememberPreset(s, NOVA_VIOLET);
    assert.equal(s.data.get(PRESET_STORAGE_KEY), encodePreset(NOVA_VIOLET));
    assert.equal(readRememberedPreset(s), encodePreset(NOVA_VIOLET));
  });

  test("nothing stored reads as null", () => {
    assert.equal(readRememberedPreset(storage()), null);
  });

  test("storage that throws or is missing never breaks the page", () => {
    assert.doesNotThrow(() => rememberPreset(throwing, NOVA_VIOLET));
    assert.equal(readRememberedPreset(throwing), null);
    assert.doesNotThrow(() => rememberPreset(undefined, NOVA_VIOLET));
    assert.equal(readRememberedPreset(undefined), null);
  });
});
