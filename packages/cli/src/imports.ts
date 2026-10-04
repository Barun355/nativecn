// Pure and browser-safe: `add`, the MCP server and the docs site (pages, `.md` twins, llms files,
// Copy for AI, Copy to LLM) all show Registry code through these functions.
import { DEFAULT_ALIAS_CONFIG, destinationAlias, type AliasConfig } from "./aliases.ts";

type Importable = "components" | "hooks" | "utils" | "theme" | "screens";

/** Rewrite registry-internal imports (`@/registry/<destination>/…`) to the project's aliases. */
export function rewriteImports(source: string, config: AliasConfig, feature?: string): string {
  return source.replace(
    /(["'])@\/registry\/(components|hooks|utils|theme|screens)(\/[^"']*)?\1/g,
    (_m, quote: string, dest: Importable, rest = "") =>
      `${quote}${destinationAlias(dest, config, dest === "screens" ? feature : undefined)}${rest}${quote}`,
  );
}

type ItemFiles = { files?: { target: string; content?: string }[]; categories?: string[] };

/**
 * The Feature `add` installs an item's files under: for a Screen Block (files targeting
 * `{screens}`), `--feature`, else the Block's first category (e.g. "auth"); none for other items.
 * Only feature mode uses it; in the flat Structure `{screens}` is the same for every Feature.
 */
export function screenBlockFeature(item: ItemFiles, feature?: string): string | undefined {
  const screenBlock = (item.files ?? []).some((f) => f.target.startsWith("{screens}"));
  return screenBlock ? (feature ?? item.categories?.[0]) : undefined;
}

/**
 * An item with its file contents' imports as `add` writes them. Without a config this is a
 * project as a fresh `create` sets it up (flat Structure, default aliases): what the docs show.
 */
export function rewriteItemImports<T extends ItemFiles>(
  item: T,
  config: AliasConfig = DEFAULT_ALIAS_CONFIG,
  feature?: string,
): T {
  if (!item.files) return item;
  const f = screenBlockFeature(item, feature);
  return {
    ...item,
    files: item.files.map((file) =>
      file.content === undefined
        ? file
        : { ...file, content: rewriteImports(file.content, config, f) },
    ),
  };
}
