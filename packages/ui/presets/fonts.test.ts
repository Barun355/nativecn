/**
 * @jest-environment node
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  FONT_FACES,
  FONT_IDS,
  FONTS,
  fontFilePath,
  fontLicensePath,
  fontTokens,
  presetFontFiles,
  trackedLetterSpacing,
} from "./fonts";

const PUBLIC = join(__dirname, "../../../apps/web/public");

/** Reads name ID 6 (PostScript name) from a TrueType file's `name` table. */
function postScriptName(file: string): string | undefined {
  const buf = readFileSync(file);
  const numTables = buf.readUInt16BE(4);
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (buf.toString("latin1", rec, rec + 4) !== "name") continue;
    const table = buf.readUInt32BE(rec + 8);
    const count = buf.readUInt16BE(table + 2);
    const strings = table + buf.readUInt16BE(table + 4);
    for (let j = 0; j < count; j++) {
      const r = table + 6 + j * 12;
      const platform = buf.readUInt16BE(r);
      const nameId = buf.readUInt16BE(r + 6);
      if (nameId !== 6) continue;
      const length = buf.readUInt16BE(r + 8);
      const start = strings + buf.readUInt16BE(r + 10);
      const raw = buf.subarray(start, start + length);
      if (platform === 1) return raw.toString("latin1");
      // Windows / Unicode platforms store UTF-16BE.
      return Buffer.from(raw).swap16().toString("utf16le");
    }
  }
  return undefined;
}

describe("font data", () => {
  test("font ids keep their append-only order", () => {
    expect(FONT_IDS).toEqual([
      "inter",
      "geist",
      "dm-sans",
      "figtree",
      "lora",
      "source-serif-4",
      "geist-mono",
      "jetbrains-mono",
    ]);
    expect(Object.keys(FONTS).sort()).toEqual([...FONT_IDS].sort());
  });

  test.each(FONT_IDS)("%s has every face file and an OFL.txt", (id) => {
    for (const face of FONT_FACES) {
      expect(existsSync(join(PUBLIC, fontFilePath(id, face)))).toBe(true);
    }
    expect(existsSync(join(PUBLIC, fontLicensePath(id)))).toBe(true);
    expect(readFileSync(join(PUBLIC, fontLicensePath(id)), "utf8")).toMatch(
      /SIL Open Font License/,
    );
  });

  test.each(FONT_IDS)("%s file names match their PostScript names", (id) => {
    for (const face of FONT_FACES) {
      const ps = FONTS[id].faces[face];
      expect(FONTS[id].files[face]).toBe(`${ps}.ttf`);
      expect(postScriptName(join(PUBLIC, fontFilePath(id, face)))).toBe(ps);
    }
  });

  test.each(FONT_IDS)("%s folder holds only its four faces and OFL.txt", (id) => {
    const expected = [...FONT_FACES.map((f) => FONTS[id].files[f]), "OFL.txt"].sort();
    expect(readdirSync(join(PUBLIC, "fonts", id)).sort()).toEqual(expected);
  });

  test("Inter is the letter-spacing baseline and corrections stay small", () => {
    expect(FONTS.inter.letterSpacingCorrection).toBe(0);
    for (const id of FONT_IDS) {
      expect(Math.abs(FONTS[id].letterSpacingCorrection)).toBeLessThanOrEqual(0.015);
    }
  });
});

describe("font tokens", () => {
  test("heading defaults to the body font", () => {
    expect(fontTokens("inter")).toEqual({
      body: {
        regular: "Inter-Regular",
        medium: "Inter-Medium",
        semibold: "Inter-SemiBold",
        bold: "Inter-Bold",
        letterSpacing: 0,
      },
      heading: {
        regular: "Inter-Regular",
        medium: "Inter-Medium",
        semibold: "Inter-SemiBold",
        bold: "Inter-Bold",
        letterSpacing: 0,
      },
    });
  });

  test("body and heading can differ", () => {
    const t = fontTokens("geist", "lora");
    expect(t.body.semibold).toBe("Geist-SemiBold");
    expect(t.heading.bold).toBe("Lora-Bold");
    expect(t.heading.letterSpacing).toBe(0.0125);
  });

  test("trackedLetterSpacing applies the em correction", () => {
    expect(trackedLetterSpacing(-0.8, 36, 0)).toBe(-0.8);
    expect(trackedLetterSpacing(-0.8, 36, 0.0125)).toBe(-0.35);
    expect(trackedLetterSpacing(0, 16, 0)).toBe(0);
    expect(Object.is(trackedLetterSpacing(0, 16, 0), -0)).toBe(false);
  });

  test("presetFontFiles lists each chosen font once", () => {
    expect(presetFontFiles("inter")).toEqual([
      "fonts/inter/Inter-Regular.ttf",
      "fonts/inter/Inter-Medium.ttf",
      "fonts/inter/Inter-SemiBold.ttf",
      "fonts/inter/Inter-Bold.ttf",
      "fonts/inter/OFL.txt",
    ]);
    expect(presetFontFiles("inter", "lora")).toHaveLength(10);
  });
});
