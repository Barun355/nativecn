import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { decodePreset } from "preset";

import { writeConfig, type Config } from "../config.ts";
import { A11Y_CHECKLIST } from "./checklist.ts";
import { createServer, type CreateServerOptions } from "./server.ts";

const REGISTRY = path.join(import.meta.dirname, "__fixtures__", "r");
process.env.NATIVECN_REGISTRY_URL = REGISTRY;

const clients: Client[] = [];
after(async () => {
  for (const c of clients) await c.close();
});

async function connect(options: CreateServerOptions = {}): Promise<Client> {
  const server = createServer(options);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([server.connect(a), client.connect(b)]);
  clients.push(client);
  return client;
}

type Result = { isError?: boolean; content: { type: string; text: string }[] };

async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
  const r = (await client.callTool({ name, arguments: args })) as Result;
  const text = r.content.map((c) => c.text).join("\n");
  return { error: r.isError === true, text, json: () => JSON.parse(text) };
}

function project(
  structure: Config["structure"] = "flat",
  style: "vega" | "nova" = "vega",
  routes = "src/app",
): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-mcp-"));
  fs.mkdirSync(path.join(cwd, "src"));
  fs.writeFileSync(
    path.join(cwd, "tsconfig.json"),
    '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }',
  );
  writeConfig(cwd, {
    version: 1,
    preset: {
      code: style === "nova" ? "a1" : "a0",
      style,
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
    routes,
    agents: [],
  });
  return cwd;
}

const snapshot = (dir: string) =>
  fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .map((d) => path.join(d.parentPath, d.name))
    .sort();

test("local server offers the 10 read-only tools; remote omits get_project_config", async () => {
  const local = await connect({ cwd: project() });
  const names = (await local.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "build_preset_code",
    "get_add_command",
    "get_audit_checklist",
    "get_item_examples",
    "get_project_config",
    "list_block_variants",
    "list_items",
    "list_preset_options",
    "search_items",
    "view_items",
  ]);
  for (const t of (await local.listTools()).tools) assert.equal(t.annotations?.readOnlyHint, true);

  const remote = await connect();
  const remoteNames = (await remote.listTools()).tools.map((t) => t.name);
  assert.ok(!remoteNames.includes("get_project_config"));
  assert.equal(remoteNames.length, 9);
});

test("list_items groups by kind and category and leaves out examples", async () => {
  const c = await connect({ cwd: project() });
  const { items, style } = (await call(c, "list_items")).json();
  assert.equal(style, "vega");
  assert.deepEqual(Object.keys(items).sort(), ["Blocks", "Components", "Primitives", "Themes"]);
  assert.deepEqual(
    items.Primitives.general.map((i: { name: string }) => i.name),
    ["pressable", "use-controllable-state"],
  );
  assert.deepEqual(
    items.Blocks.auth.map((i: { name: string }) => i.name),
    ["sign-in-01", "sign-in-02", "sign-up-01"],
  );
  assert.ok(!JSON.stringify(items).includes("button-demo"));

  const blocks = (await call(c, "list_items", { types: ["block"], category: "auth" })).json();
  assert.equal(blocks.total, 3);
});

test("search_items finds items for a need", async () => {
  const c = await connect();
  const r = (await call(c, "search_items", { query: "dark mode toggle" })).json();
  assert.equal(r.items[0].name, "scheme-switcher");
  const none = await call(c, "search_items", { query: "spaceship" });
  assert.equal(none.error, false);
  assert.match(none.text, /No nativecn items match/);
});

