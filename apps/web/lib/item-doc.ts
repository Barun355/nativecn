// The content of a generated Registry item page (decisions #27 and #26): description, add command,
// what it installs, usage examples, props, Variants, accessibility notes, Block Variants and
// source. One pure model feeds the rendered page, its `.md` twin, search and llms-full.txt, so
// they never disagree. Everything comes from the Registry item and its index; nothing is written
// by hand per item.
import { docHref } from "./docs-config.ts";
import { itemSlug } from "./item-pages.ts";

import { planAddCommands } from "../../../packages/cli/src/mcp/add-command.ts";
import {
  blockVariants,
  isScreenBlock,
  kindOf,
  purposeOf,
  screenshotsOf,
  type Kind,
} from "../../../packages/cli/src/mcp/catalog.ts";
import type { RegistryIndexItem, RegistryItem } from "../../../packages/cli/src/registry.ts";

export type PropRow = { name: string; description: string };
export type PropTable = { name?: string; rows: PropRow[] };
export type VariantList = { prop?: string; values: string[] };
export type ItemLink = { name: string; title?: string; href?: string };
export type CodeFile = { target: string; path: string; content?: string };
export type ItemExample = { name: string; title: string; description?: string; files: CodeFile[] };
export type BlockVariant = ItemLink & { difference?: string; current: boolean };

export type ItemDoc = {
  name: string;
  title: string;
  description: string;
  kind: Kind;
  categories: string[];
  style: string;
  add: { commands: string[]; notes: string[] };
  installs: ItemLink[];
  packages: string[];
  /** Blocks: what makes this Block Variant different. */
  difference?: string;
  /** Blocks: every Block Variant for the same purpose, this one included. */
  blockVariants: BlockVariant[];
  screenshots?: Record<string, string>;
  props: PropTable[];
  variants: VariantList[];
  accessibility: string[];
  notes: string[];
  examples: ItemExample[];
  source: CodeFile[];
};

/** Words that mark a sentence of an item's notes as accessibility guidance. */
const A11Y =
  /\baria-|\brole\b|\broles\b|screen reader|announc|accessib|VoiceOver|TalkBack|Reduce Motion|touch target|tap area|minTouchTarget|font scal|hitSlop/i;

/** Splits notes into sentences, keeping "e.g. x" and code such as `a.b()` intact. */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z<`"(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const asString = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value));

/**
 * `meta.props` is either `{ Export: { prop: description } }` (one table per export) or a flat
 * `{ prop: description }` (one table, e.g. a Screen Block's props).
 */
export function propTables(props: unknown, fallbackName?: string): PropTable[] {
  if (!props || typeof props !== "object" || Array.isArray(props)) return [];
  const entries = Object.entries(props as Record<string, unknown>);
  const nested = entries.every(([, v]) => v && typeof v === "object" && !Array.isArray(v));
  if (!nested)
    return [
      {
        name: fallbackName,
        rows: entries.map(([name, d]) => ({ name, description: asString(d) })),
      },
    ];
  return entries.map(([name, rows]) => ({
    name,
    rows: Object.entries(rows as Record<string, unknown>).map(([prop, d]) => ({
      name: prop,
      description: asString(d),
    })),
  }));
}

/** `meta.variants` is a list of values, or `{ prop: values }`. */
export function variantLists(variants: unknown): VariantList[] {
  if (Array.isArray(variants)) return variants.length ? [{ values: variants.map(String) }] : [];
  if (!variants || typeof variants !== "object") return [];
  return Object.entries(variants as Record<string, unknown>)
    .filter(([, v]) => Array.isArray(v) && v.length)
    .map(([prop, v]) => ({ prop, values: (v as unknown[]).map(String) }));
}

const link = (item: RegistryIndexItem | undefined, name: string): ItemLink => {
  const slug = item ? itemSlug(item) : undefined;
  return { name, title: item?.title, href: slug ? docHref(slug) : undefined };
};

/**
 * What a reader needs besides the command. The command itself is the MCP's get_add_command plan
 * for a project with the default (flat) Structure; these notes are its notes in docs wording.
 */
function addNotes(item: RegistryItem): string[] {
  if (!isScreenBlock(item)) return [];
  const route = typeof item.meta?.route === "string" ? item.meta.route : undefined;
  const feature = item.categories?.[0];
  return [
    route
      ? `\`--route "${route}"\` is the Block's suggested route: change it to put the Screen somewhere else in your app folder.`
      : "Pass `--route <path>` to choose where the Screen's route goes.",
    `In a project with the feature Structure, also pass \`--feature <name>\`${feature ? ` (for example \`--feature ${feature}\`)` : ""}.`,
    "`add` never overwrites an existing route file.",
  ];
}

/**
 * Builds an item page. `index` is the Style's registry.json items (for links, Block Variants
 * and examples); `examples` are the example items with their file contents, when available.
 */
export function itemDoc({
  item,
  index,
  examples = [],
  style,
}: {
  item: RegistryItem;
  index: RegistryIndexItem[];
  examples?: RegistryItem[];
  style: string;
}): ItemDoc {
  const meta = item.meta ?? {};
  const byName = new Map(index.map((i) => [i.name, i]));
  const kind = kindOf(item);

  const plan = planAddCommands([item], null, { hasProject: false });
  const docs = typeof meta.docs === "string" ? sentences(meta.docs) : [];

  const variants =
    kind === "Block"
      ? blockVariants(index, purposeOf(item)).map((b) => ({
          ...link(b, b.name),
          difference: typeof b.meta?.difference === "string" ? b.meta.difference : undefined,
          current: b.name === item.name,
        }))
      : [];

  return {
    name: item.name,
    title: item.title ?? item.name,
    description: item.description ?? "",
    kind,
    categories: item.categories ?? [],
    style,
    add: { commands: plan.commands.map((c) => c.command), notes: addNotes(item) },
    installs: (item.registryDependencies ?? []).map((n) => link(byName.get(n), n)),
    packages: item.dependencies ?? [],
    difference: typeof meta.difference === "string" ? meta.difference : undefined,
    blockVariants: variants.length > 1 ? variants : [],
    screenshots: screenshotsOf(item),
    props: propTables(meta.props, typeof meta.component === "string" ? meta.component : item.title),
    variants: variantLists(meta.variants),
    accessibility: docs.filter((s) => A11Y.test(s)),
    notes: docs.filter((s) => !A11Y.test(s)),
    examples: examples.map((ex) => ({
      name: ex.name,
      title: ex.title ?? ex.name,
      description: ex.description,
      files: (ex.files ?? []).map(({ target, path, content }) => ({ target, path, content })),
    })),
    source: (item.files ?? []).map(({ target, path, content }) => ({ target, path, content })),
  };
}

// ---------------------------------------------------------------------------------------------
// Markdown: the page's `.md` twin, "Copy for AI", search and llms-full.txt.

const fence = (file: string, content = "") => {
  // A file path gives its extension as the language; a bare word ("sh") is the language.
  const lang = /\.(tsx?|jsx?|json)$/.exec(file)?.[1] ?? (/^\w+$/.test(file) ? file : "");
  return `\`\`\`${lang}\n${content.replace(/\n$/, "")}\n\`\`\``;
};

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");

