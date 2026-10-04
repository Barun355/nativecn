import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, test } from "node:test";

import { writeConfig, type Config } from "../config.ts";
import { clearRegistryCache } from "../registry.ts";
import { add } from "./add.ts";

process.env.NATIVECN_REGISTRY_URL = path.join(import.meta.dirname, "__fixtures__", "r");
process.env.NATIVECN_SKIP_INSTALL = "1";

function project(structure: Config["structure"] = "flat"): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-add-"));
  fs.mkdirSync(path.join(cwd, "src"));
  fs.writeFileSync(
    path.join(cwd, "tsconfig.json"),
    '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }',
  );
  fs.writeFileSync(
    path.join(cwd, "app.json"),
    JSON.stringify({ expo: { name: "x", plugins: ["expo-router"] } }),
  );
  writeConfig(cwd, {
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
    structure,
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      utils: "@/utils",
      theme: "@/theme",
      screens: "@/screens",
      features: "@/features",
    },
    routes: "src/app",
    agents: [],
  });
  return cwd;
}

const read = (cwd: string, f: string) => fs.readFileSync(path.join(cwd, f), "utf8");

beforeEach(() => clearRegistryCache());

test("flat mode: installs the tree with rewritten imports, a route and Config Plugins", async () => {
  const cwd = project();
  const r = await add(["sign-in-01"], { cwd, yes: true, silent: true });
  assert.deepEqual(
    r.files.map((f) => f.item),
    ["theme", "text", "pressable", "sign-in-01", "sign-in-01"],
  );
  assert.match(read(cwd, "src/components/text.tsx"), /from "@\/theme"/);
  assert.match(
    read(cwd, "src/screens/sign-in-01/index.tsx"),
    /from "@\/screens\/sign-in-01\/components\/form"/,
  );
  assert.match(
    read(cwd, "src/app/(auth)/sign-in.tsx"),
    /import \{ SignIn01 \} from "@\/screens\/sign-in-01"/,
  );
  assert.deepEqual(r.dependencies, ["expo-font", "expo-haptics", "zustand@^5.0.15"]);
  assert.deepEqual(JSON.parse(read(cwd, "app.json")).expo.plugins, ["expo-router", "expo-font"]);
  assert.equal(r.rebuild, true);
});

test("feature mode: Screen Blocks go to their Feature; Components stay global", async () => {
  const cwd = project("feature");
  await add(["sign-in-01"], { cwd, yes: true, silent: true });
  assert.ok(fs.existsSync(path.join(cwd, "src/features/auth/screens/sign-in-01/index.tsx")));
  assert.ok(fs.existsSync(path.join(cwd, "src/components/text.tsx")));
  assert.match(
    read(cwd, "src/features/auth/screens/sign-in-01/index.tsx"),
    /@\/features\/auth\/screens\/sign-in-01\/components\/form/,
  );
  assert.match(
    read(cwd, "src/app/(auth)/sign-in.tsx"),
    /from "@\/features\/auth\/screens\/sign-in-01"/,
  );
});

test("identical files are skipped, edits survive -y, and -o overwrites them", async () => {
  const cwd = project();
  await add(["text"], { cwd, yes: true, silent: true });
  fs.writeFileSync(path.join(cwd, "src/components/text.tsx"), "// my edit\n");
  const again = await add(["text"], { cwd, yes: true, silent: true });
  assert.equal(again.files.find((f) => f.target.endsWith("text.tsx"))?.status, "different");
  assert.deepEqual(again.skipped, ["src/components/text.tsx"]);
  assert.equal(read(cwd, "src/components/text.tsx"), "// my edit\n");
  assert.equal(again.written.includes("src/theme/index.ts"), false);
  await add(["text"], { cwd, yes: true, overwrite: true, silent: true });
  assert.match(read(cwd, "src/components/text.tsx"), /export const Text/);
});

test("an existing route is never overwritten; the snippet is returned instead", async () => {
  const cwd = project();
  fs.mkdirSync(path.join(cwd, "src/app/(auth)"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "src/app/(auth)/sign-in.tsx"), "// mine\n");
  const r = await add(["sign-in-01"], { cwd, yes: true, silent: true });
  assert.equal(read(cwd, "src/app/(auth)/sign-in.tsx"), "// mine\n");
  assert.equal(r.routes[0]?.created, false);
  assert.match(r.routes[0]?.snippet ?? "", /SignIn01/);
});

test("--dry-run writes nothing; --path relocates Components; missing config fails", async () => {
  const cwd = project();
  const dry = await add(["text"], { cwd, yes: true, silent: true, dryRun: true });
  assert.equal(dry.written.length, 0);
  assert.equal(fs.existsSync(path.join(cwd, "src/components/text.tsx")), false);
  await add(["text"], { cwd, yes: true, silent: true, path: "src/ui" });
  assert.ok(fs.existsSync(path.join(cwd, "src/ui/text.tsx")));
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-none-"));
  await assert.rejects(
    add(["text"], { cwd: empty, yes: true, silent: true }),
    /Run `npx nativecn-cli@latest init` first/,
  );
});
