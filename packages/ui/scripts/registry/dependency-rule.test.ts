import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { build, loadItems } from "./build.ts";
import {
  RECORDED_EXCEPTIONS,
  dependencyRuleViolations,
  loadPinnedModules,
  missingExceptionDecisions,
  packageName,
} from "./dependency-rule.ts";

const FIXTURES = path.join(import.meta.dirname, "__fixtures__");
const PINNED = { "react-native-svg": "15.15.4", "expo-haptics": "~57.0.3" };

test("packageName strips the version range, keeping scopes", () => {
  assert.equal(packageName("zustand@^5.0.15"), "zustand");
  assert.equal(packageName("react-native-svg"), "react-native-svg");
  assert.equal(
    packageName("@react-native-async-storage/async-storage"),
    "@react-native-async-storage/async-storage",
  );
  assert.equal(packageName("@scope/pkg@1.2.3"), "@scope/pkg");
});

test("SDK-pinned packages and recorded exceptions pass", () => {
  const items = [
    { name: "icon", dependencies: ["lucide-react-native@^1.51.0", "react-native-svg"] },
    { name: "toast", dependencies: ["zustand@^5.0.15"], devDependencies: ["expo-haptics"] },
  ];
  assert.deepEqual(dependencyRuleViolations(items, PINNED), []);
});

test("a dependency outside the pinned list without an exception fails", () => {
  const items = [
    { name: "drawer", dependencies: ["@react-navigation/drawer@^7", "react-native-svg"] },
    { name: "chart", devDependencies: ["victory-native"] },
  ];
  const violations = dependencyRuleViolations(items, PINNED);
  assert.equal(violations.length, 2);
  assert.match(violations[0]!, /"drawer" depends on "@react-navigation\/drawer"/);
  assert.match(violations[1]!, /"chart" depends on "victory-native"/);
});

test("the Registry build fails on a dependency that breaks the rule", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nativecn-dep-"));
  fs.cpSync(FIXTURES, root, { recursive: true });
  fs.writeFileSync(
    path.join(root, "components/_registry.ts"),
    'export default [{ name: "sample", type: "registry:ui", dependencies: ["left-pad@^1"], files: [{ path: "components/sample.tsx", type: "registry:ui", target: "{components}/sample.tsx" }] }];',
  );
  await assert.rejects(
    build({ root, out: path.join(root, "out"), presets: false, quiet: true }),
    /Dependency rule \(ADR 0007\) failed[\s\S]*"sample" depends on "left-pad"/,
  );
  fs.rmSync(root, { recursive: true, force: true });
});

test("every recorded exception points at an existing decision", () => {
  assert.deepEqual(missingExceptionDecisions(), []);
  assert.deepEqual(Object.keys(RECORDED_EXCEPTIONS).sort(), [
    "lucide-react-native",
    "react-hook-form",
    "zod",
    "zustand",
  ]);
});

test("every real Registry Item follows the rule on the installed SDK", async () => {
  const { modules } = loadPinnedModules();
  const items = await loadItems(path.resolve(import.meta.dirname, "../.."));
  assert.deepEqual(dependencyRuleViolations(items, modules), []);
});