const SITE = "https://nativecn.dev";

const mdLink = (l: ItemLink) => (l.href ? `[${l.name}](${SITE}${l.href})` : `\`${l.name}\``);

/** The section headings in page order; the page and the markdown use the same ones. */
export const HEADINGS = {
  installation: "Installation",
  difference: "What makes it different",
  variants: "Block Variants",
  screenshots: "Screenshots",
  usage: "Usage",
  props: "Props",
  variantValues: "Variants",
  accessibility: "Accessibility",
  notes: "Notes",
  source: "Source",
} as const;

/**
 * The page body as markdown (no title or description: pageMarkdown adds them).
 * `source: false` leaves out the item's own files (llms-full.txt links to the JSON instead).
 */
export function itemMarkdown(doc: ItemDoc, { source = true } = {}): string {
  const out: string[] = [];
  const kindLine = [doc.kind, ...doc.categories].join(" · ");
  out.push(
    `${kindLine}. Registry item \`${doc.name}\`, shown in the ${doc.style} Style. JSON: ${SITE}/r/styles/${doc.style}/${doc.name}.json`,
  );

  out.push("", `## ${HEADINGS.installation}`, "", fence("sh", doc.add.commands.join("\n")));
  if (doc.add.notes.length) out.push("", doc.add.notes.map((n) => `- ${n}`).join("\n"));
  if (doc.installs.length) out.push("", `Also installs: ${doc.installs.map(mdLink).join(", ")}.`);
  if (doc.packages.length)
    out.push("", `Packages: ${doc.packages.map((p) => `\`${p}\``).join(", ")}.`);

  if (doc.difference) out.push("", `## ${HEADINGS.difference}`, "", doc.difference);
  if (doc.blockVariants.length) {
    out.push("", `## ${HEADINGS.variants}`, "");
    for (const v of doc.blockVariants)
      out.push(
        `- ${v.current ? `**${v.name}** (this page)` : mdLink(v)}${v.title ? ` – ${v.title}` : ""}${v.difference ? `: ${v.difference}` : ""}`,
      );
  }
  if (doc.screenshots) {
    out.push("", `## ${HEADINGS.screenshots}`, "");
    for (const [label, url] of Object.entries(doc.screenshots))
      out.push(`- [${doc.title} (${label})](${url})`);
  }

  if (doc.examples.length) {
    out.push("", `## ${HEADINGS.usage}`);
    for (const ex of doc.examples) {
      out.push("", `### ${ex.title}`);
      if (ex.description) out.push("", ex.description);
      for (const file of ex.files)
        if (file.content !== undefined) out.push("", fence(file.path, file.content));
    }
  }

  if (doc.props.length) {
    out.push("", `## ${HEADINGS.props}`);
    for (const table of doc.props) {
      if (table.name && doc.props.length > 1) out.push("", `### ${table.name}`);
      out.push(
        "",
        "| Prop | Type and description |",
        "|---|---|",
        ...table.rows.map((r) => `| \`${cell(r.name)}\` | ${cell(r.description)} |`),
      );
    }
  }
  if (doc.variants.length) {
    out.push("", `## ${HEADINGS.variantValues}`, "");
    for (const v of doc.variants)
      out.push(`- ${v.prop ? `\`${v.prop}\`: ` : ""}${v.values.map((x) => `\`${x}\``).join(", ")}`);
  }
  if (doc.accessibility.length)
    out.push("", `## ${HEADINGS.accessibility}`, "", ...doc.accessibility.map((s) => `- ${s}`));
  if (doc.notes.length) out.push("", `## ${HEADINGS.notes}`, "", doc.notes.join(" "));

  if (source && doc.source.some((f) => f.content !== undefined)) {
    out.push("", `## ${HEADINGS.source}`);
    for (const file of doc.source)
      out.push("", `### ${file.target}`, "", fence(file.path, file.content));
  }
  return out.join("\n");
}
