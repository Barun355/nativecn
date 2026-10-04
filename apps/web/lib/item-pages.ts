// The generated docs pages: one per Registry item, grouped by kind. Examples (`<item>-demo`)
// have no page of their own; they appear on their item's page.
import type { DocPage, DocSection } from "./docs-config.ts";
import { sourceItems } from "./registry-source.ts";

// The MCP server's own item classification, so the docs and the MCP never disagree on kinds.
import { kindOf, type Kind } from "../../../packages/cli/src/mcp/catalog.ts";
import type { RegistryIndexItem, RegistryItem } from "../../../packages/cli/src/registry.ts";

/** The URL folder under /docs for each kind that gets a page. */
const SECTIONS: { kinds: Kind[]; folder: string; title: string }[] = [
  { kinds: ["Component"], folder: "components", title: "Components" },
  { kinds: ["Block"], folder: "blocks", title: "Blocks" },
  // announce is one of the nine Primitives (#8), though it installs as a util (a Helper).
  { kinds: ["Primitive", "Helper"], folder: "primitives", title: "Primitives" },
  { kinds: ["Theme"], folder: "theme", title: "Theme" },
];

/** The docs slug of an item's page, or undefined for kinds without one (Examples). */
export function itemSlug(item: RegistryIndexItem | RegistryItem): string | undefined {
  const kind = kindOf(item);
  const section = SECTIONS.find((s) => s.kinds.includes(kind));
  return section ? `${section.folder}/${item.name}` : undefined;
}

/** The sidebar sections for every item, in the order above, each sorted by name (so Block Variants stay in order). */
export function itemSections(items: (RegistryIndexItem | RegistryItem)[]): DocSection[] {
  return SECTIONS.map(({ kinds, title }) => ({
    title,
    pages: items
      .filter((item) => kinds.includes(kindOf(item)))
      .map((item): DocPage => ({
        slug: itemSlug(item)!,
        title: item.title ?? item.name,
        description: item.description ?? "",
        item: item.name,
      }))
      .sort((a, b) => a.item!.localeCompare(b.item!)),
  })).filter((section) => section.pages.length > 0);
}

/** Item pages generated from the Registry item definitions. */
export const itemDocSections: DocSection[] = itemSections(sourceItems);
