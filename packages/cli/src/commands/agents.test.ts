import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { parse } from "jsonc-parser";

import { writeConfig } from "../config.ts";
import { repoRef } from "../utils/starter.ts";
import {
  agents,
  antigravityRules,
  codexMcpBlock,
  fetchAgentKit,
  linkOrCopy,
  MCP_COMMAND,
  MCP_SERVER_NAME,
  mcpServerEntry,
  packagedSkills,
  parseAgents,
  PLUGIN_HINTS,
  qaCommands,
  sameTree,
  SECTION_END,
  SECTION_START,
} from "./agents.ts";

// The Agent Kit from this checkout (a nativecn repo root) instead of GitHub.
const REPO = path.join(import.meta.dirname, "..", "..", "..", "..");
process.env.NATIVECN_AGENT_KIT_DIR = REPO;

const kit = fetchAgentKit().paths;
const SKILLS = packagedSkills(kit);
const PACKAGED = fs.readFileSync(path.join(kit.rules, "AGENTS.md"), "utf8");

function tmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ncn-agents-"));
}
const read = (cwd: string, f: string) => fs.readFileSync(path.join(cwd, f), "utf8");
const json = (cwd: string, f: string) => parse(read(cwd, f));
const write = (cwd: string, f: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(cwd, f)), { recursive: true });
  fs.writeFileSync(path.join(cwd, f), content);
};
const status = (r: Awaited<ReturnType<typeof agents>>, f: string) =>
  r.files.find((x) => x.path === f)?.status;

const NPX = { command: "npx", args: ["-y", "nativecn-cli@latest", "mcp"] };

test("packaged Agent Kit: the five Skills and AGENTS.md with markers", () => {
  assert.deepEqual(SKILLS, [
    "nativecn-build-screen",
    "nativecn-component-authoring",
    "nativecn-setup",
    "nativecn-theme",
    "nativecn-visual-qa",
  ]);
  assert.ok(PACKAGED.includes(SECTION_START) && PACKAGED.includes(SECTION_END));
});

test("fresh project: writes Rules, Skills, every MCP config and Plugin hints", async () => {
  const cwd = tmp();
  const r = await agents({ cwd, yes: true, silent: true });
  assert.deepEqual(r.agents, ["claude", "codex", "cursor", "antigravity"]);
  assert.equal(read(cwd, "AGENTS.md"), PACKAGED);
  assert.equal(read(cwd, "CLAUDE.md").trim(), "@AGENTS.md");
  for (const s of SKILLS) {
    assert.ok(fs.existsSync(path.join(cwd, ".agents/skills", s, "SKILL.md")));
    const link = path.join(cwd, ".claude/skills", s);
    assert.ok(fs.lstatSync(link).isSymbolicLink());
    assert.equal(fs.readlinkSync(link), path.join("..", "..", ".agents", "skills", s));
    assert.ok(fs.existsSync(path.join(link, "SKILL.md")));
  }
  assert.ok(fs.existsSync(path.join(cwd, ".agents/skills/nativecn-visual-qa/references")));
  assert.deepEqual(json(cwd, ".mcp.json"), { mcpServers: { "nativecn-cli": NPX } });
  assert.deepEqual(json(cwd, ".cursor/mcp.json"), { mcpServers: { "nativecn-cli": NPX } });
  assert.deepEqual(json(cwd, ".agents/mcp_config.json"), { mcpServers: { "nativecn-cli": NPX } });
  assert.equal(read(cwd, ".codex/config.toml"), codexMcpBlock());
  assert.match(
    codexMcpBlock(),
    /\[mcp_servers\.nativecn-cli\]\ncommand = "npx"\nargs = \["-y", "nativecn-cli@latest", "mcp"\]/,
  );
  assert.equal(r.pluginHints.length, 4);
  assert.equal(r.configUpdated, false);
  assert.equal(fs.existsSync(path.join(cwd, ".claude/settings.json")), false);

  // Running again changes nothing.
  const again = await agents({ cwd, yes: true, silent: true });
  assert.ok(
    again.files.every((f) => f.status === "unchanged"),
    JSON.stringify(again.files),
  );
});

