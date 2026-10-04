// Agent Kit checks (#31): the Rules file stays under Antigravity's 24 KB limit, and every Skill
// (`skills/<name>/SKILL.md`) has valid, portable frontmatter whose `name` matches its folder (#20).
// Usage: node scripts/check.ts   (exit 1 with every problem listed)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const REPO = path.resolve(import.meta.dirname, "../../..");
/** Antigravity reads at most 24 KB per rules file (the same limit `nativecn-cli agents` warns at). */
export const AGENTS_MD_LIMIT = 24_000;
/** The rules files the Agent Kit writes into apps. */
export const RULES_FILES = ["packages/agent-kit/rules/AGENTS.md"];
export const SKILLS_DIR = "skills";
/** The portable Agent Skills frontmatter keys (agentskills.io), the only ones allowed (#20). */
export const SKILL_KEYS = [
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
] as const;

export type Frontmatter = Record<string, string | Record<string, string>>;

/**
 * Parse a SKILL.md's YAML frontmatter: top-level `key: value` pairs, plus one level of indented
 * `key: value` pairs under a key with no value (e.g. `metadata:`). Throws on anything else.
 */
export function parseFrontmatter(source: string): Frontmatter {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") throw new Error("must start with a --- frontmatter block");
  const end = lines.indexOf("---", 1);
  if (end < 0) throw new Error("frontmatter is not closed with ---");
  const data: Frontmatter = {};
  let parent: Record<string, string> | undefined;
  for (const [i, line] of lines.slice(1, end).entries()) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const nested = /^\s+([\w-]+):\s*(.*)$/.exec(line);
    if (nested && parent) {
      parent[nested[1]!] = unquote(nested[2]!);
      continue;
    }
    const top = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!top) throw new Error(`frontmatter line ${i + 2} is not "key: value": ${line}`);
    const [, key, value] = top as unknown as [string, string, string];
    if (key in data) throw new Error(`frontmatter repeats "${key}"`);
    if (value === "") {
      parent = {};
      data[key] = parent;
    } else {
      parent = undefined;
      data[key] = unquote(value);
    }
  }
  return data;
}

function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v.at(-1) === v[0]) return v.slice(1, -1);
  // A plain YAML scalar can't contain ": " or " #" (YAML reads a nested key or a comment).
  if (/:\s|\s#/.test(v)) throw new Error(`quote this value, it contains ": " or " #": ${v}`);
  return v;
}

/** Problems with one Skill's frontmatter (empty means valid). */
export function skillProblems(folder: string, source: string): string[] {
  let fm: Frontmatter;
  try {
    fm = parseFrontmatter(source);
  } catch (err) {
    return [(err as Error).message];
  }
  const problems: string[] = [];
  for (const key of Object.keys(fm)) {
    if (!(SKILL_KEYS as readonly string[]).includes(key))
      problems.push(`"${key}" is not a portable frontmatter key (${SKILL_KEYS.join(", ")})`);
  }
  const { name, description, compatibility, metadata } = fm;
  if (typeof name !== "string" || !name) problems.push(`"name" is required`);
  else {
    if (name !== folder) problems.push(`"name" is "${name}" but the folder is "${folder}"`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64)
      problems.push(`"name" must be lowercase letters, digits and single hyphens, at most 64`);
  }
  if (typeof description !== "string" || !description) problems.push(`"description" is required`);
  else if (description.length > 1024) problems.push(`"description" is over 1024 characters`);
  if (
    compatibility !== undefined &&
    (typeof compatibility !== "string" || compatibility.length > 500)
  )
    problems.push(`"compatibility" must be a string of at most 500 characters`);
  if (metadata !== undefined && typeof metadata === "string")
    problems.push(`"metadata" must be a map of string keys to string values`);
  return problems;
}

/** Every Agent Kit problem in the repo at `root`. */
export function agentKitProblems(root = REPO): string[] {
  const problems: string[] = [];
  for (const rel of RULES_FILES) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) {
      problems.push(`${rel} is missing`);
      continue;
    }
    const size = fs.statSync(file).size;
    if (size > AGENTS_MD_LIMIT)
      problems.push(
        `${rel} is ${size} bytes, over the ${AGENTS_MD_LIMIT}-byte limit (Antigravity)`,
      );
  }
  const skills = path.join(root, SKILLS_DIR);
  const folders = fs.existsSync(skills)
    ? fs.readdirSync(skills, { withFileTypes: true }).filter((e) => e.isDirectory())
    : [];
  if (folders.length === 0) problems.push(`${SKILLS_DIR}/ has no Skills`);
  for (const { name: folder } of folders) {
    const file = path.join(skills, folder, "SKILL.md");
    if (!fs.existsSync(file)) {
      problems.push(`${SKILLS_DIR}/${folder}: SKILL.md is missing`);
      continue;
    }
    for (const p of skillProblems(folder, fs.readFileSync(file, "utf8")))
      problems.push(`${SKILLS_DIR}/${folder}/SKILL.md: ${p}`);
  }
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const problems = agentKitProblems();
  if (problems.length) {
    console.error(["Agent Kit check failed:", ...problems.map((p) => `  - ${p}`)].join("\n"));
    process.exit(1);
  }
  console.log("Agent Kit check passed.");
}
