// The AI-friendly plain-text output (decision #27): the `.md` twin of every docs page, /llms.txt
// and /llms-full.txt. Pure, so the same functions back the routes, the "Copy for AI" button and
// the tests; everything is built from the same MDX sources and Registry index as the pages.
import { docHref, type DocPage } from "./docs-config.ts";

export const SITE_URL = "https://nativecn.dev";

/** A docs page plus its markdown body (no title or description). */
export type DocMarkdown = { page: DocPage; body: string };

/** A Registry index entry, as much as llms.txt needs. */
export type LlmsItem = {
  name: string;
  type: string;
  description?: string;
  kind?: string;
  /** The item's docs page (e.g. /docs/components/button); its `.md` twin is linked. */
  href?: string;
};

/** The `.md` twin of a docs page: append `.md` to its URL. */
export function mdPath(slug: string): string {
  return `${docHref(slug)}.md`;
}

/** Root-relative links become absolute, so the markdown still works pasted elsewhere. */
function absoluteLinks(line: string): string {
  return line.replace(/\]\((\/[^)\s]*)\)/g, (_m, href: string) => `](${SITE_URL}${href})`);
}

/**
 * Turns a page's MDX source into clean markdown: drops `import`/`export` statements and lines
 * that are only a JSX element (interactive widgets), leaves code fences untouched and makes
 * site links absolute.
 */
export function mdxToMarkdown(source: string): string {
  const out: string[] = [];
  let inFence = false;
  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    if (/^(import|export)\s/.test(line)) continue;
    // A widget such as <CopyToLlm item="button" /> on its own line has no text for a reader.
    if (/^\s*<[A-Z][\w.]*(\s[^>]*)?\/>\s*$/.test(line)) continue;
    out.push(absoluteLinks(line));
  }
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** One docs page as a standalone markdown document: title, description, then the body. */
export function pageMarkdown({ page, body }: DocMarkdown): string {
  return `# ${page.title}\n\n> ${page.description}\n\n${body.trim()}\n`;
}

/** Shifts every heading down one level (outside code fences), so pages nest under a `#` title. */
function demoteHeadings(markdown: string): string {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      return !inFence && /^#{1,5}\s/.test(line) ? `#${line}` : line;
    })
    .join("\n");
}

const INTRO = [
  "# nativecn",
  "",
  "> nativecn is shadcn for Expo apps: Components, Primitives and Blocks you copy into your app with `nativecn-cli` and own, built so AI agents can build and verify whole mobile apps.",
  "",
  "- Every docs page has a markdown twin: append `.md` to its URL.",
  `- The Registry is JSON at ${SITE_URL}/r/styles/<style>/registry.json (index) and ${SITE_URL}/r/styles/<style>/<item>.json (one item, with source).`,
  `- The remote MCP server is ${SITE_URL}/mcp (Streamable HTTP, read-only); \`npx -y nativecn-cli@latest mcp\` is the local one that reads your project's components.json.`,
  `- The JSON Schema for components.json is ${SITE_URL}/schema/components.json.`,
].join("\n");

/** Groups Registry items by kind, in a fixed order, skipping Examples. */
function itemsByKind(items: LlmsItem[]): [string, LlmsItem[]][] {
  const order = ["Component", "Block", "Primitive", "Helper", "Theme"];
  const groups = new Map<string, LlmsItem[]>();
  for (const item of items) {
    const kind = item.kind ?? "Component";
    if (kind === "Example") continue;
    groups.set(kind, [...(groups.get(kind) ?? []), item]);
  }
  return [...groups].sort(([a], [b]) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
  });
}

/** An item links to its page's `.md` twin, or to its Registry JSON when it has no page. */
const itemLine = (item: LlmsItem, style: string) =>
  `- [${item.name}](${SITE_URL}${item.href ? `${item.href}.md` : `/r/styles/${style}/${item.name}.json`})${item.description ? `: ${item.description}` : ""}`;

/** /llms.txt: an index of every docs page (linking to its `.md` twin) and every Registry item. */
export function llmsTxt({
  pages,
  items,
  style = "vega",
}: {
  pages: DocPage[];
  items: LlmsItem[];
  style?: string;
}): string {
  const lines = [INTRO, "", "## Docs", ""];
  for (const page of pages)
    lines.push(`- [${page.title}](${SITE_URL}${mdPath(page.slug)}): ${page.description}`);
  for (const [kind, group] of itemsByKind(items)) {
    lines.push("", `## ${kind}s`, "");
    for (const item of group) lines.push(itemLine(item, style));
  }
  lines.push(
    "",
    "## Optional",
    "",
    `- [Everything in one file](${SITE_URL}/llms-full.txt): every docs page concatenated`,
    `- [Registry index (${style})](${SITE_URL}/r/styles/${style}/registry.json): every item, without file contents`,
    `- [Preset options](${SITE_URL}/r/presets/index.json): Styles, colours, radii and fonts`,
  );
  return `${lines.join("\n")}\n`;
}

/** /llms-full.txt: every docs page in sidebar order, then the Registry items, in one file. */
export function llmsFullTxt({
  docs,
  items,
  style = "vega",
}: {
  docs: DocMarkdown[];
  items: LlmsItem[];
  style?: string;
}): string {
  const parts = [INTRO];
  for (const doc of docs) {
    parts.push(
      [
        `## ${doc.page.title}`,
        "",
        `Source: ${SITE_URL}${docHref(doc.page.slug)}`,
        "",
        `> ${doc.page.description}`,
        "",
        demoteHeadings(doc.body.trim()),
      ].join("\n"),
    );
  }
  const groups = itemsByKind(items);
  if (groups.length) {
    const lines = [
      "## Registry items",
      "",
      `Install any item with \`npx nativecn-cli@latest add <name>\`. Full source: ${SITE_URL}/r/styles/${style}/<name>.json.`,
    ];
    for (const [kind, group] of groups) {
      lines.push("", `### ${kind}s`, "");
      for (const item of group) lines.push(itemLine(item, style));
    }
    parts.push(lines.join("\n"));
  }
  return `${parts.join("\n\n---\n\n")}\n`;
}
