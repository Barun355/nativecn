#!/usr/bin/env node
import { Command } from "commander";

import { add } from "./commands/add.ts";

export { configSchema, readConfig, writeConfig, type Config } from "./config.ts";
export { resolveTarget, destinationAlias, DESTINATIONS } from "./destinations.ts";
export { rewriteImports } from "./imports.ts";
export { aliasToDir, readTsconfigPaths } from "./paths.ts";
export { fetchItem, fetchIndex, registryBase, type RegistryItem } from "./registry.ts";
export { resolveTree, collectDependencies } from "./resolve.ts";
export { add, type AddOptions, type AddResult } from "./commands/add.ts";

export const program = new Command()
  .name("nativecn-cli")
  .description("Add nativecn components to Expo apps")
  .version("0.0.0");

program
  .command("add")
  .description("add Components, Primitives and Blocks to your app")
  .argument("[items...]", "item names, e.g. button sign-in-01")
  .option("-y, --yes", "skip prompts (never overwrites your edits)", false)
  .option("-o, --overwrite", "overwrite files you have edited", false)
  .option("-c, --cwd <cwd>", "the project folder", process.cwd())
  .option("-a, --all", "add every item", false)
  .option("-p, --path <path>", "put Components in this folder for this run")
  .option("-s, --silent", "no output", false)
  .option("--dry-run", "show what would change without writing", false)
  .option("--diff [path]", "show how your files differ from nativecn's")
  .option("--view [path]", "print nativecn's version of the files")
  .option("--feature <name>", "Feature for Screen Blocks (feature mode)")
  .option("--route <path>", "create a route for a Screen Block, e.g. (auth)/sign-in")
  .action(async (items: string[], opts) => {
    try {
      await add(items, { ...opts, yes: opts.yes || !process.stdin.isTTY });
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("nativecn-cli")) {
  program.parse();
}
