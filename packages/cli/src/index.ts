#!/usr/bin/env node
import { Command } from "commander";

import { add } from "./commands/add.ts";
import { runStdio } from "./mcp/index.ts";
import { init, type InitOptions } from "./commands/init.ts";
import { cliVersion } from "./utils/starter.ts";

export { configSchema, readConfig, writeConfig, type Config } from "./config.ts";
export { resolveTarget, destinationAlias, DESTINATIONS } from "./destinations.ts";
export { rewriteImports } from "./imports.ts";
export { aliasToDir, readTsconfigPaths } from "./paths.ts";
export { fetchItem, fetchIndex, registryBase, type RegistryItem } from "./registry.ts";
export { resolveTree, collectDependencies } from "./resolve.ts";
export { add, type AddOptions, type AddResult } from "./commands/add.ts";
export { createServer, runStdio, type CreateServerOptions } from "./mcp/index.ts";
export { init, type InitOptions, type InitResult } from "./commands/init.ts";
export { checkExpoApp } from "./utils/expo.ts";

export const program = new Command()
  .name("nativecn-cli")
  .description("Add nativecn components to Expo apps")
  .version(cliVersion());

/** Options shared by `init` and `create` (#16): shadcn's flags plus nativecn's Preset flags. */
function initOptions(cmd: Command): Command {
  return cmd
    .option("-p, --preset <code>", "a Preset code from nativecn.dev/create")
    .option("-n, --name <name>", "create a new app with this name")
    .option("-y, --yes", "skip prompts: use flags, else the defaults", false)
    .option("-d, --defaults", "use the default Preset (Vega · neutral · neutral · Inter)", false)
    .option("-f, --force", "write components.json even if it exists", false)
    .option("-c, --cwd <cwd>", "the working folder", process.cwd())
    .option("-s, --silent", "no output", false)
    .option("--style <style>", "vega | nova")
    .option("--base <colour>", "Base colour, e.g. neutral, stone, zinc")
    .option("--accent <colour>", "Accent colour, e.g. blue, violet")
    .option("--radius <radius>", "default | none | small | medium | large")
    .option("--font <font>", "Body font, e.g. inter, geist, lora")
    .option("--heading-font <font>", "Heading font, or 'same' as the body")
    .option("--folder-feat", "feature folder structure (src/features/<feature>)", false)
    .option("--agents <list>", "claude,codex,cursor,antigravity or none");
}

async function runInit(items: string[], opts: InitOptions): Promise<void> {
  try {
    await init(items, { ...opts, yes: opts.yes || !process.stdin.isTTY });
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

initOptions(
  program
    .command("init")
    .description("set up nativecn in an Expo app (creates one in an empty folder)")
    .argument("[items...]", "items to add right away"),
).action((items: string[], opts: InitOptions) => runInit(items, opts));

initOptions(
  program
    .command("create")
    .description("create a new Expo app with nativecn (init for a new app)")
    .argument("[name]", "the app's folder name")
    .argument("[items...]", "items to add right away"),
).action((name: string | undefined, items: string[], opts: InitOptions) => {
  // With --name, the first positional is an item, not the name.
  const all = opts.name ? [name, ...items].filter((x): x is string => Boolean(x)) : items;
  return runInit(all, { ...opts, mode: "create", name: opts.name ?? name });
});

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

program
  .command("mcp")
  .description("run the read-only nativecn MCP server over stdio")
  .option("-c, --cwd <cwd>", "the project folder", process.cwd())
  .action(async (opts: { cwd: string }) => {
    try {
      await runStdio({ cwd: opts.cwd });
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("nativecn-cli")) {
  program.parse();
}
