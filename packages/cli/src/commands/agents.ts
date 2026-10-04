import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as p from "@clack/prompts";
import { createTwoFilesPatch } from "diff";
import { applyEdits, modify, parse, type ParseError } from "jsonc-parser";

import { CONFIG_FILE, readConfig } from "../config.ts";
import { REPO_URL, withRepoCheckout } from "../utils/starter.ts";

/**
 * `nativecn-cli agents`: write or refresh the Agent Kit in a project (#57; decisions #16, #18,
 * #19, #20, #34). Rules (AGENTS.md + CLAUDE.md), Skills (.agents/skills + .claude/skills link),
 * MCP config per agent, opt-in allow-only Visual QA permission rules, and Plugin install hints.
 * create/init call `agents()` directly.
 */

export const AGENTS = ["claude", "codex", "cursor", "antigravity"] as const;
export type AgentName = (typeof AGENTS)[number];

export type AgentsOptions = {
  cwd: string;
  agents?: AgentName[];
  /** Replace nativecn content that differs from the packaged version (edited AGENTS.md section, Skills, MCP entry). */
  update?: boolean;
  /** Opt-in: write allow-only rules for the Visual QA device commands (#34). */
  qaPermissions?: boolean;
  yes?: boolean;
  silent?: boolean;
};

/**
 * created: the file did not exist. updated: nativecn content was added or replaced.
 * unchanged: already up to date. kept: it differs from nativecn's version and was left alone.
 */
export type FileStatus = "created" | "updated" | "unchanged" | "kept";
export type AgentsFile = { path: string; status: FileStatus; note?: string };

export type AgentsResult = {
  agents: AgentName[];
  files: AgentsFile[];
  skills: string[];
  /** One line per chosen agent: Plugins install per user, so they are only printed. */
  pluginHints: { agent: AgentName; hint: string }[];
  /** The snippet to paste into Antigravity's settings (it has no project-level permission file). */
  antigravityPermissions?: string;
  /** Whether components.json `agents` was changed. */
  configUpdated: boolean;
  /**
   * Where the Rules and Skills came from. When the GitHub fetch fails (offline, no git),
   * `installed` is false with the reason: AGENTS.md, CLAUDE.md and the Skills are skipped; the MCP
   * config, permissions, components.json and Plugin hints are still written.
   */
  kit: { installed: boolean; source?: string; error?: string };
  notes: string[];
};

export class AgentsError extends Error {}

export const SECTION_START = "<!-- nativecn:start -->";
export const SECTION_END = "<!-- nativecn:end -->";
/** Antigravity reads at most 24 KB per rules file. */
const AGENTS_MD_LIMIT = 24_000;

export const MCP_SERVER_NAME = "nativecn-cli";
export const MCP_COMMAND = { command: "npx", args: ["-y", "nativecn-cli@latest", "mcp"] };
export const MCP_REMOTE_URL = "https://nativecn.dev/mcp";

/** Phone-side screenshot file for Android's save → pull → delete (#34). */
export const QA_PHONE_FILE = "/sdcard/nativecn-qa.png";

/**
 * The Plugin is the nativecn repo root itself (#58): `.claude-plugin/marketplace.json` serves Claude
 * Code and Codex, `.cursor-plugin/plugin.json` serves Cursor, and the root `plugin.json` +
 * `mcp_config.json` serve Antigravity. All of them load the one `skills/` folder.
 */
export const PLUGIN_REPO = "Barun355/nativecn";
export const PLUGIN_HINTS: Record<AgentName, string> = {
  claude: `Claude Code plugin: claude plugin marketplace add ${PLUGIN_REPO} && claude plugin install nativecn@nativecn`,
  codex: `Codex plugin: codex plugin marketplace add ${PLUGIN_REPO} && codex plugin add nativecn@nativecn`,
  cursor: `Cursor plugin: git clone --depth 1 https://github.com/${PLUGIN_REPO} ~/.cursor/plugins/local/nativecn, then reload Cursor`,
  antigravity: `Antigravity plugin: agy plugin install https://github.com/${PLUGIN_REPO}`,
};

// ---------------------------------------------------------------------------------------------
// Where the Agent Kit comes from
// ---------------------------------------------------------------------------------------------

export type AgentKitPaths = { rules: string; skills: string };

export const RULES_PATH = "packages/agent-kit/rules";
export const SKILLS_PATH = "skills";

