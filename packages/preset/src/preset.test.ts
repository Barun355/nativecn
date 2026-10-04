import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { PRESET_OPTIONS, type Preset, type PresetField } from "./options.ts";
import {
  DEFAULT_PRESET,
  PRESET_FIELDS_V1,
  PRESET_VERSION,
  decodePreset,
  encodePreset,
  isValidPreset,
} from "./preset.ts";

const FIELDS = Object.keys(PRESET_OPTIONS) as PresetField[];

/** Every possible Preset (120,960 today: 2 × 7 × 24 × 5 × 8 × 9), generated lazily. */
function* allPresets(): Generator<Preset> {
  function* walk(i: number, partial: Partial<Preset>): Generator<Preset> {
    const key = FIELDS[i];
    if (key === undefined) {
      yield partial as Preset;
      return;
    }
    for (const option of PRESET_OPTIONS[key]) {
      yield* walk(i + 1, { ...partial, [key]: option });
    }
  }
  yield* walk(0, {});
}

/** Small seeded PRNG (mulberry32) so failures are reproducible. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("default Preset", () => {
  it("is Vega, neutral, neutral, default radius, Inter, headings inherit", () => {
    assert.deepEqual(DEFAULT_PRESET, {
      style: "vega",
      baseColor: "neutral",
      accentColor: "neutral",
      radius: "default",
      bodyFont: "inter",
      headingFont: "inherit",
    });
  });

  it("is index 0 of every list", () => {
    for (const key of FIELDS) assert.equal(DEFAULT_PRESET[key], PRESET_OPTIONS[key][0]);
  });

  it("encodes to a0 and back", () => {
    assert.equal(encodePreset(DEFAULT_PRESET), "a0");
    assert.equal(encodePreset(), "a0");
    assert.deepEqual(decodePreset("a0"), DEFAULT_PRESET);
  });
});

describe("encodePreset / decodePreset", () => {
  it("round-trips every single option of every field", () => {
    for (const key of FIELDS) {
      for (const option of PRESET_OPTIONS[key]) {
        const preset = { ...DEFAULT_PRESET, [key]: option } as Preset;
        const code = encodePreset(preset);
        assert.deepEqual(decodePreset(code), preset, `${key}=${option} (${code})`);
      }
    }
  });

  it("round-trips every possible Preset to a unique, short code", () => {
    const seen = new Set<string>();
    for (const preset of allPresets()) {
      const code = encodePreset(preset);
      assert.match(code, /^a[0-9A-Za-z]{1,5}$/);
      assert.ok(!seen.has(code), `duplicate code ${code}`);
      seen.add(code);
      assert.deepEqual(decodePreset(code), preset);
    }
    assert.equal(
      seen.size,
      FIELDS.reduce((n, key) => n * PRESET_OPTIONS[key].length, 1),
    );
  });

  it("round-trips random combinations", () => {
    const random = rng(50);
    for (let i = 0; i < 5000; i++) {
      const preset = Object.fromEntries(
        FIELDS.map((key) => {
          const options = PRESET_OPTIONS[key];
          return [key, options[Math.floor(random() * options.length)]];
        }),
      ) as Preset;
      assert.deepEqual(decodePreset(encodePreset(preset)), preset);
    }
  });

  it("fills missing fields from the default", () => {
    const code = encodePreset({ style: "nova", accentColor: "violet", headingFont: "lora" });
    assert.deepEqual(decodePreset(code), {
      ...DEFAULT_PRESET,
      style: "nova",
      accentColor: "violet",
      headingFont: "lora",
    });
  });

  it("throws on an unknown option", () => {
    assert.throws(() => encodePreset({ style: "not-a-style" as Preset["style"] }), RangeError);
    assert.throws(() => encodePreset({ bodyFont: "inherit" as Preset["bodyFont"] }), RangeError);
  });

  it("every decodable code re-encodes to itself", () => {
    const random = rng(28);
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < 20000; i++) {
      const length = 1 + Math.floor(random() * 6);
      let code = "a";
      for (let j = 0; j < length; j++) code += alphabet[Math.floor(random() * 62)];
      const preset = decodePreset(code);
      if (preset) assert.equal(encodePreset(preset), code);
    }
  });
});

describe("invalid codes", () => {
  const invalid = [
    "", // empty
    "a", // no body
    "0", // no version letter
    "b0", // unknown version
    "A0", // version is case-sensitive
    " a0", // whitespace
    "a0 ",
    "a-1", // not base-62
    "a_x",
    "a00", // leading zero (not canonical)
    "a01",
    "a999999", // too long
    "azzzzz", // past 27 bits
    encodePreset({ style: "nova" }).replace(/^a/, "b"),
  ];
  for (const code of invalid) {
    it(`rejects ${JSON.stringify(code)}`, () => {
      assert.equal(decodePreset(code), null);
      assert.equal(isValidPreset(code), false);
    });
  }

  it("rejects an index past the end of a list", () => {
    // Build raw codes with one field set to the first unused index.
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const toBase62 = (n: number): string =>
      n < 62 ? (alphabet[n] ?? "") : toBase62(Math.floor(n / 62)) + alphabet[n % 62];
    let offset = 0;
    for (const { key, bits } of PRESET_FIELDS_V1) {
      const firstUnused = PRESET_OPTIONS[key].length;
      if (firstUnused < 2 ** bits) {
        const code = `a${toBase62(firstUnused * 2 ** offset)}`;
        assert.equal(decodePreset(code), null, `${key} index ${firstUnused} (${code})`);
      }
      offset += bits;
    }
  });

  it("rejects non-strings", () => {
    assert.equal(decodePreset(undefined as unknown as string), null);
    assert.equal(decodePreset(42 as unknown as string), null);
  });

  it("accepts valid codes", () => {
    assert.equal(isValidPreset("a0"), true);
    assert.equal(
      isValidPreset(encodePreset({ style: "nova", headingFont: "jetbrains-mono" })),
      true,
    );
  });
});

describe("Preset code guard", () => {
  // options.lock.json is the committed snapshot of the version "a" layout and
  // option lists. Removing or reordering an option changes what existing codes
  // mean, so it fails here. Appending is allowed, but the lock must be updated
  // in the same change so the addition is deliberate.
  const lock = JSON.parse(
    readFileSync(join(import.meta.dirname, "..", "options.lock.json"), "utf8"),
  ) as {
    version: string;
    fields: { key: string; bits: number }[];
    options: Record<string, string[]>;
  };

  it("keeps the version letter", () => {
    assert.equal(PRESET_VERSION, lock.version);
  });

  it("keeps the field layout (order and bit widths)", () => {
    assert.deepEqual(
      PRESET_FIELDS_V1.map(({ key, bits }) => ({ key, bits })),
      lock.fields,
    );
  });

  it("covers exactly the locked fields", () => {
    assert.deepEqual(Object.keys(PRESET_OPTIONS).sort(), Object.keys(lock.options).sort());
  });

  for (const [key, locked] of Object.entries(lock.options)) {
    it(`never removes or reorders a ${key} option`, () => {
      const current: readonly string[] = PRESET_OPTIONS[key as PresetField] ?? [];
      assert.deepEqual(
        current.slice(0, locked.length),
        locked,
        `${key} options were removed or reordered; existing Preset codes would change meaning`,
      );
    });

    it(`has every appended ${key} option recorded in options.lock.json`, () => {
      const current: readonly string[] = PRESET_OPTIONS[key as PresetField] ?? [];
      assert.deepEqual(
        current,
        locked,
        `${key} gained options; append them to options.lock.json in the same change`,
      );
    });
  }

  it("fits every list in its bit width", () => {
    for (const { key, bits } of PRESET_FIELDS_V1) {
      assert.ok(PRESET_OPTIONS[key].length <= 2 ** bits, `${key} overflows ${bits} bits`);
    }
  });

  it("stays under the 53-bit safe-integer limit", () => {
    const total = PRESET_FIELDS_V1.reduce((sum, f) => sum + f.bits, 0);
    assert.ok(total <= 53);
  });

  it("has no duplicate options", () => {
    for (const key of FIELDS) {
      assert.equal(new Set(PRESET_OPTIONS[key]).size, PRESET_OPTIONS[key].length, key);
    }
  });
});
