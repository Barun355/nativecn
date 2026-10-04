// #137: code shown to a reader or an agent uses the imports `add` writes into a fresh `create`
// app (`@/components/…`, `@/theme`), never the Registry's own `@/registry/…` paths. Runs every
// real Registry item and its examples (file contents read from packages/ui with the vega Style
// Slots inlined, as the Registry build does, so no build is needed)
// through each output: the page model, the `.md` twin / Copy for AI, llms-full.txt and Copy to LLM.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { loadItems, loadStyles } from "../../../packages/ui/scripts/registry/build.ts";
import { inlineSlots } from "../../../packages/ui/scripts/registry/inline-slots.ts";
import type { RegistryIndexItem, RegistryItem } from "../../../packages/cli/src/registry.ts";
import { itemDoc, itemMarkdown } from "./item-doc.ts";
import { itemSlug } from "./item-pages.ts";
import { exampleNames, itemBundle } from "./llm-bundle.ts";
import { llmsFullTxt, pageMarkdown } from "./llms.ts";

const UI = path.resolve(import.meta.dirname, "../../../packages/ui");
const REPO_PATH = /@\/registry\//;

const vega = loadStyles(UI).get("vega")!;
const built = (file: string) => {
  const source = fs.readFileSync(path.join(UI, file), "utf8");
  return /\.(t|j)sx?$/.test(file) ? inlineSlots(source, vega, `vega:${file}`) : source;
};
// loadItems has already checked every file has a Destination target.
const items = (await loadItems(UI)).map((item) => ({
  ...item,
  files: item.files?.map((f) => ({ ...f, target: f.target!, content: built(f.path) })),
})) as RegistryItem[];
const index: RegistryIndexItem[] = items.map((item) => ({
  ...item,
  files: item.files?.map(({ path: p, type, target }) => ({ path: p, type, target })),
}));
const byName = new Map(items.map((i) => [i.name, i]));
const pages = items.filter((i) => itemSlug(i) !== undefined);

/** The first line of each output that still has a repo path, labelled. */
function leaks(outputs: Record<string, string>): string[] {
  return Object.entries(outputs).flatMap(([label, text]) => {
    const line = text.split("\n").find((l) => REPO_PATH.test(l));
    return line ? [`${label}: ${line.trim()}`] : [];
  });
}

test("the Registry source does use @/registry/ imports (so this guard means something)", () => {
  assert.ok(items.some((i) => i.files?.some((f) => REPO_PATH.test(f.content))));
  assert.ok(pages.some((p) => p.type === "registry:block"));
});

test("no docs output shows an @/registry/ import path (#137)", () => {
  const found: string[] = [];
  const bodies: { page: { slug: string; title: string; description: string }; body: string }[] = [];
  for (const item of pages) {
    const examples = exampleNames(index, item.name).map((n) => byName.get(n)!);
    const doc = itemDoc({ item, index, examples, style: "vega" });
    const page = { slug: itemSlug(item)!, title: doc.title, description: doc.description };
    bodies.push({ page, body: itemMarkdown(doc, { source: false }) });
    found.push(
      ...leaks({
        [`${item.name} page (Usage and Source)`]: JSON.stringify(doc, null, 1),
        [`${item.name} .md twin / Copy for AI`]: pageMarkdown({ page, body: itemMarkdown(doc) }),
        [`${item.name} Copy to LLM`]: itemBundle({ item, examples, style: "vega" }),
      }),
    );
  }
  found.push(...leaks({ "llms-full.txt": llmsFullTxt({ docs: bodies, items: [] }) }));
  assert.deepEqual(found, []);
});

test("docs code uses the default aliases a fresh create writes", () => {
  const button = byName.get("button")!;
  const examples = exampleNames(index, "button").map((n) => byName.get(n)!);
  const md = itemMarkdown(itemDoc({ item: button, index, examples, style: "vega" }));
  assert.match(md, /from "@\/components\/[\w/-]+"/);
  assert.match(md, /from "@\/theme"/);
});
