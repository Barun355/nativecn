import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { build } from "./build.ts";
import { hasSlotCall, inlineSlots, readSlotFills } from "./inline-slots.ts";

const FIXTURES = path.join(import.meta.dirname, "__fixtures__");
const read = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));

test("builds one JSON per item per Style with Slots inlined", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "nativecn-r-"));
  const result = await build({ root: FIXTURES, out, presets: false, quiet: true });
  assert.deepEqual(result.styles, ["nova", "vega"]);
  const flat = (s: string) => s.replace(/\s+/g, " ");
  const vega = flat(read(path.join(out, "styles/vega/sample.json")).files[0].content as string);
  const nova = flat(read(path.join(out, "styles/nova/sample.json")).files[0].content as string);
  assert.match(
    vega,
    /root: \{ height: tk\.controlHeight\.md, borderRadius: tk\.radius\.md, \.\.\.tk\.type\.body,? \}/,
  );
  assert.match(
    nova,
    /root: \{ height: tk\.controlHeight\.sm, borderRadius: tk\.radius\.sm, \.\.\.tk\.type\.body,? \}/,
  );
  assert.match(nova, /transform: \[\{ scale: 0\.98 \}\]/);
  for (const content of [vega, nova]) {
    assert.doesNotMatch(content, /slot\(/);
    assert.doesNotMatch(content, /@\/registry\/styles/);
    assert.match(content, /from "@\/registry\/theme"/);
  }
  const index = read(path.join(out, "styles/vega/registry.json"));
  assert.equal(index.items[0].name, "sample");
  assert.equal(
    read(path.join(out, "styles/vega/sample.json")).files[0].target,
    "{components}/sample.tsx",
  );
  fs.rmSync(out, { recursive: true, force: true });
});

test("fails on an unknown Slot", () => {
  const fills = readSlotFills(fs.readFileSync(path.join(FIXTURES, "styles/vega.ts"), "utf8"));
  assert.throws(
    () => inlineSlots('const s = slot("nope.root", t);', fills, "x.tsx"),
    /unknown Slot "nope.root"/,
  );
});

test("the leftover slot() check reads code, not comments or strings", () => {
  const fills = readSlotFills(fs.readFileSync(path.join(FIXTURES, "styles/vega.ts"), "utf8"));
  const source = [
    "// Each Style fills slot(name, theme) at build time.",
    'const note = "slot( is inlined";',
    'const s = slot("sample.root", t);',
  ].join("\n");
  const out = inlineSlots(source, fills, "x.tsx");
  assert.match(out, /slot\(name, theme\)/);
  assert.match(out, /"slot\( is inlined"/);
  assert.equal(hasSlotCall(out), false);
  assert.equal(hasSlotCall('const s = slot("a", t);'), true);
});

test("fails when a Slot fill itself calls slot()", () => {
  const fills = readSlotFills(
    'export const vega = defineStyle({ "a.root": (t) => ({ ...slot("b.root", t) }), "b.root": (t) => ({ height: 1 }) });',
  );
  assert.throws(
    () => inlineSlots('const s = slot("a.root", t);', fills, "x.tsx"),
    /slot\(\) left after inlining/,
  );
});

test("fails when a Style misses a Slot", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nativecn-fx-"));
  fs.cpSync(FIXTURES, root, { recursive: true });
  fs.writeFileSync(
    path.join(root, "styles/nova.ts"),
    'export const nova = defineStyle({ "sample.root": (t) => ({ height: 1 }) });',
  );
  return assert
    .rejects(
      build({ root, out: path.join(root, "out"), presets: false, quiet: true }),
      /does not fill the same Slots/,
    )
    .finally(() => fs.rmSync(root, { recursive: true, force: true }));
});

test("fails on an invalid item or a target without a Destination", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nativecn-fx-"));
  fs.cpSync(FIXTURES, root, { recursive: true });
  fs.writeFileSync(
    path.join(root, "components/_registry.ts"),
    'export default [{ name: "sample", type: "registry:ui", files: [{ path: "components/sample.tsx", type: "registry:ui", target: "src/components/sample.tsx" }] }];',
  );
  await assert.rejects(
    build({ root, out: path.join(root, "out"), presets: false, quiet: true }),
    /needs a target starting with/,
  );
  fs.rmSync(root, { recursive: true, force: true });
});

test("the real Registry builds, with Preset ingredients", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "nativecn-real-"));
  const result = await build({ out, quiet: true });
  assert.ok(result.items.includes("theme"));
  const presets = read(path.join(out, "presets/index.json"));
  assert.equal(presets.baseColor.length, 7);
  assert.equal(presets.accentColor.length, 24);
  assert.ok(fs.existsSync(path.join(out, "presets/accent/violet.json")));
  assert.ok(fs.existsSync(path.join(out, "presets/fonts/inter.json")));
  fs.rmSync(out, { recursive: true, force: true });
});
