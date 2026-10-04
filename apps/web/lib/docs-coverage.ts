// Docs coverage (#31): every Component needs a docs page, usage examples, a props table and
// accessibility notes (meta.a11y, #138); every Block needs a docs page (#27). Pages are the
// `components/<item>` and `blocks/<item>` docs slugs.
import type { DocPage } from "./docs-config.ts";

// The MCP server's own item classification, so the docs and the MCP never disagree on kinds.
import { a11yOf, kindOf } from "../../../packages/cli/src/mcp/catalog.ts";
import type { RegistryIndexItem } from "../../../packages/cli/src/registry.ts";

export const componentSlug = (name: string) => `components/${name}`;
export const blockSlug = (name: string) => `blocks/${name}`;

/** Whether the docs have any component or Block pages yet (they arrive with #76). */
export function hasItemPages(pages: DocPage[]): boolean {
  return pages.some((p) => p.slug.startsWith("components/") || p.slug.startsWith("blocks/"));
}

/** Every missing page, example, props table or accessibility notes, as human-readable messages. */
export function docsCoverageProblems(items: RegistryIndexItem[], pages: DocPage[]): string[] {
  const slugs = new Set(pages.map((p) => p.slug));
  const names = new Set(items.map((i) => i.name));
  const problems: string[] = [];
  for (const item of items) {
    const kind = kindOf(item);
    if (kind === "Component") {
      if (!slugs.has(componentSlug(item.name)))
        problems.push(`${item.name}: no docs page (${componentSlug(item.name)})`);
      const listed = item.meta?.examples;
      const hasExamples =
        names.has(`${item.name}-demo`) || (Array.isArray(listed) && listed.length > 0);
      if (!hasExamples)
        problems.push(
          `${item.name}: no usage examples (a "${item.name}-demo" item or meta.examples)`,
        );
      const props = item.meta?.props;
      if (!props || typeof props !== "object" || Object.keys(props).length === 0)
        problems.push(`${item.name}: no props table (meta.props)`);
      if (!a11yOf(item)) problems.push(`${item.name}: no accessibility notes (meta.a11y)`);
    } else if (kind === "Block") {
      if (!slugs.has(blockSlug(item.name)))
        problems.push(`${item.name}: no docs page (${blockSlug(item.name)})`);
    }
  }
  return problems;
}
