import fs from "node:fs";
import path from "node:path";

import * as p from "@clack/prompts";
import { createTwoFilesPatch } from "diff";
import type { Preset } from "preset";

import { readConfig, type Config } from "../config.ts";
import { destinationAlias, resolveTarget } from "../destinations.ts";
import { rewriteImports, screenBlockFeature } from "../imports.ts";
import { aliasToDir } from "../paths.ts";
import { fetchIndex, fetchItem, type RegistryItem } from "../registry.ts";
import { collectDependencies, resolveTree } from "../resolve.ts";
import { addConfigPlugins } from "../utils/app-config.ts";
import { detectPackageManager, installPlan, runInstall } from "../utils/pm.ts";
import { composePresetThemeFile } from "../utils/preset-theme.ts";

export type AddOptions = {
  cwd: string;
  yes?: boolean;
  overwrite?: boolean;
  all?: boolean;
  path?: string;
  silent?: boolean;
  dryRun?: boolean;
  diff?: string | boolean;
  view?: string | boolean;
  feature?: string;
  route?: string;
};

type FileStatus = "new" | "identical" | "different";
export type PlannedFile = { item: string; target: string; content: string; status: FileStatus };
type RouteMeta = { route?: string; component?: string };

export type AddResult = {
  files: PlannedFile[];
  written: string[];
  skipped: string[];
  dependencies: string[];
  routes: { path: string; created: boolean; snippet?: string }[];
  plugins: { added: string[]; manual: string[] };
  rebuild: boolean;
};

export class AddError extends Error {}

const interactive = (opts: AddOptions) => !opts.yes && Boolean(process.stdin.isTTY) && !opts.silent;

function isScreenBlock(item: RegistryItem): boolean {
  return (item.files ?? []).some((f) => f.target.startsWith("{screens}"));
}

export async function add(names: string[], opts: AddOptions): Promise<AddResult> {
  const log = (msg: string) => !opts.silent && p.log.message(msg);
  const config = readConfig(opts.cwd);
  if (!config)
    throw new AddError("No components.json found. Run `npx nativecn-cli@latest init` first.");
  const style = config.preset.style;

  if (opts.all) names = (await fetchIndex(style)).items.map((i) => i.name);
  if (names.length === 0)
    throw new AddError("Name at least one item, e.g. `nativecn-cli add button`.");

  const tree = await resolveTree(names, (n) => fetchItem(n, style));
  const files = await plan(tree, config, opts);

  if (opts.view !== undefined && opts.view !== false) {
    for (const f of filterByPath(files, opts.view))
      process.stdout.write(`// ${f.target}\n${f.content}\n`);
    return result(files);
  }
  if (opts.diff !== undefined && opts.diff !== false) {
    for (const f of filterByPath(files, opts.diff)) {
      if (f.status !== "different") continue;
      const local = fs.readFileSync(path.join(opts.cwd, f.target), "utf8");
      process.stdout.write(
        createTwoFilesPatch(`${f.target} (yours)`, `${f.target} (nativecn)`, local, f.content),
      );
    }
    return result(files);
  }

  const dependencies = collectDependencies(tree);
  log(
    [
      `Items: ${tree.map((i) => i.name).join(", ")}`,
      ...files.map(
        (f) => `  ${f.status === "new" ? "+" : f.status === "identical" ? "=" : "~"} ${f.target}`,
      ),
      dependencies.length ? `Packages: ${dependencies.join(", ")}` : "Packages: none",
    ].join("\n"),
  );
  if (opts.dryRun) return result(files, { dependencies });

  const written: string[] = [];
  const skipped: string[] = [];
  for (const f of files) {
    if (f.status === "identical") continue;
    if (f.status === "different" && !opts.overwrite) {
      const ok = interactive(opts)
        ? await p.confirm({
            message: `${f.target} has your edits. Overwrite it?`,
            initialValue: false,
          })
        : false;
      if (ok !== true) {
        skipped.push(f.target);
        continue;
      }
    }
    const dest = path.join(opts.cwd, f.target);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, f.content);
    written.push(f.target);
  }

  const routes = await createRoutes(tree, config, opts);
  const pluginNames = tree.flatMap((i) => (i.meta?.configPlugins as string[] | undefined) ?? []);
  const plugins = addConfigPlugins(opts.cwd, [...new Set(pluginNames)]);
  runInstall(installPlan(dependencies, detectPackageManager(opts.cwd)), opts.cwd);

  const rebuild = plugins.added.length > 0 || plugins.manual.length > 0;
  if (skipped.length)
    log(`Kept your edits in: ${skipped.join(", ")} (use --diff to compare, -o to overwrite).`);
  if (plugins.manual.length)
    log(`Add to the plugins in your app config: ${plugins.manual.map((x) => `"${x}"`).join(", ")}`);
  for (const r of routes)
    if (!r.created && r.snippet)
      log(`Route ${r.path} already exists. To use the Block, add:\n${r.snippet}`);
  if (rebuild) log("A Config Plugin changed: rebuild the native app (a reload is not enough).");
  return { files, written, skipped, dependencies, routes, plugins, rebuild };
}