/** The Rules and Skills inside a folder: either `rules/` + `skills/`, or a nativecn repo checkout. */
function kitIn(dir: string): AgentKitPaths | null {
  const candidates = [
    { rules: path.join(dir, "rules"), skills: path.join(dir, "skills") },
    { rules: path.join(dir, RULES_PATH), skills: path.join(dir, SKILLS_PATH) },
  ];
  return (
    candidates.find(
      (c) => fs.existsSync(path.join(c.rules, "AGENTS.md")) && fs.existsSync(c.skills),
    ) ?? null
  );
}

export type FetchedAgentKit = { paths: AgentKitPaths; source: string; cleanup: () => void };

/**
 * The Rules and Skills, distributed from GitHub only (#16): a shallow sparse git checkout of the
 * nativecn repo's `skills/` and `packages/agent-kit/rules/` at the tag matching this CLI
 * (`nativecn-cli@<version>`), or main for 0.0.x/dev builds or when the tag is missing.
 * `NATIVECN_AGENT_KIT_DIR` points at a local folder instead (development and tests): one holding
 * `rules/` and `skills/`, or a nativecn repo checkout. Throws when the fetch fails.
 */
export function fetchAgentKit(log: (msg: string) => void = () => {}): FetchedAgentKit {
  const local = process.env.NATIVECN_AGENT_KIT_DIR;
  if (local) {
    const paths = kitIn(local);
    if (!paths)
      throw new AgentsError(
        `NATIVECN_AGENT_KIT_DIR (${local}) has no rules/AGENTS.md and skills/ (or ${RULES_PATH} and ${SKILLS_PATH})`,
      );
    return { paths, source: local, cleanup: () => {} };
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nativecn-agent-kit-"));
  try {
    const ref = withRepoCheckout(
      [RULES_PATH, SKILLS_PATH],
      (dir, ref) => {
        if (!kitIn(dir)) throw new AgentsError(`the nativecn repo at ${ref} has no Agent Kit`);
        fs.cpSync(path.join(dir, RULES_PATH), path.join(tmp, "rules"), { recursive: true });
        fs.cpSync(path.join(dir, SKILLS_PATH), path.join(tmp, "skills"), { recursive: true });
        return ref;
      },
      { what: "Agent Kit", log },
    );
    const cleanup = () => fs.rmSync(tmp, { recursive: true, force: true });
    return { paths: kitIn(tmp)!, source: `${REPO_URL}#${ref}`, cleanup };
  } catch (err) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw err;
  }
}

export function packagedSkills(kit: AgentKitPaths): string[] {
  return fs
    .readdirSync(kit.skills, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(kit.skills, d.name, "SKILL.md")))
    .map((d) => d.name)
    .sort();
}

// ---------------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------------

type Ctx = {
  opts: AgentsOptions;
  interactive: boolean;
  files: AgentsFile[];
  notes: string[];
};

export function parseAgents(list: string): AgentName[] {
  const names = list
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const bad = names.filter((n) => !(AGENTS as readonly string[]).includes(n));
  if (bad.length)
    throw new AgentsError(`Unknown agent(s): ${bad.join(", ")}. Choose from ${AGENTS.join(", ")}.`);
  return sortAgents(names as AgentName[]);
}

const sortAgents = (list: AgentName[]) => AGENTS.filter((a) => list.includes(a));

export async function agents(opts: AgentsOptions): Promise<AgentsResult> {
  if (!fs.existsSync(opts.cwd)) throw new AgentsError(`${opts.cwd} does not exist.`);
  const ctx: Ctx = {
    opts,
    interactive: !opts.yes && !opts.silent && Boolean(process.stdin.isTTY),
    files: [],
    notes: [],
  };
  const chosen = await chooseAgents(ctx);

  let kit: AgentsResult["kit"];
  let skills: string[] = [];
  let fetched: FetchedAgentKit | undefined;
  try {
    fetched = fetchAgentKit((msg) => !opts.silent && p.log.info(msg));
    kit = { installed: true, source: fetched.source };
  } catch (err) {
    const reason = (err as Error).message;
    kit = { installed: false, error: reason };
    if (!opts.silent)
      p.log.warn(
        `Agent Kit not installed: ${reason}. Retry with \`npx nativecn-cli@latest agents\`.`,
      );
  }
  if (fetched) {
    try {
      await writeRules(ctx, fetched.paths, chosen);
      skills = await writeSkills(ctx, fetched.paths, chosen);
    } finally {
      fetched.cleanup();
    }
  }
  for (const agent of chosen) await writeMcp(ctx, agent);

  let antigravityPermissions: string | undefined;
  if (opts.qaPermissions) antigravityPermissions = await writeQaPermissions(ctx, chosen);

  const configUpdated = saveAgentsToConfig(ctx, chosen);
  const pluginHints = chosen.map((agent) => ({ agent, hint: PLUGIN_HINTS[agent] }));

  if (chosen.includes("codex"))
    ctx.notes.push(
      `Codex loads .codex/config.toml${opts.qaPermissions ? " and .codex/rules/" : ""} only once this project is trusted. Otherwise run: codex mcp add ${MCP_SERVER_NAME} -- ${MCP_COMMAND.command} ${MCP_COMMAND.args.join(" ")}`,
    );

  const result: AgentsResult = {
    agents: chosen,
    files: ctx.files,
    skills,
    pluginHints,
    antigravityPermissions,
    configUpdated,
    kit,
    notes: ctx.notes,
  };
  if (!opts.silent) report(result, opts);
  return result;
}

