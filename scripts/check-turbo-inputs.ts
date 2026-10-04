// Turborepo may only restore a cached result when nothing the task reads has changed (#136). This
// checks that every file a task reads from outside its own package is part of that task's hash:
// either one of its own `inputs`, a global dependency, or an input of a task it depends on (a
// workspace dependency's `transit` node, see turbo.json). It reads the hashes Turborepo computes
// (`turbo run --dry=json`), so it checks the real configuration, not a copy of it.
//
// Two kinds of cross-package reads:
//   - imports: every relative `import`/`require` in a package that resolves outside it, found by
//     scanning the source, so a new one is caught without editing this file;
//   - runtime reads: files a task opens by path (fs reads, a folder passed in an env var), listed
//     in RUNTIME_READS below. A new one of these must be added here by hand.
//
// Usage: node --no-warnings scripts/check-turbo-inputs.ts [--mutate]
//   --mutate  also prove it end to end: for one file per cross-package read, append a byte, re-run
//             `turbo run --dry=json`, and require every task that reads it to get a new hash (a
//             cache miss), and the negative controls below to keep theirs. Files are restored.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TASKS = ["lint", "typecheck", "test", "build"];
const NONE = "<NONEXISTENT>";

type Match = string | RegExp;
type RuntimeRead = { tasks: string[]; files: Match[]; why: string; optional?: boolean };

/** Files tasks read by path at run time (not through an import). `*#task`: every package's task. */
const RUNTIME_READS: RuntimeRead[] = [
  { tasks: ["*#typecheck"], files: ["tsconfig.base.json"], why: "tsconfig `extends`" },
  { tasks: ["*#lint"], files: ["eslint.config.js"], why: "ESLint finds the root flat config" },
  {
    tasks: ["ui#test"],
    files: ["apps/web/public/fonts/"],
    why: "presets/fonts.test.ts checks the served font files",
  },
  {
    tasks: ["ui#test", "ui#build"],
    files: ["docs/adr/"],
    why: "dependency-rule.ts checks each recorded exception's ADR exists",
  },
  { tasks: ["agent-kit#test"], files: ["skills/"], why: "check.ts validates every Skill" },
  {
    tasks: ["nativecn-cli#test"],
    files: [
      "skills/",
      "packages/agent-kit/rules/",
      ".claude-plugin/",
      ".cursor-plugin/",
      "plugin.json",
      "mcp.json",
      "mcp_config.json",
    ],
    why: "agents/init tests install the Agent Kit from this checkout and read the Plugin manifests",
  },
  {
    tasks: ["web#test", "showcase#test", "showcase#lint"],
    files: [/^packages\/ui\/(?!scripts\/).*_registry\.ts$/],
    why: "loadItems() imports every _registry.ts by a computed path",
  },
  {
    tasks: ["web#test"],
    files: ["packages/cli/src/mcp/__fixtures__/r/"],
    why: "mcp.test.ts points NATIVECN_REGISTRY_URL at the CLI's fixture Registry",
  },
  {
    tasks: ["web#build"],
    files: ["packages/cli/CHANGELOG.md", "packages/ui/CHANGELOG.md"],
    why: "lib/changelog.ts renders the changelogs (not written until the first release)",
    optional: true,
  },
];

/** Files whose change must NOT re-run these tasks: proves the hashes are not just "everything". */
const NEGATIVE_CONTROLS: { file: string; unchanged: string[] }[] = [
  { file: "skills/nativecn-setup/SKILL.md", unchanged: ["ui#test", "preset#test", "web#test"] },
  { file: "apps/web/public/fonts/inter/OFL.txt", unchanged: ["preset#test", "nativecn-cli#test"] },
  { file: "packages/agent-kit/rules/AGENTS.md", unchanged: ["ui#test", "web#test"] },
];

/** Assets only Metro reads when bundling the Showcase; no cached task opens them. */
const BUNDLER_ONLY = /\.(ttf|otf|png|jpe?g|gif|webp|svg|mp4)$/;
const CODE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["'](\.{1,2}\/[^"']+)["']/g;

type DryTask = {
  taskId: string;
  task: string;
  package: string;
  hash: string;
  command: string;
  directory: string;
  inputs: Record<string, string>;
  dependencies: string[];
};
type Dry = { tasks: DryTask[]; globalCacheInputs: { files: Record<string, string> } };

