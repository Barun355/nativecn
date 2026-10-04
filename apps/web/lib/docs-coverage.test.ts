import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import { loadItems } from "../../../packages/ui/scripts/registry/build.ts";
import type { RegistryIndexItem } from "../../../packages/cli/src/registry.ts";
import { allDocs, type DocPage } from "./docs-config.ts";
import { docsCoverageProblems, hasItemPages } from "./docs-coverage.ts";

const UI = path.resolve(import.meta.dirname, "../../../packages/ui");

const page = (slug: string): DocPage => ({ slug, title: slug, description: "" });
const ui = (name: string, meta?: Record<string, unknown>): RegistryIndexItem => ({
  name,
  type: "registry:ui",
  meta,
  files: [
    { path: `components/${name}.tsx`, type: "registry:ui", target: `{components}/${name}.tsx` },
  ],
});

test("every Component has a docs page, examples, a props table and a11y; every Block a page", async (t) => {
  if (!hasItemPages(allDocs)) {
    // Vacuous until the component and Block docs pages land (#76).
    t.skip(
      "no components/<item> or blocks/<item> docs pages yet (#76): docs coverage not enforced",
    );
    return;
  }
  const items: RegistryIndexItem[] = (await loadItems(UI)).map((item) => ({
    ...item,
    files: item.files?.map((f) => ({ path: f.path, type: f.type, target: f.target ?? "" })),
  }));
  assert.deepEqual(docsCoverageProblems(items, allDocs), []);
});

test("a fully documented Component passes", () => {
  const items = [
    ui("button", { props: { label: "text" }, a11y: ["role button."] }),
    { ...ui("button-demo"), type: "registry:example" },
  ];
  assert.deepEqual(docsCoverageProblems(items, [page("components/button")]), []);
});

test("flags a Component without a page, examples or props", () => {
  assert.deepEqual(docsCoverageProblems([ui("badge")], []), [
    "badge: no docs page (components/badge)",
    'badge: no usage examples (a "badge-demo" item or meta.examples)',
    "badge: no props table (meta.props)",
    "badge: no accessibility notes (meta.a11y)",
  ]);
});

test("meta.examples counts as examples; Primitives and Blocks are judged by their kind", () => {
  const primitive: RegistryIndexItem = {
    name: "pressable",
    type: "registry:ui",
    files: [
      {
        path: "components/primitives/pressable.tsx",
        type: "registry:ui",
        target: "{components}/primitives/pressable.tsx",
      },
    ],
  };
  const block: RegistryIndexItem = { name: "sign-in-01", type: "registry:block" };
  const items = [
    ui("card", { props: { title: "text" }, examples: ["card-in-list"], a11y: "role button." }),
    primitive,
    block,
  ];
  assert.deepEqual(docsCoverageProblems(items, [page("components/card")]), [
    "sign-in-01: no docs page (blocks/sign-in-01)",
  ]);
  assert.equal(hasItemPages([page("blocks/sign-in-01")]), true);
  assert.equal(hasItemPages([page("cli")]), false);
});
