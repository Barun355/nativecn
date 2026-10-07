// Build the nativecn Registry: inline Style Slots per Style, validate items with shadcn's schema
// and the dependency rule (ADR 0007), check every Preset's contrast (WCAG AA), emit
// /r/styles/<style>/<item>.json via `shadcn build`, plus the Preset ingredient JSON.
// Usage: node scripts/registry/build.ts [--root <dir>] [--out <dir>] [--no-presets]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { RegistryItem } from "shadcn/schema";
import { registryItemSchema } from "shadcn/schema";

import { assertDependencyRule } from "./dependency-rule.ts";
import { inlineSlots, readSlotFills, type SlotFills } from "./inline-slots.ts";

const UI = path.resolve(import.meta.dirname, "../..");

/** Destination placeholders a file's target may start with (resolved per project by the CLI). */
export const DESTINATIONS = [
  "{components}",
  "{hooks}",
  "{utils}",
  "{theme}",
  "{screens}",
  "{app}",
] as const;
/** Source folders that are never copied into apps. */
const REPO_ONLY = [
  "styles",
  "presets",
  "examples",
  "scripts",
  "test",
  "node_modules",
  ".registry-build",
];

export type BuildOptions = { root?: string; out?: string; presets?: boolean; quiet?: boolean };

function findRegistryFiles(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (REPO_ONLY.includes(entry.name) || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "_registry.ts") found.push(full);
    }
  };
  walk(root);
  return found.sort();
}

export async function loadItems(root: string): Promise<RegistryItem[]> {
  const items: RegistryItem[] = [];
  for (const file of findRegistryFiles(root)) {
    const mod = await import(pathToFileURL(file).href);
    const list: unknown[] = mod.default ?? mod.items;
    if (!Array.isArray(list))
      throw new Error(`${path.relative(root, file)}: export default an array of items`);
    for (const raw of list) {
      const parsed = registryItemSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(`${path.relative(root, file)}: invalid item\n${parsed.error.message}`);
      }
      items.push(parsed.data);
    }
  }
  const names = new Set<string>();
  for (const item of items) {
    if (names.has(item.name)) throw new Error(`Duplicate Registry Item "${item.name}"`);
    names.add(item.name);
  }
  for (const item of items) {
    for (const dep of item.registryDependencies ?? []) {
      if (!names.has(dep))
        throw new Error(`"${item.name}" depends on unknown item "${dep}" (use plain item names)`);
    }
    for (const f of item.files ?? []) {
      if (!f.target || !DESTINATIONS.some((d) => f.target!.startsWith(d))) {
        throw new Error(
          `"${item.name}": file ${f.path} needs a target starting with ${DESTINATIONS.join(", ")}`,
        );
      }
      if (!fs.existsSync(path.join(root, f.path)))
        throw new Error(`"${item.name}": missing file ${f.path}`);
    }
  }
  return items;
}

export function loadStyles(root: string): Map<string, SlotFills> {
  const dir = path.join(root, "styles");
  const styles = new Map<string, SlotFills>();
  for (const file of fs.readdirSync(dir).sort()) {
    if (!/^[a-z]+\.ts$/.test(file) || ["define.ts", "index.ts"].includes(file)) continue;
    styles.set(
      file.replace(/\.ts$/, ""),
      readSlotFills(fs.readFileSync(path.join(dir, file), "utf8"), file),
    );
  }
  if (styles.size === 0) throw new Error("No Styles found in styles/");
  const [first, ...rest] = [...styles.entries()];
  for (const [name, fills] of rest) {
    const a = [...first![1].keys()].sort().join(",");
    const b = [...fills.keys()].sort().join(",");
    if (a !== b) throw new Error(`Style "${name}" does not fill the same Slots as "${first![0]}"`);
  }
  return styles;
}

function buildStyle(
  root: string,
  out: string,
  style: string,
  fills: SlotFills,
  items: RegistryItem[],
): void {
  const tmp = path.join(root, ".registry-build", style);
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const item of items) {
    for (const f of item.files ?? []) {
      let source = fs.readFileSync(path.join(root, f.path), "utf8");
      if (/\.(t|j)sx?$/.test(f.path)) source = inlineSlots(source, fills, `${style}:${f.path}`);
      const dest = path.join(tmp, f.path);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, source);
    }
  }
  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "nativecn",
    homepage: "https://nativecn.dev",
    items,
  };
  fs.writeFileSync(path.join(tmp, "registry.json"), JSON.stringify(registry, null, 2));
  const outDir = path.join(out, "styles", style);
  fs.rmSync(outDir, { recursive: true, force: true });
  const bin = path.join(
    UI,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "shadcn.cmd" : "shadcn",
  );
  execFileSync(bin, ["build", path.join(tmp, "registry.json"), "--output", outDir, "--cwd", tmp], {
    stdio: "pipe",
  });
}

async function buildPresets(out: string): Promise<void> {
  const options = await import("preset");
  const { BASE_COLOR_VALUES, ACCENT_COLOR_VALUES, SHARED_COLOR_VALUES, contrastFailures } =
    await import(pathToFileURL(path.join(UI, "presets", "index.ts")).href);
  const failures: string[] = contrastFailures();
  if (failures.length)
    throw new Error(
      [
        "Contrast check failed: these Foreground pairs are below WCAG AA (4.5:1):",
        ...failures.map((f) => `  - ${f}`),
      ].join("\n"),
    );
  const { FONTS } = await import(pathToFileURL(path.join(UI, "presets", "fonts.ts")).href);
  const { RADIUS_BASE } = await import(pathToFileURL(path.join(UI, "presets", "radius.ts")).href);
  const dir = path.join(out, "presets");
  fs.rmSync(dir, { recursive: true, force: true });
  const write = (rel: string, data: unknown) => {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  };
  write("index.json", {
    style: options.STYLES,
    baseColor: options.BASE_COLORS,
    accentColor: options.ACCENT_COLORS,
    radius: options.RADII,
    radiusBase: RADIUS_BASE,
    bodyFont: options.FONTS,
    headingFont: options.HEADING_FONTS,
    shared: SHARED_COLOR_VALUES,
  });
  for (const [name, value] of Object.entries(BASE_COLOR_VALUES))
    write(`base/${name}.json`, { name, ...(value as object) });
  for (const [name, value] of Object.entries(ACCENT_COLOR_VALUES))
    write(`accent/${name}.json`, { name, ...(value as object) });
  for (const [id, font] of Object.entries(FONTS))
    write(`fonts/${id}.json`, { id, ...(font as object) });
}

export async function build(
  opts: BuildOptions = {},
): Promise<{ styles: string[]; items: string[] }> {
  const root = path.resolve(opts.root ?? UI);
  const out = path.resolve(opts.out ?? path.join(UI, "..", "..", "apps", "web", "public", "r"));
  const items = await loadItems(root);
  assertDependencyRule(items);
  const styles = loadStyles(root);
  for (const [style, fills] of styles) buildStyle(root, out, style, fills, items);
  if (opts.presets !== false) await buildPresets(out);
  fs.rmSync(path.join(root, ".registry-build"), { recursive: true, force: true });
  if (!opts.quiet)
    console.log(
      `Built ${items.length} items × ${styles.size} Styles into ${path.relative(process.cwd(), out)}`,
    );
  return { styles: [...styles.keys()], items: items.map((i) => i.name) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const get = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  build({ root: get("--root"), out: get("--out"), presets: !args.includes("--no-presets") }).catch(
    (err: Error) => {
      console.error(err.message);
      process.exit(1);
    },
  );
}
