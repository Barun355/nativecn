// Content for the landing page (app/page.tsx). Facts come from the decisions linked below and
// the docs pages in content/docs; keep them in step when either changes.

import { ACCENT_COLORS, BASE_COLORS, FONTS, STYLES, encodePreset, type AccentColor } from "preset";

export const CREATE_COMMAND = "npx nativecn-cli@latest create my-app";
export const GITHUB_URL = "https://github.com/Barun355/nativecn";

/** The default Preset (decision #5): Vega · neutral · neutral · default radius · Inter. */
export const DEFAULT_PRESET_CODE = encodePreset();

/** The example Preset from the Presets docs: Nova, violet accent, Lora headings. */
export const EXAMPLE_PRESET = {
  style: "nova",
  accentColor: "violet",
  headingFont: "lora",
} as const;
export const EXAMPLE_PRESET_CODE = encodePreset(EXAMPLE_PRESET);

export const STYLE_OPTIONS: { name: string; id: (typeof STYLES)[number]; summary: string }[] = [
  { name: "Vega", id: "vega", summary: "Clean and balanced. The default." },
  { name: "Nova", id: "nova", summary: "Compact, for denser screens." },
];

export { ACCENT_COLORS, BASE_COLORS, FONTS };

/**
 * The `primary` of each Accent Colour in light and dark, for the swatches. Copied from
 * packages/ui/presets/colors.generated.ts; lib/landing.test.ts fails if they drift apart.
 */
export const ACCENT_SWATCHES: Record<AccentColor, { light: string; dark: string }> = {
  neutral: { light: "#171717", dark: "#e5e5e5" },
  stone: { light: "#1c1917", dark: "#e7e5e4" },
  zinc: { light: "#18181b", dark: "#e4e4e7" },
  mauve: { light: "#1d161e", dark: "#e7e4e7" },
  olive: { light: "#1d1d16", dark: "#e8e8e3" },
  mist: { light: "#161b1d", dark: "#e3e7e8" },
  taupe: { light: "#1d1816", dark: "#e8e4e3" },
  amber: { light: "#bb4d00", dark: "#973c00" },
  blue: { light: "#1447e6", dark: "#193cb8" },
  cyan: { light: "#007595", dark: "#005f78" },
  emerald: { light: "#007a55", dark: "#006045" },
  fuchsia: { light: "#a800b7", dark: "#8a0194" },
  green: { light: "#008236", dark: "#016630" },
  indigo: { light: "#432dd7", dark: "#372aac" },
  lime: { light: "#9ae600", dark: "#7ccf00" },
  orange: { light: "#ca3500", dark: "#9f2d00" },
  pink: { light: "#c6005c", dark: "#a3004c" },
  purple: { light: "#8200db", dark: "#6e11b0" },
  red: { light: "#c10007", dark: "#9f0712" },
  rose: { light: "#c70036", dark: "#a50036" },
  sky: { light: "#0069a8", dark: "#00598a" },
  teal: { light: "#00786f", dark: "#005f5a" },
  violet: { light: "#7008e7", dark: "#5d0ec0" },
  yellow: { light: "#fdc700", dark: "#f0b100" },
};

/** Display names for the Preset fonts, grouped as in the Presets docs. */
export const FONT_GROUPS: { label: string; fonts: string[] }[] = [
  { label: "Sans", fonts: ["Inter", "Geist", "DM Sans", "Figtree"] },
  { label: "Serif", fonts: ["Lora", "Source Serif 4"] },
  { label: "Mono", fonts: ["Geist Mono", "JetBrains Mono"] },
];

/** The five Skills (decision #20). */
export const SKILLS = [
  "nativecn-setup",
  "nativecn-build-screen",
  "nativecn-theme",
  "nativecn-component-authoring",
  "nativecn-visual-qa",
] as const;

/** The nativecn MCP server's tools (decision #19); the last two share one row in the docs. */
export const MCP_TOOLS = [
  "list_items",
  "search_items",
  "view_items",
  "get_item_examples",
  "get_add_command",
  "get_project_config",
  "get_audit_checklist",
  "list_block_variants",
  "list_preset_options",
  "build_preset_code",
] as const;
