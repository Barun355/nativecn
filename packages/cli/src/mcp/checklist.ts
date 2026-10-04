// The post-change audit checklist, drawn from the Rules in packages/agent-kit/rules/AGENTS.md
// (decision #20). mcp.test.ts checks the accessibility points stay word-for-word in sync.
import type { Config } from "../config.ts";

/** The 9-point accessibility checklist, exactly as in AGENTS.md. */
export const A11Y_CHECKLIST = [
  "Correct `role`.",
  "An accessible name: from the visible text, or `aria-label` when there is none (icon-only Buttons require it).",
  "`aria-disabled`, `aria-busy`, `aria-checked`, `aria-selected`, `aria-expanded` as applicable.",
  "`hitSlop` up to the 48 minimum tap target.",
  "No handler runs while disabled or loading.",
  "Error and success are announced to screen readers.",
  "Reduce Motion is honoured.",
  "The font-scaling switch in `theme/config.ts` is honoured, with the 1.5x cap on chrome Variants.",
  "An optional hint passes through.",
] as const;

function placement(config: Config | null): string[] {
  const common = [
    "Routes folder holds routes only (Screens and Layouts); a Screen Block is rendered by a 3-line route file.",
    "nativecn Components and Primitives stay in the global folders.",
  ];
  if (config?.structure === "flat")
    return [
      "Structure is `flat`: new files go in the global folders (components, hooks, utils, screens) under the aliases in components.json.",
      ...common,
    ];
  const feature = [
    "Reuse global items first.",
    "An item used by one Feature lives in that Feature (`src/features/<feature>/{components,hooks,screens,utils}`).",
    "Promote it to global the moment a second Feature needs it (components, hooks, utils, screens).",
  ];
  if (config?.structure === "feature")
    return ["Structure is `feature`:", ...feature.map((l) => `  - ${l}`), ...common];
  return [
    "Follow `structure` in components.json. In feature mode:",
    ...feature.map((l) => `  - ${l}`),
    ...common,
  ];
}

export function auditChecklist(config: Config | null): string {
  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((l) => (l.startsWith("  ") ? l : `- [ ] ${l}`))].join("\n");
  return [
    "# nativecn audit checklist",
    "Check every file you created or changed. Fix anything that fails before you finish.",
    section("Styling: Tokens only", [
      "Styles come from Tokens through `createStyles`: no hard-coded colours (hex, rgb, named) or sizes.",
      "`t.scaleValue(n)` (from `useTheme()`) only for a genuine one-off; `t.scale` is the zoom factor, not a function.",
      "No Tailwind, NativeWind or `className`.",
    ]),
    section("Building blocks", [
      "All text uses `Text`; all glyphs use `Icon` with a Lucide component.",
      "Every Screen's content is wrapped in `Container`.",
    ]),
    section("Feedback: no platform alerts", [
      "No `Alert.alert`, `Alert.prompt` or any other platform alert or dialog.",
      "Feedback uses nativecn's `toast()` and Alert Components.",
      "Validation errors appear under their field via `FormField`; server errors and success only via `toast()`.",
    ]),
    section("Placement (ADR 0008)", placement(config)),
    section("Accessibility (9 points)", [
      ...A11Y_CHECKLIST,
      "No `role` or `aria-*` prop was removed; `accessibility*` props are not used instead.",
    ]),
    section("Also", [
      "Forms use react-hook-form + zod through `FormField`, with fields inside `FocusChain`.",
      "Navigation: the drawer comes only from `expo-router/drawer`; `SegmentedTabs` for in-screen tabs, `TabNavigation` for the bottom bar.",
      "Dependencies: `npx expo install` for SDK-pinned packages; anything else was approved by the user.",
      "Storage: tokens, credentials and personal data in `expo-secure-store`; AsyncStorage only for non-sensitive preferences.",
      "`preset` in components.json is unchanged (the Preset is fixed).",
      "Items were added with `nativecn-cli add` (`--route`, and `--feature` in feature mode), not hand-copied.",
    ]),
  ].join("\n\n");
}