test("only the chosen agents get MCP config; CLAUDE.md and .claude/skills only for Claude", async () => {
  const cwd = tmp();
  const r = await agents({ cwd, agents: ["cursor"], yes: true, silent: true });
  assert.deepEqual(r.agents, ["cursor"]);
  assert.ok(fs.existsSync(path.join(cwd, ".cursor/mcp.json")));
  for (const f of [".mcp.json", ".codex", ".agents/mcp_config.json", "CLAUDE.md", ".claude"])
    assert.equal(fs.existsSync(path.join(cwd, f)), false, f);
  assert.ok(fs.existsSync(path.join(cwd, ".agents/skills/nativecn-setup/SKILL.md")));
  assert.ok(fs.existsSync(path.join(cwd, "AGENTS.md")));
});

test("existing AGENTS.md without markers: the section is appended; CLAUDE.md gets @AGENTS.md", async () => {
  const cwd = tmp();
  write(cwd, "AGENTS.md", "# My project\n\nUse pnpm.\n");
  write(cwd, "CLAUDE.md", "# Claude notes");
  await agents({ cwd, agents: ["claude"], yes: true, silent: true });
  const text = read(cwd, "AGENTS.md");
  assert.ok(text.startsWith("# My project\n\nUse pnpm.\n\n" + SECTION_START));
  assert.ok(text.trimEnd().endsWith(SECTION_END));
  assert.equal(read(cwd, "CLAUDE.md"), "# Claude notes\n\n@AGENTS.md\n");
});

test("section replacement between markers keeps the user's text around it (--update)", async () => {
  const cwd = tmp();
  write(
    cwd,
    "AGENTS.md",
    `# Mine\n\n${SECTION_START}\nold nativecn rules\n${SECTION_END}\n\n## After\nkeep me\n`,
  );
  const r = await agents({ cwd, agents: ["codex"], update: true, yes: true, silent: true });
  assert.equal(status(r, "AGENTS.md"), "updated");
  const section = PACKAGED.slice(
    PACKAGED.indexOf(SECTION_START),
    PACKAGED.indexOf(SECTION_END) + SECTION_END.length,
  );
  assert.equal(read(cwd, "AGENTS.md"), `# Mine\n\n${section}\n\n## After\nkeep me\n`);
});

test("-y without --update keeps an edited section; malformed markers are left alone", async () => {
  const cwd = tmp();
  const edited = `${SECTION_START}\nmy own edits\n${SECTION_END}\n`;
  write(cwd, "AGENTS.md", edited);
  const r = await agents({ cwd, agents: ["codex"], yes: true, silent: true });
  assert.equal(status(r, "AGENTS.md"), "kept");
  assert.equal(read(cwd, "AGENTS.md"), edited);

  const bad = tmp();
  write(bad, "AGENTS.md", `${SECTION_START}\nno end marker\n`);
  const r2 = await agents({ cwd: bad, agents: ["codex"], update: true, yes: true, silent: true });
  assert.equal(status(r2, "AGENTS.md"), "kept");
});

test("edited Skills are kept with -y and replaced with --update", async () => {
  const cwd = tmp();
  await agents({ cwd, agents: ["codex"], yes: true, silent: true });
  const file = path.join(cwd, ".agents/skills/nativecn-theme/SKILL.md");
  fs.appendFileSync(file, "\nmy note\n");
  fs.writeFileSync(path.join(cwd, ".agents/skills/nativecn-theme/extra.md"), "x");
  let r = await agents({ cwd, agents: ["codex"], yes: true, silent: true });
  assert.equal(status(r, ".agents/skills/nativecn-theme"), "kept");
  assert.match(fs.readFileSync(file, "utf8"), /my note/);
  r = await agents({ cwd, agents: ["codex"], update: true, yes: true, silent: true });
  assert.equal(status(r, ".agents/skills/nativecn-theme"), "updated");
  assert.ok(sameTree(path.join(kit.skills, "nativecn-theme"), path.dirname(file)));
});

test("linkOrCopy: symlinks, or copies when asked (Windows) ", () => {
  const cwd = tmp();
  const target = path.join(cwd, ".agents/skills/s");
  write(cwd, ".agents/skills/s/SKILL.md", "hi");
  assert.equal(linkOrCopy(target, path.join(cwd, ".claude/skills/s")), "symlink");
  assert.ok(fs.lstatSync(path.join(cwd, ".claude/skills/s")).isSymbolicLink());
  assert.equal(linkOrCopy(target, path.join(cwd, "copy/s"), true), "copy");
  const st = fs.lstatSync(path.join(cwd, "copy/s"));
  assert.ok(st.isDirectory() && !st.isSymbolicLink());
  assert.equal(read(cwd, "copy/s/SKILL.md"), "hi");
});

