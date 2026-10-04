import path from "node:path";

import { destinationAlias } from "./aliases.ts";
import type { Config } from "./config.ts";
import { aliasToDir } from "./paths.ts";

export { destinationAlias };

export const DESTINATIONS = ["components", "hooks", "utils", "theme", "screens", "app"] as const;
export type Destination = (typeof DESTINATIONS)[number];

export type ResolveOptions = { cwd: string; feature?: string };

/** Resolve a Registry file target like "{components}/button.tsx" to a path relative to the project root. */
export function resolveTarget(target: string, config: Config, opts: ResolveOptions): string {
  const match = /^\{(\w+)\}\/?(.*)$/.exec(target);
  if (!match) throw new Error(`Target "${target}" must start with a Destination placeholder.`);
  const [, name = "", rest = ""] = match;
  if (!(DESTINATIONS as readonly string[]).includes(name))
    throw new Error(`Unknown Destination "{${name}}".`);
  const dest = name as Destination;
  const base =
    dest === "app"
      ? config.routes
      : aliasToDir(destinationAlias(dest, config, opts.feature), opts.cwd);
  return path.posix.join(base, rest);
}
