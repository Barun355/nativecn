import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { encodePreset, type Preset } from "preset";

import { configSchema } from "../../../packages/cli/src/config.ts";
import {
  STARTER_SCREEN,
  starterConfig,
  starterImport,
  type StarterTargets,
} from "./starter-preview.ts";

const SCREEN = fileURLToPath(new URL(`../../../${STARTER_SCREEN}`, import.meta.url));
const UI = fileURLToPath(new URL("../../../packages/ui/", import.meta.url));
const SHIMS = fileURLToPath(new URL("../components/preview/shims/", import.meta.url));
const TARGETS: StarterTargets = {
  ui: UI,
  theme: `${SHIMS}registry-theme.tsx`,
  config: `${SHIMS}starter-config.ts`,
  expoRouter: `${SHIMS}expo-router.tsx`,
};

const NOVA_VIOLET: Preset = {
  style: "nova",
  baseColor: "zinc",
  accentColor: "violet",
  radius: "large",
  bodyFont: "lora",
  headingFont: "inter",
};

/** Every module the Starter's promo Screen imports, read from the real file. */
function starterImports(): string[] {
  const source = readFileSync(SCREEN, "utf8");
  return [...source.matchAll(/^import\s[^;]*?from\s+"([^"]+)";/gms)].map((m) => m[1]!);
}

/** True when a file exists at `path`, as webpack would find it (with or without an extension). */
const resolvable = (path: string) =>
  ["", ".ts", ".tsx", "/index.ts", "/index.tsx"].some((ext) => existsSync(path + ext));

describe("the Starter tab renders the Starter's own promo Screen", () => {
  test("the Screen is the CLI's Starter template, not a copy", () => {
    assert.equal(STARTER_SCREEN, "packages/cli/starter/src/app/index.tsx");
    assert.ok(existsSync(SCREEN));
  });

  test("a Component import goes to the Registry source", () => {
    assert.deepEqual(starterImport("@/components/button", TARGETS), {
      request: `${UI}components/button`,
    });
  });

  test("the Theme, components.json and Expo Router go to the preview's stand-ins", () => {
    assert.deepEqual(starterImport("@/theme", TARGETS), { request: TARGETS.theme });
    assert.deepEqual(starterImport("../../components.json", TARGETS), { request: TARGETS.config });
    assert.deepEqual(starterImport("expo-router", TARGETS), { request: TARGETS.expoRouter });
  });

  test("a package resolves as it does for the Registry source", () => {
    assert.deepEqual(starterImport("lucide-react-native", TARGETS), { context: UI });
    assert.deepEqual(starterImport("react", TARGETS), { context: UI });
  });

  test("an import the website has no answer for is reported, not guessed", () => {
    assert.equal(starterImport("@/hooks/use-thing", TARGETS), null);
    assert.equal(starterImport("./other", TARGETS), null);
  });

  test("every import of the real Starter Screen is handled and resolves", () => {
    const imports = starterImports();
    assert.ok(imports.includes("@/components/button"), "read the Starter's imports");
    const fromUi = createRequire(`${UI}package.json`);
    for (const request of imports) {
      const to = starterImport(request, TARGETS);
      assert.ok(to, `the website does not handle the Starter's import "${request}"`);
      if ("request" in to) assert.ok(resolvable(to.request), `${request} → ${to.request}`);
      else assert.ok(fromUi.resolve(request), request);
    }
  });
});

describe("the Starter's components.json in the preview", () => {
  test("holds the phone's Preset as `create` writes it", () => {
    const config = starterConfig(NOVA_VIOLET);
    assert.deepEqual(config.preset, { code: encodePreset(NOVA_VIOLET), ...NOVA_VIOLET });
    assert.deepEqual(configSchema.shape.preset.parse(config.preset), config.preset);
  });
});