function dryRun(): Dry {
  const out = execFileSync(
    path.join(ROOT, "node_modules/.bin/turbo"),
    ["run", ...TASKS, "--dry=json"],
    {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    },
  );
  return JSON.parse(out) as Dry;
}

const tracked = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const matches = (file: string, m: Match) =>
  typeof m === "string" ? (m.endsWith("/") ? file.startsWith(m) : file === m) : m.test(file);

/** Every repo-relative file in a task's hash: its inputs, the global ones, its dependencies'. */
function closures(dry: Dry): Map<string, Set<string>> {
  const byId = new Map(dry.tasks.map((t) => [t.taskId, t]));
  const global = Object.keys(dry.globalCacheInputs.files);
  const memo = new Map<string, Set<string>>();
  const visit = (id: string): Set<string> => {
    const hit = memo.get(id);
    if (hit) return hit;
    const t = byId.get(id)!;
    const set = new Set<string>(global);
    for (const f of Object.keys(t.inputs)) set.add(path.posix.join(t.directory, f));
    for (const d of t.dependencies) for (const f of visit(d)) set.add(f);
    memo.set(id, set);
    return set;
  };
  for (const t of dry.tasks) visit(t.taskId);
  return memo;
}

function resolveImport(from: string, spec: string): string | undefined {
  const base = path.resolve(path.dirname(path.join(ROOT, from)), spec);
  const candidates = [
    base,
    ...[".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"].map((e) => base + e),
    ...["index.ts", "index.tsx", "index.js"].map((i) => path.join(base, i)),
  ];
  const found = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
  return found && path.relative(ROOT, found).split(path.sep).join("/");
}

/** A required (task, file) pair, and where the requirement comes from. */
type Read = { task: string; file: string; why: string };

function requiredReads(dry: Dry): { reads: Read[]; skipped: string[] } {
  const real = dry.tasks.filter((t) => t.command !== NONE);
  const dirs = [...new Set(dry.tasks.map((t) => t.directory))].filter((d) => d !== ".");
  const reads: Read[] = [];
  const skipped: string[] = [];

  // Imports that leave their package: every task the package runs must hash the target.
  for (const dir of dirs) {
    const pkgTasks = real.filter((t) => t.directory === dir && t.task !== "build");
    for (const file of tracked.filter((f) => f.startsWith(dir + "/") && CODE.test(f))) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      for (const [, spec] of source.matchAll(SPECIFIER)) {
        const target = resolveImport(file, spec!);
        if (!target || target.startsWith(dir + "/") || target.startsWith("..")) continue;
        if (BUNDLER_ONLY.test(target)) {
          skipped.push(`${file} → ${target} (bundler-only asset)`);
          continue;
        }
        for (const t of pkgTasks)
          reads.push({ task: t.taskId, file: target, why: `imported by ${file}` });
      }
    }
  }

  // tsconfig `paths` aliases into another package (e.g. the Showcase's `@/registry/*` → packages/ui):
  // every task the package runs must hash every file under the aliased folder.
  for (const dir of dirs) {
    const tsconfig = path.join(ROOT, dir, "tsconfig.json");
    if (!fs.existsSync(tsconfig)) continue;
    const paths: Record<string, string[]> =
      JSON.parse(fs.readFileSync(tsconfig, "utf8")).compilerOptions?.paths ?? {};
    const pkgTasks = real.filter((t) => t.directory === dir && t.task !== "build");
    for (const [alias, targets] of Object.entries(paths))
      for (const target of targets) {
        const folder = path
          .relative(ROOT, path.resolve(ROOT, dir, target.replace(/\*.*$/, "")))
          .split(path.sep)
          .join("/");
        if (folder.startsWith(dir + "/") || folder === dir || folder.startsWith("..")) continue;
        for (const file of tracked.filter((f) => f.startsWith(folder + "/")))
          for (const t of pkgTasks)
            reads.push({ task: t.taskId, file, why: `${dir}/tsconfig.json alias ${alias}` });
      }
  }

  // Runtime reads from the table.
  for (const r of RUNTIME_READS) {
    const tasks = r.tasks.flatMap((pattern) =>
      pattern.startsWith("*#")
        ? real.filter((t) => t.task === pattern.slice(2)).map((t) => t.taskId)
        : [pattern],
    );
    for (const m of r.files) {
      const files = tracked.filter((f) => matches(f, m));
      if (!files.length && !r.optional) throw new Error(`RUNTIME_READS: nothing matches ${m}`);
      for (const task of tasks) for (const file of files) reads.push({ task, file, why: r.why });
    }
  }
  return { reads, skipped };
}

