import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { kindOf } from "../../../packages/cli/src/mcp/catalog.ts";
import {
  NEEDS_EXPO_ROUTER,
  PREVIEW_BLOCKS,
  PREVIEW_EXAMPLES,
  docsPreview,
  type PreviewItem,
} from "./docs-preview.ts";
import { sourceItems } from "./registry-source.ts";

const byName = new Map(sourceItems.map((i) => [i.name, i]));
const examplesOf = (name: string): string[] =>
  ((byName.get(name)?.meta as { examples?: string[] } | undefined)?.examples ?? []).slice();
const previewItem = (name: string): PreviewItem => ({
  name,
  kind: kindOf(byName.get(name)!),
  examples: examplesOf(name),
});
const pages = sourceItems.filter((i) => ["Component", "Block"].includes(kindOf(i)));

/** True when the item, an item it installs, or its usage example imports Expo Router. */
function importsExpoRouter(name: string, seen = new Set<string>()): boolean {
  if (seen.has(name)) return false;
  seen.add(name);
  const item = byName.get(name);
  if (!item) return false;
  const files = item.files ?? [];
  const source = files.some((f) =>
    /from "expo-router[/"]/.test(
      readFileSync(new URL(`../../../packages/ui/${f.path}`, import.meta.url), "utf8"),
    ),
  );
  return (
    source ||
    (item.registryDependencies ?? []).some((d) => importsExpoRouter(d, seen)) ||
    examplesOf(name).some((e) => importsExpoRouter(e, seen))
  );
}

describe("which docs pages show the live preview", () => {
  test("a Component shows its usage examples", () => {
    assert.deepEqual(docsPreview(previewItem("button")), {
      live: true,
      examples: ["button-demo"],
    });
  });

  test("a Screen Block shows the Block itself", () => {
    assert.deepEqual(docsPreview(previewItem("sign-in-01")), { live: true, block: "sign-in-01" });
  });

  test("an item that needs Expo Router shows the spec card, saying why", () => {
    for (const name of ["drawer", "tab-navigation", "drawer-01"]) {
      const got = docsPreview(previewItem(name));
      assert.equal(got?.live, false, name);
      assert.match((got as { reason: string }).reason, /Expo Router/, name);
    }
  });

  test("Primitives, Helpers and the Theme have no preview", () => {
    assert.equal(docsPreview({ name: "pressable", kind: "Primitive", examples: [] }), undefined);
    assert.equal(docsPreview({ name: "theme", kind: "Theme", examples: [] }), undefined);
  });

  test("a Component without an example in the preview falls back to the spec card", () => {
    const got = docsPreview({ name: "new-thing", kind: "Component", examples: ["new-thing-demo"] });
    assert.equal(got?.live, false);
  });

  test("exactly the items that import Expo Router (directly or through what they install) are listed as needing it", () => {
    const needs = pages.filter((i) => importsExpoRouter(i.name)).map((i) => i.name);
    assert.deepEqual([...NEEDS_EXPO_ROUTER].sort(), needs.sort());
  });

  test("every other Component and Block page is live: its examples and Blocks are in the preview", () => {
    for (const item of pages) {
      if (NEEDS_EXPO_ROUTER.has(item.name)) continue;
      assert.equal(docsPreview(previewItem(item.name))?.live, true, item.name);
    }
    const examples = pages
      .filter((i) => kindOf(i) === "Component" && !NEEDS_EXPO_ROUTER.has(i.name))
      .flatMap((i) => examplesOf(i.name));
    assert.deepEqual([...PREVIEW_EXAMPLES].sort(), examples.sort());
    const blocks = pages
      .filter((i) => kindOf(i) === "Block" && !NEEDS_EXPO_ROUTER.has(i.name))
      .map((i) => i.name);
    assert.deepEqual([...PREVIEW_BLOCKS].sort(), blocks.sort());
  });
});