async function chooseAgents(ctx: Ctx): Promise<AgentName[]> {
  if (ctx.opts.agents?.length) return sortAgents(ctx.opts.agents);
  const fromConfig = safeReadConfig(ctx.opts.cwd)?.agents ?? [];
  if (fromConfig.length) return sortAgents(fromConfig);
  if (ctx.interactive) {
    const picked = await p.multiselect({
      message: "Which agents do you use?",
      options: AGENTS.map((a) => ({ value: a, label: a })),
      initialValues: [...AGENTS],
      required: true,
    });
    if (p.isCancel(picked)) throw new AgentsError("Cancelled.");
    return sortAgents(picked);
  }
  return [...AGENTS];
}

function safeReadConfig(cwd: string) {
  try {
    return readConfig(cwd);
  } catch {
    return null;
  }
}

/** Ask (interactive) or follow --update (non-interactive) before replacing differing nativecn content. */
async function confirmReplace(ctx: Ctx, message: string, diff?: string): Promise<boolean> {
  if (!ctx.interactive) return Boolean(ctx.opts.update);
  if (diff) process.stdout.write(diff);
  const ok = await p.confirm({ message, initialValue: Boolean(ctx.opts.update) });
  return ok === true;
}

const rel = (ctx: Ctx, abs: string) => path.relative(ctx.opts.cwd, abs).split(path.sep).join("/");

function writeFile(abs: string, content: string) {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

// ---------------------------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------------------------

const normalize = (s: string) => s.replace(/\r\n/g, "\n");

/** The nativecn section (markers included) inside a document, or null / "malformed". */
export function findSection(
  text: string,
): { start: number; end: number; section: string } | null | "malformed" {
  const start = text.indexOf(SECTION_START);
  const endAt = text.indexOf(SECTION_END);
  if (start === -1 && endAt === -1) return null;
  if (start === -1 || endAt === -1 || endAt < start) return "malformed";
  const end = endAt + SECTION_END.length;
  return { start, end, section: text.slice(start, end) };
}

async function writeRules(ctx: Ctx, kit: AgentKitPaths, chosen: AgentName[]) {
  const packaged = normalize(fs.readFileSync(path.join(kit.rules, "AGENTS.md"), "utf8"));
  const found = findSection(packaged);
  if (!found || found === "malformed")
    throw new AgentsError("The packaged AGENTS.md has no nativecn section markers.");
  const section = found.section;

  const file = path.join(ctx.opts.cwd, "AGENTS.md");
  const name = "AGENTS.md";
  let finalText: string;
  if (!fs.existsSync(file)) {
    writeFile(file, packaged);
    ctx.files.push({ path: name, status: "created" });
    finalText = packaged;
  } else {
    const current = normalize(fs.readFileSync(file, "utf8"));
    const existing = findSection(current);
    if (existing === "malformed") {
      ctx.files.push({
        path: name,
        status: "kept",
        note: `has only one of ${SECTION_START} / ${SECTION_END}; fix the markers and run again`,
      });
      finalText = current;
    } else if (existing === null) {
      finalText = `${current.trimEnd()}\n\n${section}\n`;
      writeFile(file, finalText);
      ctx.files.push({ path: name, status: "updated", note: "nativecn section appended" });
    } else if (existing.section === section) {
      ctx.files.push({ path: name, status: "unchanged" });
      finalText = current;
    } else {
      const diff = createTwoFilesPatch(
        "AGENTS.md (yours)",
        "AGENTS.md (nativecn)",
        existing.section + "\n",
        section + "\n",
      );
      const ok = await confirmReplace(
        ctx,
        "The nativecn section in AGENTS.md differs from this version (shown above). Replace it?",
        diff,
      );
      if (ok) {
        finalText = current.slice(0, existing.start) + section + current.slice(existing.end);
        writeFile(file, finalText);
        ctx.files.push({ path: name, status: "updated", note: "nativecn section replaced" });
      } else {
        finalText = current;
        ctx.files.push({
          path: name,
          status: "kept",
          note: "your edited nativecn section was kept (run with --update to replace it)",
        });
      }
    }
  }
  if (Buffer.byteLength(finalText) > AGENTS_MD_LIMIT)
    ctx.notes.push("AGENTS.md is over 24 KB, Antigravity's limit per rules file: trim it.");

  if (chosen.includes("claude")) writeClaudeMd(ctx, kit);
}

function writeClaudeMd(ctx: Ctx, kit: AgentKitPaths) {
  const file = path.join(ctx.opts.cwd, "CLAUDE.md");
  if (!fs.existsSync(file)) {
    writeFile(file, fs.readFileSync(path.join(kit.rules, "CLAUDE.md"), "utf8"));
    ctx.files.push({ path: "CLAUDE.md", status: "created" });
    return;
  }
  const current = fs.readFileSync(file, "utf8");
  if (/^@AGENTS\.md[ \t]*\r?$/m.test(current)) {
    ctx.files.push({ path: "CLAUDE.md", status: "unchanged" });
    return;
  }
  const sep = current.length === 0 || current.endsWith("\n") ? "" : "\n";
  fs.writeFileSync(file, `${current}${sep}${current.trim() ? "\n" : ""}@AGENTS.md\n`);
  ctx.files.push({ path: "CLAUDE.md", status: "updated", note: "@AGENTS.md appended" });
}

// ---------------------------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------------------------

function listFiles(dir: string, base = dir): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) for (const [k, v] of listFiles(abs, base)) out.set(k, v);
    else if (entry.isFile())
      out.set(path.relative(base, abs).split(path.sep).join("/"), fs.readFileSync(abs));
  }
  return out;
}

