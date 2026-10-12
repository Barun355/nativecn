// What the live phone preview shows on each Component and Block docs page (#162, decision #28):
// a Component's usage examples, or the Screen Block itself. Items that need Expo Router (a tabs
// or drawer Layout) cannot run in a plain web page, so their page shows the spec card instead.
//
// The two lists below name what the preview can load; components/preview/docs-demos.tsx maps
// each name to its module, typed by these lists, and docs-preview.test.ts checks them against the
// Registry, so a new item cannot be silently left out.

import type { Kind } from "../../../packages/cli/src/mcp/catalog.ts";

/** Usage examples the docs preview can render (every Component example that runs on the web). */
export const PREVIEW_EXAMPLES = [
  "alert-demo",
  "avatar-demo",
  "badge-demo",
  "button-demo",
  "card-demo",
  "checkbox-demo",
  "chip-demo",
  "container-demo",
  "empty-state-demo",
  "form-field-demo",
  "icon-demo",
  "input-demo",
  "input-otp-demo",
  "label-demo",
  "list-demo",
  "progress-demo",
  "radio-group-demo",
  "scheme-switcher-demo",
  "search-field-demo",
  "segmented-tabs-demo",
  "separator-demo",
  "skeleton-demo",
  "slider-demo",
  "spinner-demo",
  "switch-demo",
  "text-demo",
  "textarea-demo",
  "toast-demo",
] as const;
export type PreviewExample = (typeof PREVIEW_EXAMPLES)[number];

/** Screen Blocks the docs preview can render. */
export const PREVIEW_BLOCKS = [
  "sign-in-01",
  "sign-in-02",
  "sign-in-03",
  "sign-up-01",
  "sign-up-02",
  "sign-up-03",
] as const;
export type PreviewBlock = (typeof PREVIEW_BLOCKS)[number];

/**
 * Items whose example or source is an Expo Router Layout (or installs the drawer Component, which
 * reads the router), so they have nothing to run without an app's router.
 */
export const NEEDS_EXPO_ROUTER: ReadonlySet<string> = new Set([
  "drawer",
  "drawer-01",
  "drawer-02",
  "drawer-03",
  "tab-navigation",
]);

const EXPO_ROUTER_REASON =
  "This needs Expo Router (a navigation Layout), so it can't run in the browser. The card shows your Preset's Tokens; run it in an app to see it live.";
const NOT_IN_PREVIEW_REASON =
  "This item isn't in the live preview yet, so the card shows your Preset's Tokens.";

export type PreviewItem = { name: string; kind: Kind; examples: string[] };

export type DocsPreviewPlan =
  | { live: true; examples: PreviewExample[] }
  | { live: true; block: PreviewBlock }
  | { live: false; reason: string };

const isExample = (name: string): name is PreviewExample =>
  (PREVIEW_EXAMPLES as readonly string[]).includes(name);
const isBlock = (name: string): name is PreviewBlock =>
  (PREVIEW_BLOCKS as readonly string[]).includes(name);

/** What an item's docs page previews, or undefined for kinds without a preview. */
export function docsPreview(item: PreviewItem): DocsPreviewPlan | undefined {
  if (item.kind !== "Component" && item.kind !== "Block") return undefined;
  if (NEEDS_EXPO_ROUTER.has(item.name)) return { live: false, reason: EXPO_ROUTER_REASON };
  if (item.kind === "Block") {
    return isBlock(item.name)
      ? { live: true, block: item.name }
      : { live: false, reason: NOT_IN_PREVIEW_REASON };
  }
  const examples = item.examples.filter(isExample);
  return examples.length > 0 && examples.length === item.examples.length
    ? { live: true, examples }
    : { live: false, reason: NOT_IN_PREVIEW_REASON };
}
