// All 8 Preset fonts are bundled (#29), so the Theme tab can switch Body and Heading Font live.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { FONT_FACES, FONT_IDS, FONTS } from "../../../packages/ui/presets/fonts.ts";

const SRC = path.resolve(import.meta.dirname, "..", "src");
// Whitespace-free, so Prettier's line breaks don't matter.
const source = fs.readFileSync(path.join(SRC, "fonts.ts"), "utf8").replace(/\s+/g, "");

test("src/fonts.ts loads every face of every Preset font, by its PostScript name", () => {
  const missing: string[] = [];
  for (const id of FONT_IDS) {
    for (const face of FONT_FACES) {
      const name = FONTS[id].faces[face];
      const file = `../../web/public/fonts/${id}/${FONTS[id].files[face]}`;
      const line = `${JSON.stringify(name)}:require(${JSON.stringify(file)})`;
      if (!source.includes(line)) missing.push(line);
      else assert.ok(fs.existsSync(path.resolve(SRC, file)), file);
    }
  }
  assert.deepEqual(missing, []);
});
