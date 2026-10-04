// The exact `nativecn-cli add` commands for a set of items in this project (decision #17, Rule 9).
import type { Config } from "../config.ts";
import type { RegistryIndexItem } from "../registry.ts";
import { isScreenBlock } from "./catalog.ts";

export const ADD = "npx nativecn-cli@latest add";

export type AddCommand = { command: string; items: string[]; feature?: string; route?: string };
export type AddCommandPlan = { commands: AddCommand[]; notes: string[] };

export class AddCommandError extends Error {}

const FEATURE = /^[a-z0-9][a-z0-9-]*$/;

/** "(auth)/sign-in", with any leading "/", routes folder or ".tsx" removed. */
export function normalizeRoute(route: string, routesDir?: string): string {
  let r = route.trim().replace(/\\/g, "/");
  if (routesDir && r.startsWith(`${routesDir}/`)) r = r.slice(routesDir.length + 1);
  r = r.replace(/^\.?\/+/, "").replace(/\.tsx?$/, "");
  if (!r || r.split("/").some((part) => part === ".." || part === ""))
    throw new AddCommandError(`"${route}" is not a route path (e.g. "(auth)/sign-in").`);
  if (/["`$\\]/.test(r)) throw new AddCommandError(`"${route}" contains characters a route can't.`);
  return r;
}

/**
 * Plan the commands. Components, Primitives and Drawer Blocks share one command; each Screen
 * Block gets its own, with its route and (in feature mode) its Feature.
 *
 * `config` is null when there is no project (the remote MCP, or before `init`): the commands
 * then assume Structure `flat` and say so.
 */
export function planAddCommands(
  items: RegistryIndexItem[],
  config: Config | null,
  opts: { route?: string; feature?: string; hasProject: boolean },
): AddCommandPlan {
  const notes: string[] = [];
  const structure = config?.structure ?? "flat";
  if (opts.feature !== undefined && !FEATURE.test(opts.feature))
    throw new AddCommandError(`"${opts.feature}" is not a Feature name (lowercase, a-z 0-9 -).`);

  const screens = items.filter(isScreenBlock);
  const others = items.filter((i) => !isScreenBlock(i));
  if (opts.route !== undefined && screens.length !== 1)
    throw new AddCommandError(
      screens.length === 0
        ? "`route` only applies to Screen Blocks, and none of these items is one."
        : "`route` applies to one Screen Block; ask for each Screen Block separately.",
    );
  if (opts.feature !== undefined && screens.length === 0)
    notes.push("`feature` only applies to Screen Blocks; Components always install globally.");
  if (opts.feature !== undefined && structure === "flat" && screens.length > 0)
    notes.push("This project's Structure is flat, so `--feature` is not used.");

  const commands: AddCommand[] = [];
  if (others.length) {
    const names = others.map((i) => i.name);
    commands.push({ command: `${ADD} ${names.join(" ")}`, items: names });
  }
  for (const block of screens) {
    const parts = [ADD, block.name];
    const entry: AddCommand = { command: "", items: [block.name] };
    if (structure === "feature") {
      const feature = opts.feature ?? block.categories?.[0];
      if (!feature)
        throw new AddCommandError(
          `${block.name} is a Screen Block and this project uses feature mode: pass \`feature\` (the Feature it belongs to).`,
        );
      if (!opts.feature)
        notes.push(
          `${block.name}: Feature "${feature}" is the Block's default (its category). Pass \`feature\` to choose another.`,
        );
      parts.push("--feature", feature);
      entry.feature = feature;
    }
    const suggested = block.meta?.route;
    const route =
      opts.route ?? (typeof suggested === "string" && suggested ? suggested : undefined);
    if (route) {
      const r = normalizeRoute(route, config?.routes);
      parts.push("--route", `"${r}"`);
      entry.route = r;
      if (!opts.route)
        notes.push(
          `${block.name}: route "${r}" is the Block's suggestion. Pass \`route\` to use another.`,
        );
    } else {
      notes.push(
        `${block.name} suggests no route: ask the user where the Screen goes and pass \`route\`.`,
      );
    }
    entry.command = parts.join(" ");
    commands.push(entry);
  }

  if (!opts.hasProject)
    notes.push(
      "No project config: these commands assume Structure `flat`. In a feature-mode project, Screen Blocks also need `--feature <name>`.",
    );
  else if (!config)
    notes.push("No components.json here yet: run `npx nativecn-cli@latest init` first.");
  if (screens.length) notes.push("An existing route file is never overwritten by `add`.");
  return { commands, notes };
}