test("view_items renders the project's Style, with resolved paths", async () => {
  const nova = await connect({ cwd: project("flat", "nova") });
  const r = await call(nova, "view_items", { items: ["button"] });
  assert.equal(r.error, false);
  assert.match(r.text, /Style nova/);
  assert.match(r.text, /padding = 8/);
  assert.match(r.text, /\{components\}\/button\.tsx → src\/components\/button\.tsx/);
  assert.match(r.text, /## Props/);
  assert.match(r.text, /## Variants/);

  const remote = await connect();
  const v = await call(remote, "view_items", { items: ["button", "nope"] });
  assert.match(v.text, /Style vega/);
  assert.match(v.text, /padding = 12/);
  assert.match(v.text, /Not found in the Registry: nope/);

  const missing = await call(remote, "view_items", { items: ["nope"] });
  assert.equal(missing.error, true);
});

test("view_items falls back to vega in a folder without components.json", async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-mcp-empty-"));
  const c = await connect({ cwd: empty });
  const r = await call(c, "view_items", { items: ["button"] });
  assert.match(r.text, /Style vega/);
});

test("get_item_examples returns example code", async () => {
  const c = await connect();
  for (const query of ["button", "button-demo", "button example"]) {
    const r = await call(c, "get_item_examples", { query });
    assert.match(r.text, /# button-demo/, query);
    assert.match(r.text, /<Button variant="outline">/);
  }
  const none = await call(c, "get_item_examples", { query: "text" });
  assert.match(none.text, /No examples found/);
});

test("get_add_command, flat mode: one command for Components, one per Screen Block with --route", async () => {
  const c = await connect({ cwd: project("flat") });
  const r = (
    await call(c, "get_add_command", { items: ["button", "sign-in-02", "drawer-01"] })
  ).json();
  assert.deepEqual(
    r.commands.map((x: { command: string }) => x.command),
    [
      "npx nativecn-cli@latest add button drawer-01",
      'npx nativecn-cli@latest add sign-in-02 --route "(auth)/sign-in"',
    ],
  );
  assert.equal(r.structure, "flat");

  const custom = (
    await call(c, "get_add_command", {
      items: ["sign-up-01"],
      route: "/onboarding/join.tsx",
      feature: "auth",
    })
  ).json();
  assert.equal(
    custom.commands[0].command,
    'npx nativecn-cli@latest add sign-up-01 --route "onboarding/join"',
  );
  assert.ok(custom.notes.some((n: string) => /flat/.test(n)));
});

test("get_add_command, feature mode: --feature from the Block's category or the argument", async () => {
  const c = await connect({ cwd: project("feature") });
  const def = (await call(c, "get_add_command", { items: ["sign-in-01"] })).json();
  assert.equal(
    def.commands[0].command,
    'npx nativecn-cli@latest add sign-in-01 --feature auth --route "(auth)/sign-in"',
  );
  const chosen = (
    await call(c, "get_add_command", {
      items: ["sign-in-01", "button"],
      feature: "onboarding",
      route: "welcome",
    })
  ).json();
  assert.deepEqual(
    chosen.commands.map((x: { command: string }) => x.command),
    [
      "npx nativecn-cli@latest add button",
      'npx nativecn-cli@latest add sign-in-01 --feature onboarding --route "welcome"',
    ],
  );
  // A Screen Block with no category needs an explicit Feature.
  const noFeature = await call(c, "get_add_command", { items: ["profile-01"] });
  assert.equal(noFeature.error, true);
  assert.match(noFeature.text, /feature mode/);
  const withFeature = (
    await call(c, "get_add_command", { items: ["profile-01"], feature: "account" })
  ).json();
  assert.equal(
    withFeature.commands[0].command,
    "npx nativecn-cli@latest add profile-01 --feature account",
  );
  assert.ok(withFeature.notes.some((n: string) => /suggests no route/.test(n)));
});

test("get_add_command rejects unknown items, bad routes and a route for several Screen Blocks", async () => {
  const c = await connect({ cwd: project() });
  const unknown = await call(c, "get_add_command", { items: ["buton"] });
  assert.equal(unknown.error, true);
  assert.match(unknown.text, /Not in the nativecn Registry: buton \(did you mean button/);
  const two = await call(c, "get_add_command", { items: ["sign-in-01", "sign-up-01"], route: "x" });
  assert.equal(two.error, true);
  const bad = await call(c, "get_add_command", { items: ["sign-in-01"], route: "../x" });
  assert.equal(bad.error, true);
  const badFeature = await call(c, "get_add_command", {
    items: ["sign-in-01"],
    feature: "Auth Stuff",
  });
  assert.equal(badFeature.error, true);
});

test("get_add_command without a project assumes flat and says so", async () => {
  const c = await connect();
  const r = (await call(c, "get_add_command", { items: ["sign-in-01"] })).json();
  assert.equal(
    r.commands[0].command,
    'npx nativecn-cli@latest add sign-in-01 --route "(auth)/sign-in"',
  );
  assert.ok(r.notes.some((n: string) => /assume Structure `flat`/.test(n)));

  const empty = await connect({ cwd: fs.mkdtempSync(path.join(os.tmpdir(), "ncn-mcp-empty-")) });
  const e = (await call(empty, "get_add_command", { items: ["button"] })).json();
  assert.ok(e.notes.some((n: string) => /init/.test(n)));
});

test("get_project_config returns components.json and the resolved folders", async () => {
  const cwd = project("feature");
  const c = await connect({ cwd });
  const r = (await call(c, "get_project_config")).json();
  assert.equal(r.config.structure, "feature");
  assert.equal(r.config.preset.style, "vega");
  assert.equal(r.folders.components, "src/components");
  assert.equal(r.folders.screens, "src/features/<feature>/screens");
  assert.equal(r.folders.app, "src/app");

  const empty = await connect({ cwd: fs.mkdtempSync(path.join(os.tmpdir(), "ncn-mcp-empty-")) });
  const missing = await call(empty, "get_project_config");
  assert.equal(missing.error, true);
  assert.match(missing.text, /nativecn-cli@latest init/);
});

test("get_audit_checklist carries the Rules, fitted to the Structure", async () => {
  const flat = await call(await connect({ cwd: project("flat") }), "get_audit_checklist");
  assert.match(flat.text, /Tokens only/);
  assert.match(flat.text, /No `Alert\.alert`/);
  assert.match(flat.text, /Structure is `flat`/);
  const feature = await call(await connect({ cwd: project("feature") }), "get_audit_checklist");
  assert.match(feature.text, /Promote it to global the moment a second Feature needs it/);
  for (const point of A11Y_CHECKLIST) assert.ok(flat.text.includes(point), point);
});

test("the accessibility checklist matches AGENTS.md word for word", () => {
  const rules = fs.readFileSync(
    path.join(import.meta.dirname, "../../../agent-kit/rules/AGENTS.md"),
    "utf8",
  );
  const section = rules.split("### Accessibility checklist (9 points)")[1]!.split("\n## ")[0]!;
  const points = [...section.matchAll(/^\d+\. (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(points, [...A11Y_CHECKLIST]);
});

test("list_block_variants explains each Variant, with screenshots when present", async () => {
  const c = await connect();
  for (const purpose of ["sign-in", "login", "Sign in"]) {
    const r = (await call(c, "list_block_variants", { purpose })).json();
    assert.deepEqual(
      r.variants.map((v: { name: string }) => v.name),
      ["sign-in-01", "sign-in-02"],
      purpose,
    );
    assert.match(r.variants[1].different, /Social-first|Apple\/Google/);
    assert.deepEqual(Object.keys(r.variants[0].screenshots), ["light", "dark"]);
    assert.equal(r.variants[1].screenshots, undefined);
  }
  const auth = (await call(c, "list_block_variants", { purpose: "auth" })).json();
  assert.equal(auth.variants.length, 3);
  const drawer = (await call(c, "list_block_variants", { purpose: "menu" })).json();
  assert.deepEqual(
    drawer.variants.map((v: { name: string }) => v.name),
    ["drawer-01"],
  );
  const none = await call(c, "list_block_variants", { purpose: "checkout" });
  assert.match(none.text, /Purposes with Blocks: drawer, profile, sign-in, sign-up/);
});

test("list_preset_options reads the Registry; build_preset_code round-trips", async () => {
  const c = await connect({ cwd: project() });
  const options = (await call(c, "list_preset_options")).json();
  assert.deepEqual(options.options.style, ["vega", "nova"]);
  assert.equal(options.options.accentColor.length, 24);
  assert.equal(options.defaults.style, "vega");
  assert.equal(options.thisProject.code, "a0");

  const def = (await call(c, "build_preset_code")).json();
  assert.equal(def.code, "a0");

  const settings = { style: "nova", accentColor: "violet", headingFont: "lora" };
  const built = (await call(c, "build_preset_code", settings)).json();
  assert.equal(built.code, "a1Q17B");
  assert.deepEqual(decodePreset(built.code), built.preset);
  assert.equal(built.preset.style, "nova");
  assert.equal(built.preset.baseColor, "neutral");
  assert.equal(built.commands.create, "npx nativecn-cli@latest create my-app --preset a1Q17B");
  assert.match(
    built.commands.longFlags,
    /--style nova --base neutral --accent violet --radius default --font inter --heading-font lora/,
  );
  assert.match(built.note, /fixed/);

  const bad = await c.callTool({ name: "build_preset_code", arguments: { style: "lyra" } });
  assert.equal(bad.isError, true);
});

test("an unreachable Registry is a clear error, never a guess", async () => {
  const c = await connect({
    cwd: project(),
    registryUrl: path.join(os.tmpdir(), "ncn-no-registry-here"),
  });
  for (const [tool, args] of [
    ["list_items", {}],
    ["search_items", { query: "button" }],
    ["view_items", { items: ["button"] }],
    ["get_item_examples", { query: "button" }],
    ["get_add_command", { items: ["button"] }],
    ["list_block_variants", { purpose: "sign-in" }],
    ["list_preset_options", {}],
  ] as const) {
    const r = await call(c, tool, args);
    assert.equal(r.error, true, tool);
    assert.match(r.text, /Registry is unreachable/, tool);
    assert.match(r.text, /Do not guess/, tool);
  }
  // Tools that need no Registry still answer.
  assert.equal((await call(c, "get_audit_checklist")).error, false);
  assert.equal((await call(c, "build_preset_code", { style: "nova" })).error, false);
});

test("an unreachable HTTP Registry is a clear error", async () => {
  const c = await connect({ registryUrl: "http://127.0.0.1:9/r" });
  const r = await call(c, "list_items");
  assert.equal(r.error, true);
  assert.match(r.text, /Registry is unreachable/);
});

test("Registry answers are cached for the session, and expire", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ncn-mcp-reg-"));
  fs.cpSync(REGISTRY, dir, { recursive: true });
  const cached = await connect({ registryUrl: dir });
  const fresh = await connect({ registryUrl: dir, cacheMs: 0 });
  const count = async (c: Client) => (await call(c, "list_items")).json().total;
  const before = await count(cached);
  assert.equal(await count(fresh), before);
  const indexFile = path.join(dir, "styles/vega/registry.json");
  const index = JSON.parse(fs.readFileSync(indexFile, "utf8"));
  index.items = index.items.filter((i: { name: string }) => i.name !== "button");
  fs.writeFileSync(indexFile, JSON.stringify(index));
  assert.equal(await count(cached), before);
  assert.equal(await count(fresh), before - 1);
});

test("the tools never write to the project", async () => {
  const cwd = project("feature");
  const before = snapshot(cwd);
  const config = fs.readFileSync(path.join(cwd, "components.json"), "utf8");
  const c = await connect({ cwd });
  await call(c, "get_add_command", { items: ["sign-in-01", "button"] });
  await call(c, "view_items", { items: ["sign-in-01"] });
  await call(c, "build_preset_code", { style: "nova" });
  await call(c, "get_project_config");
  assert.deepEqual(snapshot(cwd), before);
  assert.equal(fs.readFileSync(path.join(cwd, "components.json"), "utf8"), config);
});

test("the published CLI bundles the private preset package instead of depending on it", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(import.meta.dirname, "../../package.json"), "utf8"),
  );
  assert.equal(pkg.dependencies.preset, undefined);
  assert.ok(pkg.devDependencies.preset);
});
