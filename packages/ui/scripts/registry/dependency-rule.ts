// The dependency rule (global ADR 0007): a Registry Item may depend only on packages in the Expo
// SDK's pinned native-module list (`expo/bundledNativeModules.json`), or on a package with a
// recorded exception. The Registry build and the Starter smoke test (on the latest SDK) run it.
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import type { RegistryItem } from "shadcn/schema";

const REPO = path.resolve(import.meta.dirname, "../../../..");

/**
 * The recorded exceptions listed in ADR 0007, each with the decision that records it (a path from
 * the repo root). Adding a package here needs its own ADR first: this list mirrors ADR 0007.
 */
export const RECORDED_EXCEPTIONS: Record<string, { decision: string; reason: string }> = {
  zustand: {
    decision: "packages/ui/docs/adr/0001-theme-persistence-zustand-asyncstorage.md",
    reason: "Theme Scheme persistence and the Toast queue",
  },
  "react-hook-form": {
    decision: "packages/ui/docs/adr/0002-react-hook-form-and-zod.md",
    reason: "form logic in Blocks",
  },
  zod: {
    decision: "packages/ui/docs/adr/0002-react-hook-form-and-zod.md",
    reason: "form logic in Blocks",
  },
  "lucide-react-native": {
    decision: "docs/adr/0007-dependency-rule.md",
    reason: "the Lucide decision (#9), recorded in ADR 0007",
  },
};

/** The package name of a dependency spec: `zustand@^5` → `zustand`, `@scope/pkg@1` → `@scope/pkg`. */
export function packageName(spec: string): string {
  const at = spec.indexOf("@", spec.startsWith("@") ? 1 : 0);
  return at > 0 ? spec.slice(0, at) : spec;
}

/** The pinned native-module list of the `expo` package resolvable from `from` (a folder). */
export function loadPinnedModules(from = path.resolve(import.meta.dirname, "../..")): {
  sdk: string;
  modules: Record<string, string>;
} {
  const require = createRequire(path.join(from, "package.json"));
  const modules = require("expo/bundledNativeModules.json") as Record<string, string>;
  const { version } = require("expo/package.json") as { version: string };
  return { sdk: version, modules };
}

/**
 * Every dependency (and devDependency) of every item that is neither SDK-pinned nor a recorded
 * exception, as human-readable messages. Empty means the rule holds.
 */
export function dependencyRuleViolations(
  items: Pick<RegistryItem, "name" | "dependencies" | "devDependencies">[],
  pinned: Record<string, string>,
  exceptions: Record<string, unknown> = RECORDED_EXCEPTIONS,
): string[] {
  const violations: string[] = [];
  for (const item of items) {
    for (const spec of [...(item.dependencies ?? []), ...(item.devDependencies ?? [])]) {
      const name = packageName(spec);
      if (name in pinned || name in exceptions) continue;
      violations.push(
        `"${item.name}" depends on "${name}", which is not in the Expo SDK's pinned list and has no recorded exception (ADR 0007)`,
      );
    }
  }
  return violations;
}

/** Throw when any item breaks the dependency rule. */
export function assertDependencyRule(
  items: Pick<RegistryItem, "name" | "dependencies" | "devDependencies">[],
  pinned = loadPinnedModules(),
): void {
  const violations = dependencyRuleViolations(items, pinned.modules);
  if (violations.length) {
    throw new Error(
      [
        `Dependency rule (ADR 0007) failed against Expo ${pinned.sdk}:`,
        ...violations.map((v) => `  - ${v}`),
        "Use an SDK-pinned package, or record an exception in its own ADR and add it to RECORDED_EXCEPTIONS.",
      ].join("\n"),
    );
  }
}

/** Every recorded exception points at a decision file that exists (checked by the tests). */
export function missingExceptionDecisions(
  exceptions: Record<string, { decision: string }> = RECORDED_EXCEPTIONS,
): string[] {
  return Object.entries(exceptions)
    .filter(([, { decision }]) => !fs.existsSync(path.join(REPO, decision)))
    .map(([name, { decision }]) => `${name}: ${decision}`);
}
