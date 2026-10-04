import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { readConfig, writeConfig, type Config } from "./config.ts";
import { resolveTarget } from "./destinations.ts";
import { rewriteImports } from "./imports.ts";
import { aliasToDir } from "./paths.ts";
import { clearRegistryCache, fetchItem, type RegistryItem } from "./registry.ts";
import { collectDependencies, resolveTree } from "./resolve.ts";

const PROJECT = path.join(import.meta.dirname, "__fixtures__", "project");

const config = (over: Partial<Config> = {}): Config => ({
  version: 1,
  preset: {
    code: "a0",
    style: "vega",
    baseColor: "neutral",
    accentColor: "neutral",
    radius: "default",
    bodyFont: "inter",
    headingFont: "inherit",
  },
  structure: "flat",
  aliases: {
    components: "@/components",
    hooks: "@/hooks",
    utils: "@/utils",
    theme: "@/theme",
    screens: "@/screens",
    features: "@/features",
  },
  routes: "src/app",
  agents: ["claude"],
  ...over,
});

test("components.json round-trips and rejects invalid files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-cfg-"));
  assert.equal(readConfig(dir), null);
  writeConfig(dir, config());
  assert.equal(readConfig(dir)?.preset.style, "vega");
  assert.match(fs.readFileSync(path.join(dir, "components.json"), "utf8"), /nativecn\.dev\/schema/);
  fs.writeFileSync(path.join(dir, "components.json"), JSON.stringify({ version: 1, tailwind: {} }));
  assert.throws(() => readConfig(dir), /components\.json is invalid/);
});

test("aliases resolve through tsconfig paths (with comments) or fall back to src/", () => {
  assert.equal(aliasToDir("@/components", PROJECT), "src/components");
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-bare-"));
  assert.equal(aliasToDir("@/components", bare), "components");
});

test("Destinations resolve for flat and feature mode", () => {
  const opts = { cwd: PROJECT };
  assert.equal(
    resolveTarget("{components}/button.tsx", config(), opts),
    "src/components/button.tsx",
  );
  assert.equal(resolveTarget("{theme}/colors.ts", config(), opts), "src/theme/colors.ts");
  assert.equal(resolveTarget("{app}/sign-in.tsx", config(), opts), "src/app/sign-in.tsx");
  assert.equal(
    resolveTarget("{screens}/sign-in-01/index.tsx", config(), opts),
    "src/screens/sign-in-01/index.tsx",
  );
  const feature = config({ structure: "feature" });
  assert.equal(
    resolveTarget("{screens}/sign-in-01/index.tsx", feature, { ...opts, feature: "auth" }),
    "src/features/auth/screens/sign-in-01/index.tsx",
  );
  assert.equal(
    resolveTarget("{components}/button.tsx", feature, opts),
    "src/components/button.tsx",
  );
  assert.throws(() => resolveTarget("{screens}/x.tsx", feature, opts), /--feature/);
  assert.throws(() => resolveTarget("src/x.tsx", config(), opts), /Destination placeholder/);
});

test("registry imports are rewritten to the project's aliases", () => {
  const src = [
    `import { Text } from "@/registry/components/text";`,
    `import { useTheme } from '@/registry/theme';`,
    `import { Form } from "@/registry/screens/sign-in-01/components/form";`,
    `import { View } from "react-native";`,
  ].join("\n");
  const flat = rewriteImports(
    src,
    config({ aliases: { ...config().aliases, components: "~/ui" } }),
  );
  assert.match(flat, /from "~\/ui\/text"/);
  assert.match(flat, /from '@\/theme'/);
  assert.match(flat, /from "@\/screens\/sign-in-01\/components\/form"/);
  assert.match(flat, /from "react-native"/);
  const feat = rewriteImports(src, config({ structure: "feature" }), "auth");
  assert.match(feat, /from "@\/features\/auth\/screens\/sign-in-01\/components\/form"/);
});

test("the dependency tree is de-duplicated, dependencies first, and cycles fail", async () => {
  const items: Record<string, RegistryItem> = {
    button: {
      name: "button",
      type: "registry:ui",
      registryDependencies: ["text", "pressable"],
      dependencies: ["expo-haptics"],
    },
    text: { name: "text", type: "registry:ui", registryDependencies: ["theme"] },
    pressable: {
      name: "pressable",
      type: "registry:ui",
      registryDependencies: ["theme"],
      dependencies: ["expo-haptics"],
    },
    theme: { name: "theme", type: "registry:lib", dependencies: ["zustand@^5.0.15"] },
  };
  const tree = await resolveTree(["button", "text"], async (n) => items[n]!);
  assert.deepEqual(
    tree.map((i) => i.name),
    ["theme", "text", "pressable", "button"],
  );
  assert.deepEqual(collectDependencies(tree), ["expo-haptics", "zustand@^5.0.15"]);
  const cyclic: Record<string, RegistryItem> = {
    a: { name: "a", type: "registry:ui", registryDependencies: ["b"] },
    b: { name: "b", type: "registry:ui", registryDependencies: ["a"] },
  };
  await assert.rejects(
    resolveTree(["a"], async (n) => cyclic[n]!),
    /cycle: a → b → a/,
  );
});

test("items are fetched from NATIVECN_REGISTRY_URL (a local folder here); names only", async () => {
  const r = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-r-"));
  fs.mkdirSync(path.join(r, "styles", "nova"), { recursive: true });
  fs.writeFileSync(
    path.join(r, "styles", "nova", "text.json"),
    JSON.stringify({ name: "text", type: "registry:ui" }),
  );
  process.env.NATIVECN_REGISTRY_URL = r;
  clearRegistryCache();
  assert.equal((await fetchItem("text", "nova")).name, "text");
  await assert.rejects(fetchItem("missing", "nova"), /Not found in the Registry/);
  await assert.rejects(fetchItem("https://evil.example/x", "nova"), /names only/);
  delete process.env.NATIVECN_REGISTRY_URL;
});