function check(): { dry: Dry; reads: Read[] } {
  const dry = dryRun();
  const ids = new Set(dry.tasks.map((t) => t.taskId));
  const closure = closures(dry);
  const { reads, skipped } = requiredReads(dry);
  const missing = reads.filter((r) => !ids.has(r.task) || !closure.get(r.task)!.has(r.file));
  const pairs = new Set(reads.map((r) => `${r.task} ${r.file}`));
  console.log(
    `${pairs.size} cross-package (task, file) reads checked across ${new Set(reads.map((r) => r.task)).size} tasks.`,
  );
  for (const s of skipped) console.log(`  skipped: ${s}`);
  if (missing.length) {
    console.error("\nNot in the task's Turborepo hash (a cache hit could hide a change):");
    const seen = new Set<string>();
    for (const r of missing) {
      const key = `${r.task} ${r.file}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.error(`  ${r.task} reads ${r.file} (${r.why})`);
    }
    console.error(
      "\nDeclare it in turbo.json: a workspace dependency (covered by the `transit` task), or " +
        "`$TURBO_ROOT$/...` in the task's `inputs`.",
    );
    process.exit(1);
  }
  return { dry, reads };
}

function mutate(dry: Dry, reads: Read[]): void {
  const hashes = (d: Dry) => new Map(d.tasks.map((t) => [t.taskId, t.hash]));
  const before = hashes(dry);
  // One representative file per (reason, top-level folder of the target), plus the controls.
  const byFile = new Map<string, Set<string>>();
  const picked = new Map<string, string>();
  for (const r of reads) {
    const group = `${r.why.startsWith("imported by") ? r.why.split("/").slice(0, 3).join("/") : r.why} ${r.file.split("/").slice(0, 2).join("/")}`;
    const file = picked.get(group) ?? r.file;
    picked.set(group, file);
    if (file === r.file) {
      if (!byFile.has(file)) byFile.set(file, new Set());
      byFile.get(file)!.add(r.task);
    }
  }
  const controls = new Map(NEGATIVE_CONTROLS.map((c) => [c.file, c.unchanged]));
  for (const c of NEGATIVE_CONTROLS) if (!byFile.has(c.file)) byFile.set(c.file, new Set());

  let failed = false;
  for (const [file, tasks] of byFile) {
    const abs = path.join(ROOT, file);
    const original = fs.readFileSync(abs);
    fs.writeFileSync(abs, Buffer.concat([original, Buffer.from("\n")]));
    let after: Map<string, string>;
    try {
      after = hashes(dryRun());
    } finally {
      fs.writeFileSync(abs, original);
    }
    const changed = [...after].filter(([id, h]) => before.get(id) !== h).map(([id]) => id);
    const notMissed = [...tasks].filter((t) => !changed.includes(t));
    const wronglyMissed = (controls.get(file) ?? []).filter((t) => changed.includes(t));
    const ok = !notMissed.length && !wronglyMissed.length;
    failed ||= !ok;
    console.log(
      `${ok ? "ok  " : "FAIL"} ${file}: ${changed.filter((t) => !t.endsWith("#transit")).length} tasks re-run` +
        (tasks.size ? `; required [${[...tasks].sort().join(", ")}]` : "") +
        (controls.has(file) ? `; must stay cached [${controls.get(file)!.join(", ")}]` : ""),
    );
    if (notMissed.length) console.log(`     still cached (wrong): ${notMissed.join(", ")}`);
    if (wronglyMissed.length) console.log(`     re-run (wrong): ${wronglyMissed.join(", ")}`);
  }
  if (failed) process.exit(1);
}

const { dry, reads } = check();
if (process.argv.includes("--mutate")) mutate(dry, reads);
