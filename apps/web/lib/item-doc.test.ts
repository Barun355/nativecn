import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import { loadItems } from "../../../packages/ui/scripts/registry/build.ts";
import type { RegistryIndexItem, RegistryItem } from "../../../packages/cli/src/registry.ts";
import { allDocs, findDoc } from "./docs-config.ts";
import { itemDoc, itemMarkdown, propTables, sentences, variantLists } from "./item-doc.ts";
import { itemSections, itemSlug } from "./item-pages.ts";
import { exampleNames } from "./llm-bundle.ts";
import { sourceItems } from "./registry-source.ts";

const UI = path.resolve(import.meta.dirname, "../../../packages/ui");

test("registry-source lists every item the Registry build loads", async () => {
  const built = (await loadItems(UI)).map((i) => i.name).sort();
  const listed = new Set(sourceItems.map((i) => i.name));
  const missing = built.filter((n) => !listed.has(n));
  assert.deepEqual(
    missing,
    [],
    `Import the _registry.ts that defines ${missing.join(", ")} in apps/web/lib/registry-source.ts`,
  );
});

test("every item except Examples gets a page, at the docs coverage slugs", () => {
  for (const item of sourceItems) {
    const slug = itemSlug(item);
    if (item.type === "registry:example") {
      assert.equal(slug, undefined, item.name);
      continue;
    }
    assert.ok(slug, `${item.name} has no page`);
    assert.equal(findDoc(slug)?.item, item.name);
  }
  assert.ok(allDocs.some((p) => p.slug === "components/button"));
  assert.ok(allDocs.some((p) => p.slug === "blocks/drawer-01"));
  assert.ok(allDocs.some((p) => p.slug === "primitives/pressable"));
  assert.ok(allDocs.some((p) => p.slug === "primitives/announce"));
});

test("a new item gets a page without any docs change", () => {
  const sections = itemSections([
    { name: "rating", type: "registry:ui", title: "Rating", meta: { kind: "Component" } },
    { name: "rating-demo", type: "registry:example" },
    { name: "sign-in-01", type: "registry:block", title: "Sign-in" },
  ]);
  assert.deepEqual(
    sections.map((s) => [s.title, s.pages.map((p) => p.slug)]),
    [
      ["Components", ["components/rating"]],
      ["Blocks", ["blocks/sign-in-01"]],
    ],
  );
});

test("props: one table per export, or one table for flat props", () => {
  assert.deepEqual(
    propTables({ Card: { onPress: "() => void" }, CardTitle: { children: "text" } }),
    [
      { name: "Card", rows: [{ name: "onPress", description: "() => void" }] },
      { name: "CardTitle", rows: [{ name: "children", description: "text" }] },
    ],
  );
  assert.deepEqual(propTables({ onSubmit: "(values) => void" }, "SignIn01"), [
    { name: "SignIn01", rows: [{ name: "onSubmit", description: "(values) => void" }] },
  ]);
  assert.deepEqual(propTables(undefined), []);
});

test("variants: a list or a list per prop", () => {
  assert.deepEqual(variantLists(["h1", "body"]), [{ values: ["h1", "body"] }]);
  assert.deepEqual(variantLists({ size: ["sm", "md"], empty: [] }), [
    { prop: "size", values: ["sm", "md"] },
  ]);
});

test("sentences keep e.g. and code intact", () => {
  assert.deepEqual(sentences("Use it (e.g. a form). Every item has a role. `a.b()` works."), [
    "Use it (e.g. a form).",
    "Every item has a role.",
    "`a.b()` works.",
  ]);
});

const screen = (name: string, difference: string): RegistryItem => ({
  name,
  type: "registry:block",
  title: name,
  categories: ["auth"],
  registryDependencies: ["button"],
  meta: {
    kind: "Block",
    route: "(auth)/sign-in",
    component: "SignIn01",
    difference,
    props: { onSubmit: "(values) => void" },
    docs: "Render it from a route. Every field has a label read by screen readers.",
  },
  files: [
    {
      path: `screens/${name}/index.tsx`,
      type: "registry:file",
      target: `{screens}/${name}/index.tsx`,
      content: "export function SignIn01() {}\n",
    },
  ],
});

test("a Screen Block page: route in the add command, difference, Block Variants, a11y", () => {
  const item = screen("sign-in-01", "Everything on one screen.");
  const index: RegistryIndexItem[] = [
    item,
    screen("sign-in-02", "Social first."),
    { name: "button", type: "registry:ui", title: "Button", meta: { kind: "Component" } },
  ];
  const doc = itemDoc({ item, index, style: "vega" });
  assert.deepEqual(doc.add.commands, [
    'npx nativecn-cli@latest add sign-in-01 --route "(auth)/sign-in"',
  ]);
  assert.ok(doc.add.notes.some((n) => n.includes("--feature auth")));
  assert.equal(doc.difference, "Everything on one screen.");
  assert.deepEqual(
    doc.blockVariants.map((v) => [v.name, v.current, v.href]),
    [
      ["sign-in-01", true, "/docs/blocks/sign-in-01"],
      ["sign-in-02", false, "/docs/blocks/sign-in-02"],
    ],
  );
  assert.deepEqual(doc.installs, [
    { name: "button", title: "Button", href: "/docs/components/button" },
  ]);
  assert.deepEqual(doc.accessibility, ["Every field has a label read by screen readers."]);
  assert.deepEqual(doc.notes, ["Render it from a route."]);
  assert.equal(doc.props[0]?.name, "SignIn01");

  const md = itemMarkdown(doc);
  assert.ok(md.includes("## What makes it different\n\nEverything on one screen."));
  assert.ok(md.includes("- **sign-in-01** (this page)"));
  assert.ok(md.includes("[sign-in-02](https://nativecn.dev/docs/blocks/sign-in-02)"));
  assert.ok(md.includes("### {screens}/sign-in-01/index.tsx"));
  assert.ok(!itemMarkdown(doc, { source: false }).includes("## Source"));
  assert.ok(!md.includes("## Screenshots"), "no screenshots until meta.screenshots exists");
});

test("a Component page lists its examples and Screenshots only when they exist", () => {
  const index: RegistryIndexItem[] = [
    { name: "badge", type: "registry:ui", meta: { kind: "Component", examples: ["badge-demo"] } },
    { name: "badge-demo", type: "registry:example" },
    { name: "badge-extra", type: "registry:ui" },
  ];
  assert.deepEqual(exampleNames(index, "badge"), ["badge-demo"]);
  assert.deepEqual(exampleNames(index, "badge-demo"), []);
  // A Block never borrows a related Component's demo.
  assert.deepEqual(
    exampleNames(
      [
        { name: "drawer-01", type: "registry:block" },
        { name: "drawer-demo", type: "registry:example" },
      ],
      "drawer-01",
    ),
    [],
  );

  const doc = itemDoc({
    item: {
      name: "badge",
      type: "registry:ui",
      meta: { kind: "Component", screenshots: { light: "/s/l.png" } },
    },
    index,
    style: "nova",
  });
  assert.deepEqual(doc.add.commands, ["npx nativecn-cli@latest add badge"]);
  assert.deepEqual(doc.add.notes, []);
  assert.ok(itemMarkdown(doc).includes("## Screenshots\n\n- [badge (light)](/s/l.png)"));
});
