// Server-only access to the docs content: the MDX pages (content/docs/*.mdx) and the generated
// Registry item pages. Runs at build time.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MDXContent } from "mdx/types";

import { changelogMarkdown, UNRELEASED } from "@/lib/changelog";
import { allDocs, docHref, findDoc, guideDocs } from "@/lib/docs-config";
import { itemMarkdown } from "@/lib/item-doc";
import { itemSlug } from "@/lib/item-pages";
import { DEFAULT_STYLE, loadIndex, loadItemDoc } from "@/lib/items";
import {
  llmsFullTxt,
  llmsTxt,
  mdxToMarkdown,
  pageMarkdown,
  type DocMarkdown,
  type LlmsItem,
} from "@/lib/llms";
import { parseDoc } from "@/lib/markdown";
import type { SearchEntry } from "@/lib/search";

// The MCP server's own item classification, so llms.txt and the MCP never disagree on kinds.
import { kindOf } from "../../../packages/cli/src/mcp/catalog.ts";

/** Hand-written pages whose body is not an MDX file in content/docs. */
const GENERATED = new Set(["changelog"]);

/** One loader per MDX page, so the bundler sees every import statically. */
const loaders: Record<string, () => Promise<{ default: MDXContent }>> = {
  introduction: () => import("@/content/docs/introduction.mdx"),
  installation: () => import("@/content/docs/installation.mdx"),
  "components-json": () => import("@/content/docs/components-json.mdx"),
  cli: () => import("@/content/docs/cli.mdx"),
  theming: () => import("@/content/docs/theming.mdx"),
  presets: () => import("@/content/docs/presets.mdx"),
  "folder-structure": () => import("@/content/docs/folder-structure.mdx"),
  "ai-agents": () => import("@/content/docs/ai-agents.mdx"),
};

const fileName = (slug: string) => slug || "introduction";

/** The MDX slugs, for generateStaticParams. */
export const mdxSlugs = guideDocs.map((p) => p.slug).filter((slug) => !GENERATED.has(slug));

/** The generated Registry item page slugs (components/button, blocks/drawer-01, ...). */
export const itemSlugs = allDocs.filter((p) => p.item).map((p) => p.slug);

export async function loadDocContent(slug: string): Promise<MDXContent | undefined> {
  const loader = loaders[fileName(slug)];
  return loader ? (await loader()).default : undefined;
}

export async function readDocSource(slug: string): Promise<string> {
  return readFile(path.join(process.cwd(), "content/docs", `${fileName(slug)}.mdx`), "utf8");
}

/**
 * An item page's body as markdown, in the default Style. `source: false` leaves out the item's
 * own files (search and llms-full.txt; the JSON has them).
 */
async function itemBody(item: string, opts?: { source?: boolean }): Promise<string> {
  const doc = await loadItemDoc(item, DEFAULT_STYLE);
  return doc ? itemMarkdown(doc, opts) : "";
}

/** A page's markdown body (no title), generated from the same source as the rendered page. */
async function docBody(slug: string, opts?: { source?: boolean }): Promise<string> {
  if (slug === "changelog") return (await changelogMarkdown()) || UNRELEASED;
  const item = findDoc(slug)?.item;
  if (item) return itemBody(item, opts);
  return mdxToMarkdown(await readDocSource(slug));
}

/** Every page and section as plain text: the ⌘K search index. */
export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const entries: SearchEntry[] = [];
  for (const page of allDocs) {
    const href = docHref(page.slug);
    if (GENERATED.has(page.slug)) {
      entries.push({ page: page.title, href, text: page.description });
      continue;
    }
    const source = page.item
      ? await itemBody(page.item, { source: false })
      : await readDocSource(page.slug);
    const { sections } = parseDoc(source);
    // An item's name and keywords find its page too ("login" → the sign-in Blocks).
    const extra = page.item ? `${page.item} ${(await itemKeywords(page.item)).join(" ")}` : "";
    for (const section of sections) {
      entries.push(
        section.heading
          ? {
              page: page.title,
              heading: section.heading.text,
              href: `${href}#${section.heading.id}`,
              text: section.text,
            }
          : {
              page: page.title,
              href,
              text: `${page.description} ${extra} ${section.text}`.replace(/\s+/g, " ").trim(),
            },
      );
    }
    if (!sections.some((s) => !s.heading)) {
      entries.push({
        page: page.title,
        href,
        text: `${page.description} ${extra}`.trim(),
      });
    }
  }
  return entries;
}

async function itemKeywords(name: string): Promise<string[]> {
  const item = (await loadIndex()).find((i) => i.name === name);
  const keywords = item?.meta?.keywords;
  return Array.isArray(keywords) ? keywords.map(String) : [];
}

/** A docs page as clean markdown: its `.md` twin and what "Copy for AI" copies. */
export async function docMarkdown(slug: string): Promise<string | undefined> {
  const page = findDoc(slug);
  if (!page) return undefined;
  return pageMarkdown({ page, body: await docBody(slug) });
}

/** The Registry items for the llms files, each linked to its docs page when it has one. */
async function registryItems(): Promise<LlmsItem[]> {
  const pages = new Set(allDocs.map((p) => p.slug));
  return (await loadIndex(DEFAULT_STYLE)).map((item) => {
    const slug = itemSlug(item);
    return {
      name: item.name,
      type: item.type,
      description: item.description,
      kind: kindOf(item),
      ...(slug && pages.has(slug) ? { href: docHref(slug) } : {}),
    };
  });
}

export async function buildLlmsTxt(): Promise<string> {
  return llmsTxt({ pages: guideDocs, items: await registryItems(), style: DEFAULT_STYLE });
}

export async function buildLlmsFullTxt(): Promise<string> {
  const docs: DocMarkdown[] = await Promise.all(
    allDocs.map(async (page) => ({ page, body: await docBody(page.slug, { source: false }) })),
  );
  return llmsFullTxt({ docs, items: await registryItems(), style: DEFAULT_STYLE });
}
