// Dependency coverage (#31): the Showcase App contains every Registry Item, so it must install every
// package an item needs, or the item breaks only once someone opens it on a device.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { loadItems } from "../../../packages/ui/scripts/registry/build.ts";
import { packageName } from "../../../packages/ui/scripts/registry/dependency-rule.ts";

const APP = path.resolve(import.meta.dirname, "..");
const UI = path.resolve(APP, "..", "..", "packages", "ui");

test("the Showcase App depends on every package a Registry Item needs", async () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(APP, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };
  const installed = new Set(Object.keys(pkg.dependencies ?? {}));
  const missing: string[] = [];
  for (const item of await loadItems(UI)) {
    for (const spec of [...(item.dependencies ?? []), ...(item.devDependencies ?? [])]) {
      const name = packageName(spec);
      if (!installed.has(name)) missing.push(`${name} (needed by "${item.name}")`);
    }
  }
  assert.deepEqual(
    [...new Set(missing)],
    [],
    "Add these to apps/showcase/package.json dependencies (npx expo install for SDK packages)",
  );
});
