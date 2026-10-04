// Server-only access to the docs content (content/docs/*.mdx). Runs at build time.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MDXContent } from "mdx/types";

import { changelogMarkdown, UNRELEASED } from "@/lib/changelog";
import { allDocs, docHref, findDoc } from "@/lib/docs-config";
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
import type { RegistryIndex } from "../../../packages/cli/src/registry.ts";

/** Pages whose body is not an MDX file in content/docs. */
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
export const mdxSlugs = allDocs.map((p) => p.slug).filter((slug) => !GENERATED.has(slug));

export async function loadDocContent(slug: string): Promise<MDXContent | undefined> {
  const loader = loaders[fileName(slug)];
  return loader ? (await loader()).default : undefined;
}

export async function readDocSource(slug: string): Promise<string> {
  return readFile(path.join(process.cwd(), "content/docs", `${fileName(slug)}.mdx`), "utf8");
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
    const { sections } = parseDoc(await readDocSource(page.slug));
    for (const section of sections) {
      entries.push(
        section.heading
          ? {
              page: page.title,
              heading: section.heading.text,
              href: `${href}#${section.heading.id}`,
              text: section.text,
            }
          : { page: page.title, href, text: `${page.description} ${section.text}`.trim() },
      );
    }
    if (!sections.some((s) => !s.heading)) {
      entries.push({ page: page.title, href, text: page.description });
    }
  }
  return entries;
}

/** A page's markdown body (no title), generated from the same source as the rendered page. */
async function docBody(slug: string): Promise<string> {
  if (slug === "changelog") return (await changelogMarkdown()) || UNRELEASED;
  return mdxToMarkdown(await readDocSource(slug));
}

/** A docs page as clean markdown: its `.md` twin and what "Copy for AI" copies. */
export async function docMarkdown(slug: string): Promise<string | undefined> {
  const page = findDoc(slug);
  if (!page) return undefined;
  return pageMarkdown({ page, body: await docBody(slug) });
}

/** The Style the llms files describe: the default, as on the remote MCP. */
const LLMS_STYLE = "vega";

/**
 * The Registry index that `pnpm --filter ui build` writes into public/r before `next build`.
 * Missing (e.g. a docs-only dev server) means no items rather than a failed page.
 */
async function registryItems(style = LLMS_STYLE): Promise<LlmsItem[]> {
  let index: RegistryIndex;
  try {
    const file = path.join(process.cwd(), "public/r/styles", style, "registry.json");
    index = JSON.parse(await readFile(file, "utf8")) as RegistryIndex;
  } catch {
    return [];
  }
  return (index.items ?? []).map((item) => ({
    name: item.name,
    type: item.type,
    description: item.description,
    kind: kindOf(item),
  }));
}

export async function buildLlmsTxt(): Promise<string> {
  return llmsTxt({ pages: allDocs, items: await registryItems(), style: LLMS_STYLE });
}

export async function buildLlmsFullTxt(): Promise<string> {
  const docs: DocMarkdown[] = await Promise.all(
    allDocs.map(async (page) => ({ page, body: await docBody(page.slug) })),
  );
  return llmsFullTxt({ docs, items: await registryItems(), style: LLMS_STYLE });
}