async function plan(
  tree: RegistryItem[],
  config: Config,
  opts: AddOptions,
): Promise<PlannedFile[]> {
  const out: PlannedFile[] = [];
  for (const item of tree) {
    const feature = screenBlockFeature(item, opts.feature);
    if (
      isScreenBlock(item) &&
      config.structure === "feature" &&
      !opts.silent &&
      !opts.feature &&
      feature
    ) {
      p.log.info(`${item.name} → feature "${feature}" (pass --feature to choose another)`);
    }
    for (const file of item.files ?? []) {
      let target = resolveTarget(file.target, config, { cwd: opts.cwd, feature });
      if (opts.path && file.target.startsWith("{components}")) {
        target = path.posix.join(opts.path, file.target.slice("{components}/".length));
      }
      let content = rewriteImports(file.content, config, feature);
      // The Preset owns colors.ts and parts of tokens.ts (#16): compare against, and write, what
      // create/init compose for this project's Preset, never the Registry's default (#114).
      if (item.name === "theme")
        content = await composePresetThemeFile(file.target, content, config.preset as Preset);
      const abs = path.join(opts.cwd, target);
      const status: FileStatus = !fs.existsSync(abs)
        ? "new"
        : fs.readFileSync(abs, "utf8") === content
          ? "identical"
          : "different";
      out.push({ item: item.name, target, content, status });
    }
  }
  return out;
}

async function createRoutes(tree: RegistryItem[], config: Config, opts: AddOptions) {
  const routes: AddResult["routes"] = [];
  for (const item of tree.filter(isScreenBlock)) {
    const meta = (item.meta ?? {}) as RouteMeta;
    let route = opts.route ?? meta.route;
    if (!opts.route && interactive(opts)) {
      const answer = await p.text({
        message: `Route for ${item.name}? (empty to skip)`,
        initialValue: meta.route ?? "",
      });
      route = typeof answer === "string" && answer.trim() ? answer.trim() : undefined;
    }
    if (!route) continue;
    const feature = screenBlockFeature(item, opts.feature);
    const screens = destinationAlias("screens", config, feature);
    const component = meta.component ?? pascal(item.name);
    const snippet = `import { ${component} } from "${screens}/${item.name}";\n\nexport default function Screen() {\n  return <${component} />;\n}\n`;
    const file = path.posix.join(config.routes, `${route}.tsx`);
    const abs = path.join(opts.cwd, file);
    if (fs.existsSync(abs)) {
      routes.push({ path: file, created: false, snippet });
      continue;
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, snippet);
    routes.push({ path: file, created: true });
  }
  return routes;
}

const pascal = (name: string) => name.replace(/(^|-)(\w)/g, (_m, _d, c: string) => c.toUpperCase());

function filterByPath(files: PlannedFile[], filter: string | boolean): PlannedFile[] {
  return typeof filter === "string" ? files.filter((f) => f.target.includes(filter)) : files;
}

function result(files: PlannedFile[], extra: Partial<AddResult> = {}): AddResult {
  return {
    files,
    written: [],
    skipped: [],
    dependencies: [],
    routes: [],
    plugins: { added: [], manual: [] },
    rebuild: false,
    ...extra,
  };
}

/** Folder a Destination maps to in this project (used by tests and other commands). */
export function destinationDir(
  config: Config,
  dest: "components" | "screens",
  cwd: string,
  feature?: string,
) {
  return aliasToDir(destinationAlias(dest, config, feature), cwd);
}
