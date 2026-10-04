// Preset short codes (decision #28), modelled on shadcn's
// packages/registry/src/preset/preset.ts.
//
// A code is a version letter followed by the base-62 form of one integer that
// packs the option index of every field. Version "a" packs, from the lowest
// bits up: style 4, baseColor 4, accentColor 6, radius 3, bodyFont 5,
// headingFont 5 (27 bits, well under JavaScript's 53-bit safe-integer limit).
//
// Compatibility rules:
//   1. Option lists are append-only (see options.ts).
//   2. A field's bit width never changes within a version.
//   3. A new kind of field means a new version letter ("b"), and decodePreset
//      must keep accepting "a".
// Browser-safe: no Node.js dependencies.

import { PRESET_OPTIONS, type Preset, type PresetField } from "./options.ts";

type FieldSpec = { readonly key: PresetField; readonly bits: number };

/** Field layout of version "a" codes, lowest bits first. Never edit; add a new version instead. */
export const PRESET_FIELDS_V1: readonly FieldSpec[] = [
  { key: "style", bits: 4 },
  { key: "baseColor", bits: 4 },
  { key: "accentColor", bits: 6 },
  { key: "radius", bits: 3 },
  { key: "bodyFont", bits: 5 },
  { key: "headingFont", bits: 5 },
];

export const PRESET_VERSION = "a";

const TOTAL_BITS = PRESET_FIELDS_V1.reduce((sum, f) => sum + f.bits, 0);
const MAX_VALUE = 2 ** TOTAL_BITS; // exclusive

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
// Longest base-62 body a version "a" code can have (2^27 - 1 needs 5 digits).
const MAX_BODY_LENGTH = Math.ceil(TOTAL_BITS / Math.log2(62));

/** Vega · neutral · neutral · default radius · Inter · headings same as body (decision #5). */
export const DEFAULT_PRESET: Readonly<Preset> = Object.freeze({
  style: "vega",
  baseColor: "neutral",
  accentColor: "neutral",
  radius: "default",
  bodyFont: "inter",
  headingFont: "inherit",
});

function toBase62(num: number): string {
  if (num === 0) return "0";
  let result = "";
  let n = num;
  while (n > 0) {
    result = BASE62[n % 62] + result;
    n = Math.floor(n / 62);
  }
  return result;
}

function fromBase62(str: string): number {
  let result = 0;
  for (const char of str) {
    const digit = BASE62.indexOf(char);
    if (digit === -1) return -1;
    result = result * 62 + digit;
  }
  return result;
}

/**
 * Encodes a Preset as a short code such as "a0" (the default).
 * Missing fields take their DEFAULT_PRESET value; an unknown option throws a RangeError.
 */
export function encodePreset(preset: Partial<Preset> = {}): string {
  const merged: Preset = { ...DEFAULT_PRESET, ...preset };
  // Multiplication instead of bitwise ops: JS bitwise operators truncate to 32 bits.
  let value = 0;
  let offset = 0;
  for (const { key, bits } of PRESET_FIELDS_V1) {
    const options: readonly string[] = PRESET_OPTIONS[key];
    const index = options.indexOf(merged[key]);
    if (index === -1) {
      throw new RangeError(`Unknown ${key} "${String(merged[key])}"`);
    }
    value += index * 2 ** offset;
    offset += bits;
  }
  return PRESET_VERSION + toBase62(value);
}

/**
 * Decodes a short code back into a Preset, or returns null if the code is not
 * one encodePreset could have produced (unknown version, bad characters,
 * leading zeros, out-of-range value, or an index past the end of a list).
 */
export function decodePreset(code: string): Preset | null {
  if (typeof code !== "string" || code[0] !== PRESET_VERSION) return null;
  const body = code.slice(1);
  if (body.length === 0 || body.length > MAX_BODY_LENGTH) return null;
  // Canonical form only, so each Preset has exactly one code.
  if (body.length > 1 && body[0] === "0") return null;

  const value = fromBase62(body);
  if (value < 0 || value >= MAX_VALUE) return null;

  const result: Partial<Record<PresetField, string>> = {};
  let offset = 0;
  for (const { key, bits } of PRESET_FIELDS_V1) {
    const index = Math.floor(value / 2 ** offset) % 2 ** bits;
    const options: readonly string[] = PRESET_OPTIONS[key];
    const option = options[index];
    if (option === undefined) return null;
    result[key] = option;
    offset += bits;
  }
  return result as Preset;
}

/** True if the code decodes to a Preset. */
export function isValidPreset(code: string): boolean {
  return decodePreset(code) !== null;
}
