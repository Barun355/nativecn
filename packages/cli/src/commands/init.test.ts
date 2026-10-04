import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, test } from "node:test";

import { encodePreset } from "preset";

import { readConfig } from "../config.ts";
import { clearRegistryCache } from "../registry.ts";
import { checkExpoApp, SDK_MESSAGE } from "../utils/expo.ts";
import { init, rootLayout } from "./init.ts";

const fixtures = path.join(import.meta.dirname, "__fixtures__", "init");
process.env.NATIVECN_REGISTRY_URL = path.join(fixtures, "r");
process.env.NATIVECN_FONTS_URL = path.join(fixtures, "fonts");
process.env.NATIVECN_STARTER_DIR = path.join(import.meta.dirname, "..", "..", "starter");
process.env.NATIVECN_SKIP_INSTALL = "1";
// The Agent Kit from this checkout instead of GitHub.
const AGENT_KIT = path.join(import.meta.dirname, "..", "..", "..", "..");
process.env.NATIVECN_AGENT_KIT_DIR = AGENT_KIT;

const read = (cwd: string, f: string) => fs.readFileSync(path.join(cwd, f), "utf8");
const json = (cwd: string, f: string) => JSON.parse(read(cwd, f));
const exists = (cwd: string, f: string) => fs.existsSync(path.join(cwd, f));

function write(cwd: string, file: string, content: string) {
  fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
  fs.writeFileSync(path.join(cwd, file), content);
}

/** An existing Expo Router app, with or without src/. */
function expoApp(opts: { src?: boolean; expo?: string; router?: boolean; paths?: boolean } = {}) {
  const { src = true, expo = "~57.0.26", router = true, paths = true } = opts;
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-init-"));
  const deps: Record<string, string> = { expo, react: "19.2.3" };
  if (router) deps["expo-router"] = "~57.0.24";
  write(cwd, "package.json", JSON.stringify({ name: "app", dependencies: deps }));
  write(cwd, "app.json", JSON.stringify({ expo: { name: "app", plugins: ["expo-router"] } }));
  const pathsJson = paths ? `, "paths": { "@/*": ["./${src ? "src/" : ""}*"] }` : "";
  write(
    cwd,
    "tsconfig.json",
    `{\n  // Expo's base\n  "extends": "expo/tsconfig.base",\n  "compilerOptions": { "strict": true${pathsJson} }\n}\n`,
  );
  const prefix = src ? "src/" : "";
  write(cwd, `${prefix}app/_layout.tsx`, "// my layout\n");
  write(cwd, `${prefix}constants/theme.ts`, "// expo theme\n");
  return cwd;
}

beforeEach(() => clearRegistryCache());

test("Step 0 rejects SDK <57, apps without Expo Router and non-Expo apps", async () => {
  assert.throws(() => checkExpoApp(expoApp({ expo: "~56.0.0" })), { message: SDK_MESSAGE });
  assert.throws(() => checkExpoApp(expoApp({ router: false })), /Expo Router/);
  const bare = expoApp();
  write(bare, "package.json", JSON.stringify({ dependencies: { "react-native": "0.86.3" } }));
  assert.throws(() => checkExpoApp(bare), /bare React Native is not supported/);
  assert.deepEqual(checkExpoApp(expoApp({ expo: "^58.0.0" })), { sdk: 58 });

  const old = expoApp({ expo: "~56.0.0" });
  await assert.rejects(init([], { cwd: old, yes: true, silent: true }), { message: SDK_MESSAGE });
  assert.equal(exists(old, "components.json"), false);
});

