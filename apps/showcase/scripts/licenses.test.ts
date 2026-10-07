// The open-source licences screen lists every package the app ships and every bundled font, each
// with the licence its own package.json declares.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { FONT_IDS, FONTS } from "../../../packages/ui/presets/fonts.ts";
import { FONT_LICENCES, PACKAGE_LICENCES } from "../src/licenses.ts";

const APP = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(APP, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
};

test("every dependency is listed once, with its declared licence", () => {
  assert.deepEqual(
    PACKAGE_LICENCES.map((l) => l.name).sort(),
    Object.keys(pkg.dependencies).sort(),
  );
  for (const { name, licence } of PACKAGE_LICENCES) {
    // Read the file directly: some packages don't export ./package.json.
    const file = path.join(APP, "node_modules", name, "package.json");
    const declared = (JSON.parse(fs.readFileSync(file, "utf8")) as { license?: string }).license;
    assert.equal(licence, declared, name);
  }
});

test("every bundled font is listed", () => {
  assert.deepEqual(
    FONT_LICENCES.map((l) => l.name),
    FONT_IDS.map((id) => FONTS[id].name),
  );
});
