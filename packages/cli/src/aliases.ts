// Import aliases for the Destinations (Registry layout, #13). Pure and browser-safe (no Node
// imports), so the docs site's "Copy to LLM" can rewrite imports exactly as `add` does.
import type { Config } from "./config.ts";

/** What import rewriting needs from components.json. */
export type AliasConfig = Pick<Config, "structure" | "aliases">;

/** The aliases a fresh `create`/`init` writes to components.json (#14). */
export function defaultAliases(structure: Config["structure"]): Config["aliases"] {
  return {
    components: "@/components",
    hooks: "@/hooks",
    utils: "@/utils",
    theme: "@/theme",
    screens: "@/screens",
    ...(structure === "feature" ? { features: "@/features" } : {}),
  };
}

/** A project as `create` sets it up by default: the flat Structure and the default aliases. */
export const DEFAULT_ALIAS_CONFIG: AliasConfig = {
  structure: "flat",
  aliases: defaultAliases("flat"),
};

/** Import alias for a Destination, honouring feature mode for screens. */
export function destinationAlias(
  dest: "components" | "hooks" | "utils" | "theme" | "screens",
  config: AliasConfig,
  feature?: string,
): string {
  if (dest === "screens" && config.structure === "feature") {
    if (!feature) throw new Error("Feature mode: pass --feature <name> for Screen Blocks.");
    const features = config.aliases.features ?? "@/features";
    return `${features}/${feature}/screens`;
  }
  return config.aliases[dest];
}
