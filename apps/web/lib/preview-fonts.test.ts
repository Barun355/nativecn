import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { FONT_FACES, FONT_IDS, FONTS } from "../../../packages/ui/presets/fonts.ts";
import { previewFontFaces } from "./preview-fonts.ts";

test("every face of every Preset font is declared under its PostScript name", () => {
  const css = previewFontFaces();
  for (const id of FONT_IDS)
    for (const face of FONT_FACES) {
      const name = FONTS[id].faces[face];
      assert.ok(css.includes(`font-family:"${name}"`), name);
      assert.ok(css.includes(`url("/fonts/${id}/${FONTS[id].files[face]}")`), name);
    }
});

test("the declared files are the ones nativecn.dev serves", () => {
  const urls = [...previewFontFaces().matchAll(/url\("\/([^"]+)"\)/g)].map((m) => m[1]!);
  assert.equal(urls.length, FONT_IDS.length * FONT_FACES.length);
  for (const url of urls)
    assert.ok(existsSync(join(import.meta.dirname, "..", "public", url)), url);
});