test("an existing .claude/skills copy that matches is accepted as-is", async () => {
  const cwd = tmp();
  await agents({ cwd, agents: ["codex"], yes: true, silent: true });
  for (const s of SKILLS)
    linkOrCopy(path.join(cwd, ".agents/skills", s), path.join(cwd, ".claude/skills", s), true);
  const r = await agents({ cwd, agents: ["claude"], yes: true, silent: true });
  assert.equal(status(r, ".claude/skills/nativecn-setup"), "unchanged");
});

test("MCP merges keep other servers and settings in all four formats", async () => {
  const cwd = tmp();
  write(cwd, ".mcp.json", '{\n  // mine\n  "mcpServers": { "other": { "command": "x" } }\n}\n');
  write(cwd, ".cursor/mcp.json", '{ "mcpServers": { "other": { "url": "https://a" } }, "x": 1 }');
  write(
    cwd,
    ".agents/mcp_config.json",
    '{ "mcpServers": { "other": { "serverUrl": "https://b" } } }',
  );
  write(
    cwd,
    ".codex/config.toml",
    'model = "gpt-5"\n\n[mcp_servers.other]\ncommand = "other"\n\n[profiles.x]\nmodel = "o3"\n',
  );
  await agents({ cwd, yes: true, silent: true });

  assert.match(read(cwd, ".mcp.json"), /\/\/ mine/);
  assert.deepEqual(json(cwd, ".mcp.json"), {
    mcpServers: { other: { command: "x" }, "nativecn-cli": NPX },
  });
  assert.deepEqual(json(cwd, ".cursor/mcp.json"), {
    mcpServers: { other: { url: "https://a" }, "nativecn-cli": NPX },
    x: 1,
  });
  assert.deepEqual(json(cwd, ".agents/mcp_config.json"), {
    mcpServers: { other: { serverUrl: "https://b" }, "nativecn-cli": NPX },
  });
  const toml = read(cwd, ".codex/config.toml");
  assert.ok(
    toml.startsWith('model = "gpt-5"\n\n[mcp_servers.other]\ncommand = "other"\n\n[profiles.x]'),
  );
  assert.ok(toml.endsWith(`\n\n${codexMcpBlock()}`));
});

test("a differing nativecn-cli MCP entry is kept with -y and replaced with --update (TOML too)", async () => {
  const cwd = tmp();
  const old = { command: "node", args: ["local.js"] };
  write(cwd, ".mcp.json", JSON.stringify({ mcpServers: { "nativecn-cli": old } }));
  write(
    cwd,
    ".codex/config.toml",
    '[mcp_servers.nativecn-cli]\ncommand = "node"\n\n[mcp_servers.nativecn-cli.env]\nA = "1"\n\n[other]\nx = 1\n',
  );
  let r = await agents({ cwd, agents: ["claude", "codex"], yes: true, silent: true });
  assert.equal(status(r, ".mcp.json"), "kept");
  assert.equal(status(r, ".codex/config.toml"), "kept");
  assert.deepEqual(json(cwd, ".mcp.json"), { mcpServers: { "nativecn-cli": old } });

  r = await agents({ cwd, agents: ["claude", "codex"], update: true, yes: true, silent: true });
  assert.deepEqual(json(cwd, ".mcp.json"), { mcpServers: { "nativecn-cli": NPX } });
  assert.equal(read(cwd, ".codex/config.toml"), `${codexMcpBlock()}\n[other]\nx = 1\n`);
});

test("remote MCP entries: Antigravity uses serverUrl", () => {
  assert.deepEqual(mcpServerEntry("antigravity", "remote"), {
    serverUrl: "https://nativecn.dev/mcp",
  });
  assert.deepEqual(mcpServerEntry("cursor", "remote"), { url: "https://nativecn.dev/mcp" });
});

function appProject(): string {
  const cwd = tmp();
  write(
    cwd,
    "app.json",
    JSON.stringify({
      expo: {
        scheme: "myapp",
        android: { package: "com.me.app" },
        ios: { bundleIdentifier: "com.me.app" },
      },
    }),
  );
  return cwd;
}