export function sameTree(a: string, b: string): boolean {
  const fa = listFiles(a);
  const fb = listFiles(b);
  if (fa.size !== fb.size) return false;
  for (const [k, v] of fa) {
    const other = fb.get(k);
    if (!other || !other.equals(v)) return false;
  }
  return true;
}

function replaceDir(from: string, to: string) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

/**
 * Point `link` at `target` with a relative directory symlink; copy instead on Windows, when
 * `copy` is set, or when the symlink fails. Returns how it was linked.
 */
export function linkOrCopy(target: string, link: string, copy = process.platform === "win32") {
  fs.mkdirSync(path.dirname(link), { recursive: true });
  if (!copy) {
    try {
      fs.symlinkSync(path.relative(path.dirname(link), target), link, "dir");
      return "symlink" as const;
    } catch {
      // fall through to a copy
    }
  }
  fs.cpSync(target, link, { recursive: true });
  return "copy" as const;
}

async function writeSkills(ctx: Ctx, kit: AgentKitPaths, chosen: AgentName[]): Promise<string[]> {
  const names = packagedSkills(kit);
  for (const name of names) {
    const src = path.join(kit.skills, name);
    const dest = path.join(ctx.opts.cwd, ".agents", "skills", name);
    const label = `.agents/skills/${name}`;
    if (!fs.existsSync(dest)) {
      replaceDir(src, dest);
      ctx.files.push({ path: label, status: "created" });
    } else if (sameTree(src, dest)) {
      ctx.files.push({ path: label, status: "unchanged" });
    } else if (await confirmReplace(ctx, `${label} differs from this version. Replace it?`)) {
      replaceDir(src, dest);
      ctx.files.push({ path: label, status: "updated" });
    } else {
      ctx.files.push({
        path: label,
        status: "kept",
        note: "differs; run with --update to replace",
      });
    }
  }

  if (chosen.includes("claude")) {
    for (const name of names) await linkClaudeSkill(ctx, name);
  }
  return names;
}

async function linkClaudeSkill(ctx: Ctx, name: string) {
  const target = path.join(ctx.opts.cwd, ".agents", "skills", name);
  const link = path.join(ctx.opts.cwd, ".claude", "skills", name);
  const label = `.claude/skills/${name}`;
  const expected = path.relative(path.dirname(link), target);
  let stat: fs.Stats | undefined;
  try {
    stat = fs.lstatSync(link);
  } catch {
    stat = undefined;
  }
  if (!stat) {
    const how = linkOrCopy(target, link);
    ctx.files.push({ path: label, status: "created", note: how });
    return;
  }
  if (stat.isSymbolicLink()) {
    const current = fs.readlinkSync(link);
    if (path.resolve(path.dirname(link), current) === path.resolve(target)) {
      ctx.files.push({ path: label, status: "unchanged", note: "symlink" });
      return;
    }
  } else if (stat.isDirectory() && sameTree(target, link)) {
    ctx.files.push({ path: label, status: "unchanged", note: "copy" });
    return;
  }
  if (await confirmReplace(ctx, `${label} differs from .agents/skills/${name}. Replace it?`)) {
    fs.rmSync(link, { recursive: true, force: true });
    const how = linkOrCopy(target, link);
    ctx.files.push({ path: label, status: "updated", note: how });
  } else {
    ctx.files.push({
      path: label,
      status: "kept",
      note: `not linked to ${expected}; run with --update to replace`,
    });
  }
}

