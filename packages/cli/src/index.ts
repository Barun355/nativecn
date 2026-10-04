#!/usr/bin/env node
import { Command } from "commander";

export { configSchema, readConfig, writeConfig, type Config } from "./config.ts";
export { resolveTarget, destinationAlias, DESTINATIONS } from "./destinations.ts";
export { rewriteImports } from "./imports.ts";
export { aliasToDir, readTsconfigPaths } from "./paths.ts";
export { fetchItem, fetchIndex, registryBase, type RegistryItem } from "./registry.ts";
export { resolveTree, collectDependencies } from "./resolve.ts";

export const program = new Command()
  .name("nativecn-cli")
  .description("Add nativecn components to Expo apps")
  .version("0.0.0");

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("nativecn-cli")) {
  program.parse();
}
