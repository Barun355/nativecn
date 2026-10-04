// The `meta` of a nativecn Registry item, as the `_registry.ts` files write it. shadcn types
// `meta` as an open record; these are the keys nativecn adds on top that need a shape.
import type { RegistryItem } from "shadcn/schema";

export type ItemMeta = NonNullable<RegistryItem["meta"]> & {
  /**
   * The item's accessibility facts, one short sentence each: role, what screen readers announce,
   * touch target, Reduce Motion, font scaling (#138). The docs page shows them under
   * Accessibility, and Copy to LLM and the MCP's view_items carry them too. Every Component must
   * have them (docs coverage); every Block has them.
   */
  a11y?: string[];
};

/** A Component's or Block's `meta`: `a11y` is required. */
export type DocumentedMeta = ItemMeta & { a11y: string[] };
