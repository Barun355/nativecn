// Every 0.1 Registry Item is reachable in the Showcase App (#77): each one maps to a route that
// exists, every Component is in a Components tab group, and every Block is on the Blocks tab.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

import {
  COMPONENT_GROUPS,
  LAYOUT_EXAMPLES,
  SCREEN_EXAMPLES,
  blockGroups,
  componentGroups,
  foundations,
  groupOf,
  isComponent,
  showcaseHref,
} from "../src/catalog.ts";
import { registryIndex } from "../src/registry-index.ts";

const APP = path.resolve(import.meta.dirname, "..", "src", "app");
const UI = path.resolve(import.meta.dirname, "..", "..", "..", "packages", "ui");
const names = Object.keys(registryIndex);

/**
 * The route file that serves an href, following Expo Router's file conventions. The drawer's
 * catch-all route answers only `/drawers/<panel>`: anything else must have a route of its own.
 */
function routeFile(href: string): string | undefined {
  const files = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? files(full) : [full];
    });
  const segments = href.split("/").filter(Boolean);
  return files(APP).find((file) => {
    const rel = path.relative(APP, file).replace(/\.tsx$/, "");
    if (rel.endsWith("_layout")) return false;
    const parts = rel
      .split(path.sep)
      .filter((p) => !/^\(.+\)$/.test(p))
      .filter((p, i, all) => !(p === "index" && i === all.length - 1));
    if (parts.at(-1)?.startsWith("[...")) return segments[0] === "drawers" && segments.length === 2;
    return (
      parts.length === segments.length &&
      parts.every((p, i) => p === segments[i] || /^\[[^.].*\]$/.test(p))
    );
  });
}

describe("every Registry Item is reachable", () => {
  test("each item has a Showcase route backed by a route file", () => {
    const missing = names.filter((name) => {
      const href = showcaseHref(registryIndex, name);
      return !href || !routeFile(href);
    });
    assert.deepEqual(missing, []);
  });

  test("layout and whole-Screen examples open on routes of their own", () => {
    for (const href of Object.values(LAYOUT_EXAMPLES)) assert.ok(routeFile(href), href);
    for (const name of SCREEN_EXAMPLES) {
      assert.ok(registryIndex[name], name);
      assert.ok(routeFile(`/example/${name}`), name);
    }
  });

  test("every example that is a Layout (an Expo Router navigator) is in LAYOUT_EXAMPLES", () => {
    const layouts = names.filter((name) => {
      if (registryIndex[name]!.type !== "registry:example") return false;
      const source = fs.readFileSync(path.join(UI, "examples", `${name}.tsx`), "utf8");
      return /from "expo-router\/(js-tabs|drawer|stack|tabs)"/.test(source);
    });
    assert.deepEqual(layouts.sort(), Object.keys(LAYOUT_EXAMPLES).sort());
  });
});

describe("Components tab", () => {
  test("all 30 Components appear, each in one of the five groups", () => {
    const components = names.filter((n) => isComponent(registryIndex[n]!));
    assert.equal(components.length, 30);
    const shown = componentGroups(registryIndex).flatMap((g) => g.items.map((i) => i.name));
    assert.deepEqual(shown.sort(), components.sort());
  });

  test("groups are Core, Forms, Display, Feedback and Navigation, in that order", () => {
    assert.deepEqual(
      componentGroups(registryIndex).map((g) => g.title),
      ["Core", "Forms", "Display", "Feedback", "Navigation"],
    );
  });

  test("the Feedback group has Toast, Alert, Skeleton and Progress", () => {
    const feedback = componentGroups(registryIndex).find((g) => g.id === "feedback")!;
    for (const name of ["toast", "alert", "skeleton", "progress"])
      assert.ok(
        feedback.items.some((i) => i.name === name),
        name,
      );
  });

  test("a category that is not a group falls back to a group (SchemeSwitcher → Core)", () => {
    assert.equal(groupOf({ category: "utility" }), "core");
    assert.equal(groupOf({ category: "something-new" }), "core");
    assert.equal(groupOf({ category: "forms" }), "forms");
  });

  test("search matches name, title, description and category, ignoring case", () => {
    const hits = (q: string) =>
      componentGroups(registryIndex, q).flatMap((g) => g.items.map((i) => i.name));
    assert.ok(hits("OTP").includes("input-otp"));
    assert.ok(hits("dark mode").includes("scheme-switcher"));
    assert.ok(hits("FEEDBACK").includes("toast"));
    assert.deepEqual(hits("no such thing"), []);
    assert.equal(hits("   ").length, 30);
  });

  test("Primitives, the Theme and helpers are listed as foundations", () => {
    const shown = foundations(registryIndex).map((i) => i.name);
    for (const name of ["pressable", "portal", "focus-chain", "theme", "announce", "use-motion"])
      assert.ok(shown.includes(name), name);
    assert.equal(COMPONENT_GROUPS.length, 5);
  });
});

describe("Blocks tab", () => {
  test("has the six Screen Blocks and the three drawer Blocks", () => {
    const { screens, drawers } = blockGroups(registryIndex);
    assert.deepEqual(
      screens.map((b) => b.name),
      ["sign-in-01", "sign-in-02", "sign-in-03", "sign-up-01", "sign-up-02", "sign-up-03"],
    );
    assert.deepEqual(
      drawers.map((b) => b.name),
      ["drawer-01", "drawer-02", "drawer-03"],
    );
  });

  test("every Block names the component it exports", () => {
    const { screens, drawers } = blockGroups(registryIndex);
    for (const block of [...screens, ...drawers]) assert.ok(block.component, block.name);
  });
});