// ---------------------------------------------------------------------------------------------
// JSON / TOML merging
// ---------------------------------------------------------------------------------------------

const FORMAT = { formattingOptions: { insertSpaces: true, tabSize: 2, eol: "\n" } };

function readJsonc(abs: string): { text: string; data: Record<string, unknown> } {
  const text = fs.readFileSync(abs, "utf8");
  const errors: ParseError[] = [];
  const data = parse(text, errors, { allowTrailingComma: true }) as unknown;
  if (errors.length || (data !== undefined && (typeof data !== "object" || Array.isArray(data))))
    throw new AgentsError(`${abs} is not a valid JSON object.`);
  return { text: text.trim() ? text : "{}\n", data: (data ?? {}) as Record<string, unknown> };
}

function setJsonc(text: string, keyPath: string[], value: unknown): string {
  return applyEdits(text, modify(text, keyPath, value, FORMAT));
}

function getPath(data: unknown, keyPath: string[]): unknown {
  let cur = data;
  for (const k of keyPath) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

const deepEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Set one key (e.g. mcpServers.nativecn-cli) in a JSON file, keeping everything else and its comments. */
async function mergeJsonKey(ctx: Ctx, abs: string, keyPath: string[], value: unknown) {
  const label = rel(ctx, abs);
  if (!fs.existsSync(abs)) {
    writeFile(abs, setJsonc("{}", keyPath, value) + "\n");
    ctx.files.push({ path: label, status: "created" });
    return;
  }
  let parsed;
  try {
    parsed = readJsonc(abs);
  } catch (err) {
    ctx.files.push({ path: label, status: "kept", note: (err as Error).message });
    return;
  }
  const current = getPath(parsed.data, keyPath);
  if (deepEqual(current, value)) {
    ctx.files.push({ path: label, status: "unchanged" });
    return;
  }
  if (
    current !== undefined &&
    !(await confirmReplace(
      ctx,
      `${keyPath.join(".")} in ${label} differs from nativecn's. Replace it?`,
    ))
  ) {
    ctx.files.push({ path: label, status: "kept", note: "differs; run with --update to replace" });
    return;
  }
  fs.writeFileSync(abs, ensureNewline(setJsonc(parsed.text, keyPath, value)));
  ctx.files.push({ path: label, status: "updated" });
}

/** Add string entries to an array in a JSON file (union, existing entries first and untouched). */
function mergeJsonList(ctx: Ctx, abs: string, keyPath: string[], entries: string[]) {
  const label = rel(ctx, abs);
  if (!fs.existsSync(abs)) {
    writeFile(abs, setJsonc("{}", keyPath, entries) + "\n");
    ctx.files.push({ path: label, status: "created" });
    return;
  }
  let parsed;
  try {
    parsed = readJsonc(abs);
  } catch (err) {
    ctx.files.push({ path: label, status: "kept", note: (err as Error).message });
    return;
  }
  const raw = getPath(parsed.data, keyPath);
  const current = Array.isArray(raw) ? raw : [];
  const missing = entries.filter((e) => !current.includes(e));
  if (!missing.length) {
    ctx.files.push({ path: label, status: "unchanged" });
    return;
  }
  fs.writeFileSync(abs, ensureNewline(setJsonc(parsed.text, keyPath, [...current, ...missing])));
  ctx.files.push({ path: label, status: "updated", note: `${missing.length} rule(s) added` });
}

const ensureNewline = (s: string) => (s.endsWith("\n") ? s : s + "\n");

export function codexMcpBlock(): string {
  const args = MCP_COMMAND.args.map((a) => JSON.stringify(a)).join(", ");
  return `[mcp_servers.${MCP_SERVER_NAME}]\ncommand = "${MCP_COMMAND.command}"\nargs = [${args}]\n`;
}

/**
 * Find the `[mcp_servers.nativecn-cli]` table (and its sub-tables) in a TOML document by line:
 * from its header up to the next header that isn't ours.
 */
export function findTomlTable(text: string, name = MCP_SERVER_NAME) {
  const lines = text.split("\n");
  const esc = name.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
  const ours = new RegExp(
    `^\\s*\\[\\s*mcp_servers\\s*\\.\\s*(?:"${esc}"|${esc})\\s*(?:\\.[^\\]]*)?\\]\\s*(#.*)?$`,
  );
  const header = /^\s*\[/;
  const start = lines.findIndex((l) => ours.test(l));
  if (start === -1) return null;
  let end = start + 1;
  while (end < lines.length && !(header.test(lines[end]!) && !ours.test(lines[end]!))) end++;
  // Leave trailing blank lines to the next table.
  while (end > start + 1 && lines[end - 1]!.trim() === "") end--;
  return { lines, start, end, block: lines.slice(start, end).join("\n") + "\n" };
}

async function mergeCodexToml(ctx: Ctx, abs: string) {
  const label = rel(ctx, abs);
  const block = codexMcpBlock();
  if (!fs.existsSync(abs)) {
    writeFile(abs, block);
    ctx.files.push({ path: label, status: "created" });
    return;
  }
  const text = normalize(fs.readFileSync(abs, "utf8"));
  const found = findTomlTable(text);
  if (!found) {
    const prefix = text.trim() ? `${text.trimEnd()}\n\n` : "";
    fs.writeFileSync(abs, prefix + block);
    ctx.files.push({ path: label, status: "updated" });
    return;
  }
  if (found.block.trim() === block.trim()) {
    ctx.files.push({ path: label, status: "unchanged" });
    return;
  }
  const diff = createTwoFilesPatch(`${label} (yours)`, `${label} (nativecn)`, found.block, block);
  if (
    !(await confirmReplace(
      ctx,
      `[mcp_servers.${MCP_SERVER_NAME}] in ${label} differs. Replace it?`,
      diff,
    ))
  ) {
    ctx.files.push({ path: label, status: "kept", note: "differs; run with --update to replace" });
    return;
  }
  const lines = [...found.lines];
  lines.splice(found.start, found.end - found.start, ...block.trimEnd().split("\n"));
  fs.writeFileSync(abs, ensureNewline(lines.join("\n")));
  ctx.files.push({ path: label, status: "updated" });
}

// ---------------------------------------------------------------------------------------------
// MCP
// ---------------------------------------------------------------------------------------------

/** The MCP server entry for an agent. create/init write the local stdio server (#19). */
export function mcpServerEntry(
  agent: Exclude<AgentName, "codex">,
  kind: "local" | "remote" = "local",
) {
  if (kind === "local") return { command: MCP_COMMAND.command, args: [...MCP_COMMAND.args] };
  if (agent === "antigravity") return { serverUrl: MCP_REMOTE_URL };
  if (agent === "claude") return { type: "http", url: MCP_REMOTE_URL };
  return { url: MCP_REMOTE_URL };
}

export const MCP_FILES: Record<AgentName, string> = {
  claude: ".mcp.json",
  cursor: ".cursor/mcp.json",
  codex: ".codex/config.toml",
  antigravity: ".agents/mcp_config.json",
};

async function writeMcp(ctx: Ctx, agent: AgentName) {
  const abs = path.join(ctx.opts.cwd, MCP_FILES[agent]);
  if (agent === "codex") return mergeCodexToml(ctx, abs);
  return mergeJsonKey(ctx, abs, ["mcpServers", MCP_SERVER_NAME], mcpServerEntry(agent));
}

// ---------------------------------------------------------------------------------------------
// --qa-permissions (#34; research/agent-permissions.md)
// ---------------------------------------------------------------------------------------------

export type AppIds = { scheme?: string; package?: string; bundleId?: string };

/** The dev app's scheme, Android package and iOS bundle id from app.json (not app.config.*). */
export function readAppIds(cwd: string): AppIds {
  const file = path.join(cwd, "app.json");
  if (!fs.existsSync(file)) return {};
  try {
    const json = JSON.parse(fs.readFileSync(file, "utf8")) as {
      expo?: {
        scheme?: string | string[];
        android?: { package?: string };
        ios?: { bundleIdentifier?: string };
      };
    };
    const expo = json.expo ?? {};
    const scheme = Array.isArray(expo.scheme) ? expo.scheme[0] : expo.scheme;
    return { scheme, package: expo.android?.package, bundleId: expo.ios?.bundleIdentifier };
  } catch {
    return {};
  }
}

/**
 * One device command per entry, as words. `"*"` as the last word means "any trailing arguments".
 * Commands follow #34: no `-s` (one device), `booted`, `-p <package>`, save → pull → delete.
 */
export function qaCommands(ids: AppIds): string[][] {
  const cmds: string[][] = [
    ["adb", "devices", "-l"],
    ["adb", "exec-out", "uiautomator", "dump", "/dev/tty"],
    ["adb", "shell", "input", "tap", "*"],
    ["adb", "shell", "input", "swipe", "*"],
    ["adb", "shell", "input", "text", "*"],
    ["adb", "shell", "input", "keyevent", "*"],
    ["adb", "shell", "screencap", "-p", QA_PHONE_FILE],
    ["adb", "pull", QA_PHONE_FILE, "*"],
    ["adb", "shell", "rm", QA_PHONE_FILE],
    ["adb", "shell", "cmd", "uimode", "night", "yes"],
    ["adb", "shell", "cmd", "uimode", "night", "no"],
    ["adb", "shell", "settings", "put", "global", "sysui_demo_allowed", "1"],
    ["adb", "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "*"],
    ["xcrun", "simctl", "list", "devices", "booted", "-j"],
    ["xcrun", "simctl", "io", "booted", "screenshot", "*"],
    ["xcrun", "simctl", "ui", "booted", "appearance", "dark"],
    ["xcrun", "simctl", "ui", "booted", "appearance", "light"],
    ["xcrun", "simctl", "status_bar", "booted", "override", "*"],
    ["xcrun", "simctl", "status_bar", "booted", "clear"],
  ];
  if (ids.scheme && ids.package)
    cmds.push([
      "adb",
      "shell",
      "am",
      "start",
      "-a",
      "android.intent.action.VIEW",
      "-d",
      `${ids.scheme}://*`,
    ]);
  if (ids.bundleId) cmds.push(["xcrun", "simctl", "launch", "booted", ids.bundleId]);
  if (ids.scheme) cmds.push(["xcrun", "simctl", "openurl", "booted", `${ids.scheme}://*`]);
  return cmds;
}

/** Claude Code: `Bash(<command>)`, `*` matches any text. */
export function claudeRules(cmds: string[][]): string[] {
  return cmds.map((c) => `Bash(${c.join(" ")})`);
}

/** Cursor IDE terminalAllowlist: token prefixes; `cmd:argsGlob` where a token ends mid-way. */
export function cursorIdeRules(cmds: string[][]): string[] {
  return cmds.map((c) => {
    const last = c[c.length - 1]!;
    if (last === "*") return c.slice(0, -1).join(" ");
    if (last.endsWith("*")) return `${c[0]}:${c.slice(1).join(" ")}`;
    return c.join(" ");
  });
}

/** Cursor CLI: `Shell(cmd:argsGlob)`. */
export function cursorCliRules(cmds: string[][]): string[] {
  return cmds.map((c) => {
    const args = c.slice(1).join(" ").replace(/ \*$/, "*");
    return `Shell(${c[0]}:${args})`;
  });
}

/** Codex: Starlark prefix_rule calls. No wildcards, so trailing wildcards become the prefix. */
export function codexRules(cmds: string[][]): string {
  const lines = [
    "# nativecn Visual QA allowlist, written by `nativecn-cli agents --qa-permissions`.",
    "# Allow rules only: any other command still prompts. Codex loads this file only when",
    "# this project's .codex/ folder is trusted.",
    "",
  ];
  const seen = new Set<string>();
  for (const c of cmds) {
    const words = c.filter((w) => w !== "*").map((w) => w.replace(/\*$/, ""));
    // `-d <scheme>://*` / `openurl booted <scheme>://*`: a prefix rule can't pin a partial token.
    const prefix = words[words.length - 1]!.endsWith("://") ? words.slice(0, -1) : words;
    const key = JSON.stringify(prefix);
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(
      `prefix_rule(pattern = [${prefix.map((w) => JSON.stringify(w)).join(", ")}], decision = "allow", justification = "nativecn Visual QA Loop")`,
    );
  }
  return lines.join("\n") + "\n";
}

/** Antigravity: `command(prefix)` or `command(regex:…)` (each token an anchored regex). */
export function antigravityRules(cmds: string[][]): string[] {
  const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return cmds.map((c) => {
    const last = c[c.length - 1]!;
    if (last === "*") return `command(${c.slice(0, -1).join(" ")})`;
    if (last.endsWith("*"))
      return `command(regex:${[...c.slice(0, -1), last.slice(0, -1)].map(reEsc).join(" ")}\\S*)`;
    return `command(${c.join(" ")})`;
  });
}

async function writeQaPermissions(ctx: Ctx, chosen: AgentName[]): Promise<string | undefined> {
  const ids = readAppIds(ctx.opts.cwd);
  const missing = [
    !ids.scheme && "expo.scheme",
    !ids.package && "expo.android.package",
    !ids.bundleId && "expo.ios.bundleIdentifier",
  ].filter(Boolean);
  if (missing.length)
    ctx.notes.push(
      `app.json has no ${missing.join(", ")}: the deep-link / launch rules that need them were left out. Add them and run \`nativecn-cli agents --qa-permissions\` again.`,
    );
  const cmds = qaCommands(ids);
  const cwd = ctx.opts.cwd;

  if (chosen.includes("claude"))
    mergeJsonList(
      ctx,
      path.join(cwd, ".claude", "settings.json"),
      ["permissions", "allow"],
      claudeRules(cmds),
    );
  if (chosen.includes("codex")) {
    const abs = path.join(cwd, ".codex", "rules", "nativecn-qa.rules");
    const content = codexRules(cmds);
    const label = rel(ctx, abs);
    if (!fs.existsSync(abs)) {
      writeFile(abs, content);
      ctx.files.push({ path: label, status: "created" });
    } else if (fs.readFileSync(abs, "utf8") === content) {
      ctx.files.push({ path: label, status: "unchanged" });
    } else if (
      await confirmReplace(
        ctx,
        `${label} differs from nativecn's. Replace it?`,
        createTwoFilesPatch(
          `${label} (yours)`,
          `${label} (nativecn)`,
          fs.readFileSync(abs, "utf8"),
          content,
        ),
      )
    ) {
      writeFile(abs, content);
      ctx.files.push({ path: label, status: "updated" });
    } else {
      ctx.files.push({
        path: label,
        status: "kept",
        note: "differs; run with --update to replace",
      });
    }
  }
  if (chosen.includes("cursor")) {
    mergeJsonList(
      ctx,
      path.join(cwd, ".cursor", "permissions.json"),
      ["terminalAllowlist"],
      cursorIdeRules(cmds),
    );
    mergeJsonList(
      ctx,
      path.join(cwd, ".cursor", "cli.json"),
      ["permissions", "allow"],
      cursorCliRules(cmds),
    );
    ctx.notes.push(
      "Cursor: .cursor/permissions.json replaces your own IDE terminal allowlist in this project.",
    );
  }
  if (!chosen.includes("antigravity")) return undefined;
  const snippet = JSON.stringify({ permissions: { allow: antigravityRules(cmds) } }, null, 2);
  ctx.notes.push(
    "Antigravity has no project-level permission file. Paste the snippet below into Settings > Permission Settings (or ~/.gemini/antigravity-cli/settings.json):\n" +
      snippet,
  );
  return snippet;
}

// ---------------------------------------------------------------------------------------------
// components.json and output
// ---------------------------------------------------------------------------------------------

/** Add the chosen agents to components.json `agents` (keeps agents recorded earlier). */
function saveAgentsToConfig(ctx: Ctx, chosen: AgentName[]): boolean {
  const file = path.join(ctx.opts.cwd, CONFIG_FILE);
  if (!fs.existsSync(file)) return false;
  let config;
  try {
    config = readConfig(ctx.opts.cwd);
  } catch (err) {
    ctx.notes.push(`${CONFIG_FILE} was not updated: ${(err as Error).message}`);
    return false;
  }
  if (!config) return false;
  const next = sortAgents([...new Set([...config.agents, ...chosen])]);
  if (deepEqual(next, config.agents)) return false;
  const text = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, ensureNewline(setJsonc(text, ["agents"], next)));
  ctx.files.push({ path: CONFIG_FILE, status: "updated", note: `agents: ${next.join(", ")}` });
  return true;
}

function report(r: AgentsResult, opts: AgentsOptions) {
  const mark: Record<FileStatus, string> = {
    created: "+",
    updated: "~",
    unchanged: "=",
    kept: "!",
  };
  p.log.message(
    [
      `Agents: ${r.agents.join(", ")}`,
      ...r.files.map((f) => `  ${mark[f.status]} ${f.path}${f.note ? ` (${f.note})` : ""}`),
    ].join("\n"),
  );
  if (r.files.some((f) => f.status === "kept") && !opts.update)
    p.log.warn(
      "Some files differ from nativecn's version and were kept. Run with --update to replace them.",
    );
  for (const note of r.notes) p.log.info(note);
  p.log.message(
    ["Plugins install per user:", ...r.pluginHints.map((h) => `  ${h.hint}`)].join("\n"),
  );
}
