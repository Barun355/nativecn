// What the Showcase shows, derived from the generated Registry index (no React Native imports, so
// the node tests can check that every Registry Item is reachable). A new item in packages/ui
// appears here once `generate:index` has run.
import type { RegistryIndexEntry } from "./registry-index.ts";

export type RegistryIndex = Record<string, RegistryIndexEntry>;
export type CatalogItem = RegistryIndexEntry & { name: string };

/** The Components tab's groups, in order (decision #29). */
export const COMPONENT_GROUPS = [
  { id: "core", title: "Core" },
  { id: "forms", title: "Forms" },
  { id: "display", title: "Display" },
  { id: "feedback", title: "Feedback" },
  { id: "navigation", title: "Navigation" },
] as const;

export type GroupId = (typeof COMPONENT_GROUPS)[number]["id"];

/** Categories that are not one of the groups, and the group they are shown in. */
const GROUP_OF_CATEGORY: Record<string, GroupId> = { utility: "core" };

export function groupOf(item: Pick<RegistryIndexEntry, "category">): GroupId {
  const id = GROUP_OF_CATEGORY[item.category] ?? item.category;
  return COMPONENT_GROUPS.some((g) => g.id === id) ? (id as GroupId) : "core";
}

const items = (index: RegistryIndex): CatalogItem[] =>
  Object.entries(index).map(([name, entry]) => ({ name, ...entry }));

export const isComponent = (item: RegistryIndexEntry) => item.kind === "Component";
export const isBlock = (item: RegistryIndexEntry) => item.kind === "Block";
/** Drawer Blocks are navigation (the panel of a drawer Layout); the others are Screens. */
export const isDrawerBlock = (item: RegistryIndexEntry) =>
  isBlock(item) && item.category === "navigation";
/** Primitives, the Theme and helpers: no Variants to show, but every one is reachable. */
export const isFoundation = (item: RegistryIndexEntry) =>
  !isComponent(item) && !isBlock(item) && item.type !== "registry:example";

/** Case-insensitive match on name, title, description and category. */
export function matches(item: CatalogItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.name, item.title, item.description, item.category].some((s) =>
    s.toLowerCase().includes(q),
  );
}

/** The Components tab: every Component in its group, filtered by the search query. */
export function componentGroups(index: RegistryIndex, query = "") {
  const components = items(index).filter((i) => isComponent(i) && matches(i, query));
  return COMPONENT_GROUPS.map((group) => ({
    ...group,
    items: components
      .filter((i) => groupOf(i) === group.id)
      .sort((a, b) => a.title.localeCompare(b.title)),
  })).filter((group) => group.items.length > 0);
}

/** Primitives, the Theme and helpers, filtered by the search query. */
export function foundations(index: RegistryIndex, query = ""): CatalogItem[] {
  return items(index)
    .filter((i) => isFoundation(i) && matches(i, query))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** The Blocks tab: the Screen Blocks and the drawer Blocks, in Registry order (by name). */
export function blockGroups(index: RegistryIndex) {
  const blocks = items(index)
    .filter(isBlock)
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    screens: blocks.filter((b) => !isDrawerBlock(b)),
    drawers: blocks.filter(isDrawerBlock),
  };
}

/** The Components and Blocks built on an item, by title. */
export function usedBy(index: RegistryIndex, name: string): CatalogItem[] {
  return items(index)
    .filter((i) => (isComponent(i) || isBlock(i)) && i.uses.includes(name))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** The item whose `examples` include this example, i.e. the page that shows it. */
export function exampleOwner(index: RegistryIndex, example: string): string | undefined {
  return Object.keys(index).find((name) => index[name]!.examples.includes(example));
}

/**
 * The Showcase route where a Registry Item can be seen and used. Examples show on their
 * Component's page; layout examples (TabNavigation's and the drawer's) also run as real Layouts,
 * linked from that page.
 */
export function showcaseHref(index: RegistryIndex, name: string): string | undefined {
  const item = index[name];
  if (!item) return undefined;
  if (item.type === "registry:example") {
    const owner = exampleOwner(index, name);
    return owner ? showcaseHref(index, owner) : undefined;
  }
  if (isDrawerBlock(item)) return `/drawers/${name}`;
  if (isBlock(item)) return `/block/${name}`;
  return `/component/${name}`;
}

/** Layout examples that run as real Expo Router Layouts, and where. */
export const LAYOUT_EXAMPLES: Record<string, string> = {
  "tab-navigation-demo": "/tabs-demo",
  "drawer-demo": "/drawers/drawer-demo",
};

/** Examples that are a whole Screen (they bring their own Container). */
export const SCREEN_EXAMPLES = new Set(["container-demo"]);
