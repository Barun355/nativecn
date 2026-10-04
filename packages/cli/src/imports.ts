import type { Config } from "./config.ts";
import { destinationAlias, type Destination } from "./destinations.ts";

type Importable = Exclude<Destination, "app">;

/** Rewrite registry-internal imports (`@/registry/<destination>/…`) to the project's aliases. */
export function rewriteImports(source: string, config: Config, feature?: string): string {
  return source.replace(
    /(["'])@\/registry\/(components|hooks|utils|theme|screens)(\/[^"']*)?\1/g,
    (_m, quote: string, dest: Importable, rest = "") =>
      `${quote}${destinationAlias(dest, config, dest === "screens" ? feature : undefined)}${rest}${quote}`,
  );
}
