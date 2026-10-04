import fs from "node:fs";
import path from "node:path";

import { parse } from "jsonc-parser";

type Paths = Record<string, string[]>;

/** Read compilerOptions.paths from the project's tsconfig.json (comments allowed). */
export function readTsconfigPaths(cwd: string): Paths {
  const file = path.join(cwd, "tsconfig.json");
  if (!fs.existsSync(file)) return {};
  const json = parse(fs.readFileSync(file, "utf8")) as
    { compilerOptions?: { paths?: Paths } } | undefined;
  return json?.compilerOptions?.paths ?? {};
}

/**
 * Resolve an import alias (e.g. "@/components") to a folder relative to the project root,
 * using tsconfig paths (e.g. "@/*" → "./src/*"). Falls back to treating "@/" as "src/" when a
 * src folder exists, else the project root.
 */
export function aliasToDir(alias: string, cwd: string, paths = readTsconfigPaths(cwd)): string {
  const candidates = Object.entries(paths)
    .filter(([pattern]) => pattern.endsWith("/*") && alias.startsWith(pattern.slice(0, -1)))
    .sort(([a], [b]) => b.length - a.length);
  const match = candidates[0];
  if (match) {
    const [pattern, [target = ""]] = match;
    const rest = alias.slice(pattern.length - 1);
    return path
      .normalize(path.join(target.replace(/\*$/, ""), rest))
      .replace(/\\/g, "/")
      .replace(/\/$/, "");
  }
  const exact = paths[alias]?.[0];
  if (exact) return path.normalize(exact).replace(/\\/g, "/");
  if (alias.startsWith("@/")) {
    const base = fs.existsSync(path.join(cwd, "src")) ? "src/" : "";
    return `${base}${alias.slice(2)}`;
  }
  throw new Error(
    `Cannot resolve alias "${alias}"; add it to tsconfig.json compilerOptions.paths.`,
  );
}
