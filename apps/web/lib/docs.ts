// Server-only access to the docs content (content/docs/*.mdx). Runs at build time.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MDXContent } from "mdx/types";

import { allDocs, docHref } from "@/lib/docs-config";
import { parseDoc } from "@/lib/markdown";
import type { SearchEntry } from "@/lib/search";

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