test("init (src/): components.json, composed Theme, only the chosen fonts, nothing rewritten", async () => {
  const cwd = expoApp();
  write(cwd, "src/theme/config.ts", "// my own theme config\n");
  const preset = {
    style: "vega",
    baseColor: "stone",
    accentColor: "blue",
    radius: "large",
    bodyFont: "lora",
    headingFont: "inter",
  } as const;
  const r = await init([], {
    cwd,
    yes: true,
    silent: true,
    preset: encodePreset({ ...preset, bodyFont: "geist" }),
    font: "lora",
    agents: "claude,cursor",
  });

  const config = readConfig(cwd)!;
  assert.deepEqual(config.preset, { code: encodePreset(preset), ...preset });
  assert.equal(config.structure, "flat");
  assert.equal(config.routes, "src/app");
  assert.equal(config.aliases.components, "@/components");
  assert.equal(config.aliases.features, undefined);
  assert.deepEqual(config.agents, ["claude", "cursor"]);
  assert.equal(r.tsconfig, "present");

  // The Agent Kit for the chosen agents only.
  assert.equal(r.agentKit?.kit.installed, true);
  assert.deepEqual(r.agentKit?.agents, ["claude", "cursor"]);
  assert.match(read(cwd, "AGENTS.md"), /<!-- nativecn:start -->/);
  assert.equal(read(cwd, "CLAUDE.md").trim(), "@AGENTS.md");
  assert.ok(exists(cwd, ".agents/skills/nativecn-setup/SKILL.md"));
  assert.ok(exists(cwd, ".claude/skills/nativecn-setup/SKILL.md"));
  assert.ok(exists(cwd, ".mcp.json") && exists(cwd, ".cursor/mcp.json"));
  assert.ok(!exists(cwd, ".codex/config.toml") && !exists(cwd, ".agents/mcp_config.json"));

  // colors.ts: stone base + blue accent + shared roles, light and dark.
  const fixture = (rel: string) => json(path.join(fixtures, "r", "presets"), rel);
  const stone = fixture("base/stone.json");
  const blue = fixture("accent/blue.json");
  const colors = read(cwd, "src/theme/colors.ts");
  assert.equal(r.theme.colors, "written");
  assert.match(colors, /Base Colour "stone", Accent Colour "blue"/);
  assert.ok(colors.includes(`  background: "${stone.light.background}",`));
  assert.ok(colors.includes(`  primary: "${blue.light.primary}",`));
  assert.ok(colors.includes(`  primary: "${blue.dark.primary}",`));
  assert.ok(colors.includes(`  mutedForeground: "${stone.dark.mutedForeground}",`));
  assert.match(colors, /export const colors = \{ light, dark \}/);

  // tokens.ts: radius base 14 and Lora body / Inter headings with the em corrections.
  const tokens = read(cwd, "src/theme/tokens.ts");
  assert.match(tokens, /export const radiusBase = 14;/);
  assert.match(tokens, /body: \{\n {4}regular: "Lora-Regular",/);
  assert.match(tokens, /heading: \{\n {4}regular: "Inter-Regular",/);
  assert.match(tokens, /trackingOffset: \{ body: 0\.0125, heading: 0 \}/);

  // Fonts: only Lora and Inter, each in its own folder with its licence.
  assert.deepEqual(fs.readdirSync(path.join(cwd, "assets/fonts")).sort(), ["inter", "lora"]);
  assert.deepEqual(fs.readdirSync(path.join(cwd, "assets/fonts/lora")).sort(), [
    "Lora-Bold.ttf",
    "Lora-Medium.ttf",
    "Lora-Regular.ttf",
    "Lora-SemiBold.ttf",
    "OFL.txt",
  ]);
  const plugins = json(cwd, "app.json").expo.plugins;
  assert.equal(plugins[0], "expo-router");
  assert.deepEqual(plugins[1][0], "expo-font");
  assert.equal(plugins[1][1].fonts.length, 8);
  assert.ok(plugins[1][1].fonts.includes("./assets/fonts/lora/Lora-Regular.ttf"));

  // Existing files are never rewritten; the layout is printed, overlaps are listed.
  assert.equal(read(cwd, "src/app/_layout.tsx"), "// my layout\n");
  assert.equal(read(cwd, "src/theme/config.ts"), "// my own theme config\n");
  assert.equal(read(cwd, "src/constants/theme.ts"), "// expo theme\n");
  assert.deepEqual(r.overlaps, ["src/constants/theme.ts"]);
  assert.equal(r.layout.written, false);
  assert.match(r.layout.snippet, /<ThemeProvider>\n\s+<KeyboardProvider>\n\s+<Stack \/>/);
  assert.match(r.layout.snippet, /<PortalHost \/>/);
  assert.ok(r.items.missing.includes("toast"));
  assert.ok(!r.items.missing.includes("text"), "init installs no Starter items");
  assert.ok(exists(cwd, "src/components/primitives/portal.tsx"));
  assert.equal(exists(cwd, ".git"), false, "init never commits");

  // Running again without --force refuses; existing user colours are kept.
  await assert.rejects(init([], { cwd, yes: true, silent: true }), /already exists/);
});

test("init keeps an existing theme file and does not compose over it", async () => {
  const cwd = expoApp();
  write(cwd, "src/theme/colors.ts", "// my colours\n");
  const r = await init([], { cwd, yes: true, silent: true });
  assert.equal(read(cwd, "src/theme/colors.ts"), "// my colours\n");
  assert.equal(r.theme.colors, "kept");
  assert.equal(r.theme.tokens, "written");
  assert.equal(readConfig(cwd)!.preset.code, encodePreset({}));
  assert.deepEqual(fs.readdirSync(path.join(cwd, "assets/fonts")), ["inter"]);
});

test("init without src/: root aliases, routes 'app', and '@/*' added to tsconfig", async () => {
  const cwd = expoApp({ src: false, paths: false });
  const r = await init(["text"], {
    cwd,
    yes: true,
    silent: true,
    folderFeat: true,
    agents: "none",
  });
  const config = readConfig(cwd)!;
  assert.equal(config.routes, "app");
  assert.equal(config.structure, "feature");
  assert.equal(config.aliases.features, "@/features");
  assert.deepEqual(config.agents, []);
  assert.equal(r.tsconfig, "added");
  const tsconfig = read(cwd, "tsconfig.json");
  assert.match(tsconfig, /\/\/ Expo's base/);
  assert.match(tsconfig, /"@\/\*": \[\s*"\.\/\*"\s*\]/);
  assert.ok(exists(cwd, "theme/colors.ts"));
  assert.ok(exists(cwd, "components/text.tsx"));
  assert.equal(exists(cwd, "src"), false);
  assert.deepEqual(r.overlaps, ["constants/theme.ts"]);
  assert.match(r.layout.snippet, /from "@\/theme"/);
  assert.equal(r.agentKit, undefined);
  assert.equal(exists(cwd, "AGENTS.md"), false);
});

test("init finishes when the Agent Kit can't be fetched, and says so", async (t) => {
  process.env.NATIVECN_AGENT_KIT_DIR = path.join(os.tmpdir(), "nativecn-no-such-kit");
  t.after(() => {
    process.env.NATIVECN_AGENT_KIT_DIR = AGENT_KIT;
  });
  const cwd = expoApp();
  const r = await init([], { cwd, yes: true, silent: true, agents: "codex" });
  assert.equal(r.agentKit?.kit.installed, false);
  assert.match(r.agentKit?.kit.error ?? "", /NATIVECN_AGENT_KIT_DIR/);
  assert.equal(exists(cwd, "AGENTS.md"), false);
  assert.ok(exists(cwd, ".codex/config.toml"), "MCP config doesn't need the fetch");
  assert.ok(exists(cwd, "components.json"));
});

test("init rejects unknown Preset values and codes", async () => {
  await assert.rejects(
    init([], { cwd: expoApp(), yes: true, silent: true, accent: "plaid" }),
    /Unknown --accent/,
  );
  await assert.rejects(
    init([], { cwd: expoApp(), yes: true, silent: true, preset: "zz" }),
    /not a Preset code/,
  );
});

test("create: renamed Starter, composed Theme, root Layout, one commit", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-create-"));
  const r = await init(["text"], {
    cwd: root,
    mode: "create",
    name: "My-App",
    yes: true,
    silent: true,
    accent: "blue",
  });
  const cwd = path.join(root, "My-App");
  assert.equal(r.cwd, cwd);
  assert.equal(json(cwd, "package.json").name, "my-app");
  const app = json(cwd, "app.json").expo;
  assert.equal(app.name, "My-App");
  assert.equal(app.slug, "my-app");
  assert.equal(app.scheme, "myapp");
  assert.ok(!read(cwd, "app.json").includes("nativecn-starter"));

  const config = readConfig(cwd)!;
  assert.equal(config.routes, "src/app");
  assert.equal(config.preset.accentColor, "blue");
  assert.deepEqual(config.agents, ["claude", "codex", "cursor", "antigravity"]);
  assert.ok(exists(cwd, "src/components/text.tsx"));
  assert.ok(r.items.missing.includes("button"), "Starter items not in the Registry are skipped");
  assert.equal(r.theme.colors, "written");
  assert.ok(exists(cwd, "assets/fonts/inter/Inter-Regular.ttf"));
  assert.equal(read(cwd, "src/app/_layout.tsx"), r.layout.snippet);
  assert.match(r.layout.snippet, /ThemeProvider/);

  assert.equal(r.git?.committed, true);
  const log = spawnSync("git", ["log", "--format=%s"], { cwd, encoding: "utf8" });
  assert.equal(log.stdout.trim(), "feat: initial commit");
  // The Agent Kit is part of the one initial commit.
  const tracked = spawnSync("git", ["ls-files"], { cwd, encoding: "utf8" }).stdout;
  for (const f of ["AGENTS.md", ".mcp.json", ".codex/config.toml", ".agents/mcp_config.json"])
    assert.ok(tracked.split("\n").includes(f), f);
  const status = spawnSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" });
  assert.equal(status.stdout, "");
});

test("create refuses a non-empty folder", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-create-"));
  write(root, "taken/file.txt", "x");
  await assert.rejects(
    init([], { cwd: root, mode: "create", name: "taken", yes: true, silent: true }),
    /not empty/,
  );
});

test("rootLayout: Toaster appears only once the toast item is installed", () => {
  const config = {
    aliases: { components: "@/components", theme: "@/theme" },
  } as Parameters<typeof rootLayout>[0];
  const without = rootLayout(config, { portal: false, keyboard: true, toast: false });
  assert.doesNotMatch(without, /import \{ Toaster \}/);
  assert.doesNotMatch(without, /PortalHost/);
  const full = rootLayout(config, { portal: true, keyboard: true, toast: true });
  assert.match(full, /<Stack \/>\n\s+<PortalHost \/>\n\s+<Toaster \/>/);
});
