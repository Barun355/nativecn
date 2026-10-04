import type { RegistryItem } from "./registry.ts";

/**
 * Resolve requested items plus all registryDependencies, de-duplicated, dependencies first.
 * Throws on a dependency cycle.
 */
export async function resolveTree(
  names: string[],
  fetch: (name: string) => Promise<RegistryItem>,
): Promise<RegistryItem[]> {
  const items = new Map<string, RegistryItem>();
  const ordered: RegistryItem[] = [];
  const visiting = new Set<string>();

  const visit = async (name: string, trail: string[]): Promise<void> => {
    if (items.has(name)) return;
    if (visiting.has(name)) throw new Error(`Dependency cycle: ${[...trail, name].join(" → ")}`);
    visiting.add(name);
    const item = await fetch(name);
    for (const dep of item.registryDependencies ?? []) await visit(dep, [...trail, name]);
    visiting.delete(name);
    items.set(name, item);
    ordered.push(item);
  };

  for (const name of names) await visit(name, []);
  return ordered;
}

/** npm dependencies across items, de-duplicated (last spec wins for the same package). */
export function collectDependencies(items: RegistryItem[]): string[] {
  const byName = new Map<string, string>();
  for (const item of items) {
    for (const spec of item.dependencies ?? []) {
      const at = spec.lastIndexOf("@");
      const name = at > 0 ? spec.slice(0, at) : spec;
      byName.set(name, spec);
    }
  }
  return [...byName.values()].sort();
}