test("--qa-permissions: allow-only rules for Claude, Codex, Cursor; a snippet for Antigravity", async () => {
  const cwd = appProject();
  write(
    cwd,
    ".claude/settings.json",
    '{ "permissions": { "allow": ["Bash(ls)"], "deny": ["Read(.env)"] }, "model": "x" }',
  );
  write(cwd, ".cursor/permissions.json", '{ "terminalAllowlist": ["git status"] }');
  const r = await agents({ cwd, qaPermissions: true, yes: true, silent: true });

  const claude = json(cwd, ".claude/settings.json");
  assert.equal(claude.model, "x");
  assert.deepEqual(claude.permissions.deny, ["Read(.env)"]);
  assert.equal(claude.permissions.ask, undefined);
  const allow: string[] = claude.permissions.allow;
  assert.equal(allow[0], "Bash(ls)");
  for (const rule of [
    "Bash(adb devices -l)",
    "Bash(adb shell screencap -p /sdcard/nativecn-qa.png)",
    "Bash(adb pull /sdcard/nativecn-qa.png *)",
    "Bash(adb shell rm /sdcard/nativecn-qa.png)",
    "Bash(adb shell am broadcast -a com.android.systemui.demo -e command *)",
    "Bash(adb shell am start -a android.intent.action.VIEW -d myapp://*)",
    "Bash(xcrun simctl launch booted com.me.app)",
    "Bash(xcrun simctl openurl booted myapp://*)",
    "Bash(xcrun simctl io booted screenshot *)",
  ])
    assert.ok(allow.includes(rule), rule);
  assert.ok(!allow.some((a) => a.includes(" -s ") || a.includes(">")));

  const codex = read(cwd, ".codex/rules/nativecn-qa.rules");
  assert.match(
    codex,
    /prefix_rule\(pattern = \["adb", "shell", "rm", "\/sdcard\/nativecn-qa.png"\], decision = "allow"/,
  );
  assert.match(
    codex,
    /\["adb", "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d"\]/,
  );
  assert.match(codex, /\["xcrun", "simctl", "launch", "booted", "com.me.app"\]/);
  assert.doesNotMatch(codex, /forbidden|prompt"/);

  const ide: string[] = json(cwd, ".cursor/permissions.json").terminalAllowlist;
  assert.equal(ide[0], "git status");
  assert.ok(ide.includes("adb shell input tap"));
  assert.ok(ide.includes("adb:shell am start -a android.intent.action.VIEW -d myapp://*"));
  const cli: string[] = json(cwd, ".cursor/cli.json").permissions.allow;
  assert.ok(cli.includes("Shell(adb:devices -l)"));
  assert.ok(cli.includes("Shell(adb:shell input tap*)"));
  assert.equal(json(cwd, ".cursor/cli.json").permissions.deny, undefined);

  assert.ok(r.antigravityPermissions);
  const ag: string[] = JSON.parse(r.antigravityPermissions!).permissions.allow;
  assert.ok(ag.includes("command(adb shell rm /sdcard/nativecn-qa.png)"));
  assert.ok(ag.includes("command(regex:xcrun simctl openurl booted myapp://\\S*)"));
  assert.equal(fs.existsSync(path.join(cwd, ".agents/settings.json")), false);

  // Idempotent.
  const again = await agents({ cwd, qaPermissions: true, yes: true, silent: true });
  assert.equal(status(again, ".claude/settings.json"), "unchanged");
  assert.equal(status(again, ".cursor/cli.json"), "unchanged");
  assert.equal(status(again, ".codex/rules/nativecn-qa.rules"), "unchanged");
});

test("--qa-permissions without app ids leaves out the deep-link and launch rules", () => {
  const cmds = qaCommands({}).map((c) => c.join(" "));
  assert.ok(
    !cmds.some((c) => c.includes("am start") || c.includes("launch") || c.includes("openurl")),
  );
  assert.ok(antigravityRules(qaCommands({})).includes("command(adb shell input tap)"));
});

test("components.json: chosen agents are added to `agents`, other keys untouched", async () => {
  const cwd = tmp();
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
    structure: "flat",
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      utils: "@/utils",
      theme: "@/theme",
      screens: "@/screens",
    },
    routes: "src/app",
    agents: ["codex"],
  });
  const before = json(cwd, "components.json");
  const r = await agents({ cwd, agents: ["cursor", "claude"], yes: true, silent: true });
  assert.equal(r.configUpdated, true);
  const after = json(cwd, "components.json");
  assert.deepEqual(after.agents, ["claude", "codex", "cursor"]);
  assert.deepEqual({ ...after, agents: before.agents }, before);

  // Without --agents, the recorded agents are used.
  const r2 = await agents({ cwd, yes: true, silent: true });
  assert.deepEqual(r2.agents, ["claude", "codex", "cursor"]);
  assert.equal(r2.configUpdated, false);
});

