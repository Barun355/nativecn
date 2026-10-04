// Server-only access to the built Registry (public/r, written by `pnpm --filter ui build` before
// `next build`). The item pages read each Style's built JSON, so the code shown is exactly what
// `add` installs. Without a build (a docs-only dev server) the pages fall back to the item
// definitions in packages/ui, with no file contents, rather than failing.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { itemDoc, type ItemDoc } from "@/lib/item-doc";
import { exampleNames } from "@/lib/llm-bundle";
import { sourceItems } from "@/lib/registry-source";

import type {
  RegistryIndex,
  RegistryIndexItem,
  RegistryItem,
} from "../../../packages/cli/src/registry.ts";

/** The default Style: the one the llms files, the remote MCP and Copy to LLM default to. */
export const DEFAULT_STYLE = "vega";

const R = () => path.join(process.cwd(), "public/r");

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return undefined;
  }
}

/** The built Styles, default first (from the Preset index, else the styles folder). */
export async function registryStyles(): Promise<string[]> {
  const presets = await readJson<{ style?: string[] }>(path.join(R(), "presets/index.json"));
  let styles = presets?.style ?? [];
  if (!styles.length) {
    try {
      styles = (await readdir(path.join(R(), "styles"), { withFileTypes: true }))
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      styles = [];
    }
  }
  return [DEFAULT_STYLE, ...styles.filter((s) => s !== DEFAULT_STYLE)];
}

const stripContent = (item: RegistryItem): RegistryIndexItem => ({
  ...item,
  files: item.files?.map(({ path: p, type, target }) => ({ path: p, type, target })),
});

/** A Style's index: the built registry.json, else the item definitions. */
export async function loadIndex(style = DEFAULT_STYLE): Promise<RegistryIndexItem[]> {
  const index = await readJson<RegistryIndex>(path.join(R(), "styles", style, "registry.json"));
  return index?.items ?? sourceItems.map(stripContent);
}

/** One item with its file contents, else its definition (no contents). */
export async function loadItem(
  name: string,
  style = DEFAULT_STYLE,
): Promise<RegistryItem | undefined> {
  if (!/^[a-z0-9-]+$/.test(name) || !/^[a-z0-9-]+$/.test(style)) return undefined;
  const built = await readJson<RegistryItem>(path.join(R(), "styles", style, `${name}.json`));
  return built ?? sourceItems.find((i) => i.name === name);
}

/** The page model for an item in one Style. */
export async function loadItemDoc(
  name: string,
  style = DEFAULT_STYLE,
): Promise<ItemDoc | undefined> {
  const [item, index] = await Promise.all([loadItem(name, style), loadIndex(style)]);
  if (!item) return undefined;
  const examples = (
    await Promise.all(exampleNames(index, name).map((n) => loadItem(n, style)))
  ).filter((e): e is RegistryItem => e !== undefined);
  return itemDoc({ item, index, examples, style });
}

/** Whether the built Registry is present (its absence is shown on the page). */
export async function hasBuiltRegistry(): Promise<boolean> {
  return (await readJson(path.join(R(), "styles", DEFAULT_STYLE, "registry.json"))) !== undefined;
}