test("NATIVECN_AGENT_KIT_DIR also accepts a folder with rules/ and skills/", () => {
  const dir = tmp();
  fs.cpSync(kit.rules, path.join(dir, "rules"), { recursive: true });
  fs.cpSync(path.join(kit.skills, "nativecn-theme"), path.join(dir, "skills/nativecn-theme"), {
    recursive: true,
  });
  process.env.NATIVECN_AGENT_KIT_DIR = dir;
  try {
    const k = fetchAgentKit();
    assert.equal(k.source, dir);
    assert.deepEqual(packagedSkills(k.paths), ["nativecn-theme"]);
  } finally {
    process.env.NATIVECN_AGENT_KIT_DIR = REPO;
  }
});

test("the Agent Kit is fetched at the CLI's release tag, else main", () => {
  assert.equal(repoRef("0.0.0"), "main");
  assert.equal(repoRef("0.1.0-beta.1"), "main");
  assert.equal(repoRef("0.1.0"), "nativecn-cli@0.1.0");
});

test("Plugin hints are the real install commands, one per agent", () => {
  assert.deepEqual(PLUGIN_HINTS, {
    claude:
      "Claude Code plugin: claude plugin marketplace add Barun355/nativecn && claude plugin install nativecn@nativecn",
    codex:
      "Codex plugin: codex plugin marketplace add Barun355/nativecn && codex plugin add nativecn@nativecn",
    cursor:
      "Cursor plugin: git clone --depth 1 https://github.com/Barun355/nativecn ~/.cursor/plugins/local/nativecn, then reload Cursor",
    antigravity: "Antigravity plugin: agy plugin install https://github.com/Barun355/nativecn",
  });
});

test("Plugin manifests at the repo root: the one skills/ folder and the CLI's MCP server", () => {
  const root = (f: string) => parse(fs.readFileSync(path.join(REPO, f), "utf8"));
  const server = { command: MCP_COMMAND.command, args: MCP_COMMAND.args };

  // Claude Code and Codex share one marketplace whose one plugin is the repo root.
  const market = root(".claude-plugin/marketplace.json");
  assert.equal(market.name, "nativecn");
  assert.deepEqual(
    market.plugins.map((x: { name: string; source: unknown }) => [x.name, x.source]),
    [["nativecn", { source: "url", url: "https://github.com/Barun355/nativecn.git" }]],
  );
  for (const f of [".claude-plugin/plugin.json", ".cursor-plugin/plugin.json", "plugin.json"])
    assert.equal(root(f).name, "nativecn", f);
  assert.equal(root(".claude-plugin/plugin.json").mcpServers, "./mcp.json");
  assert.equal(root(".cursor-plugin/plugin.json").mcpServers, "./mcp.json");
  assert.equal(root(".cursor-plugin/plugin.json").skills, "./skills/");
  assert.ok(SKILLS.every((s) => fs.existsSync(path.join(REPO, "skills", s, "SKILL.md"))));

  // The Plugin's MCP server is the one `agents` writes into projects.
  assert.deepEqual(root("mcp.json").mcpServers, {
    [MCP_SERVER_NAME]: { type: "stdio", ...server },
  });
  assert.deepEqual(root("mcp_config.json").mcpServers, { [MCP_SERVER_NAME]: server });
});

test("a failed Agent Kit fetch doesn't throw: Rules and Skills are skipped, the rest is written", async () => {
  process.env.NATIVECN_AGENT_KIT_DIR = path.join(os.tmpdir(), "nativecn-no-such-kit");
  try {
    const cwd = tmp();
    const r = await agents({ cwd, agents: ["claude"], yes: true, silent: true });
    assert.equal(r.kit.installed, false);
    assert.match(r.kit.error!, /NATIVECN_AGENT_KIT_DIR/);
    assert.deepEqual(r.skills, []);
    assert.equal(fs.existsSync(path.join(cwd, "AGENTS.md")), false);
    assert.equal(fs.existsSync(path.join(cwd, ".agents/skills")), false);
    assert.deepEqual(json(cwd, ".mcp.json"), { mcpServers: { "nativecn-cli": NPX } });
    assert.equal(r.pluginHints.length, 1);
  } finally {
    process.env.NATIVECN_AGENT_KIT_DIR = REPO;
  }
});

test("parseAgents validates the list", () => {
  assert.deepEqual(parseAgents("cursor, Claude"), ["claude", "cursor"]);
  assert.throws(() => parseAgents("claude,vim"), /Unknown agent/);
});
