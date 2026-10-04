import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocShell } from "@/components/doc-shell";
import { ItemPage } from "@/components/item-page";
import { docMarkdown, itemSlugs, loadDocContent, mdxSlugs, readDocSource } from "@/lib/docs";
import { findDoc } from "@/lib/docs-config";
import { HEADINGS, itemMarkdown, type ItemDoc } from "@/lib/item-doc";
import { hasBuiltRegistry, loadItemDoc, registryStyles } from "@/lib/items";
import { parseDoc } from "@/lib/markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...mdxSlugs, ...itemSlugs].map((slug) => ({ slug: slug ? slug.split("/") : [] }));
}

function slugOf(params: { slug?: string[] }): string {
  return params.slug?.join("/") ?? "";
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const page = findDoc(slugOf(await props.params));
  if (!page) return {};
  return { title: page.title, description: page.description };
}

/** A generated Registry item page: the item in every built Style, default Style first. */
async function ItemDocPage({ slug, item }: { slug: string; item: string }) {
  const page = findDoc(slug)!;
  const built = await hasBuiltRegistry();
  const styles = built ? await registryStyles() : ["vega"];
  const docs = (await Promise.all(styles.map((s) => loadItemDoc(item, s)))).filter(
    (d): d is ItemDoc => d !== undefined,
  );
  if (!docs.length) notFound();
  const { headings } = parseDoc(itemMarkdown(docs[0]!));
  const markdown = (await docMarkdown(slug))!;
  return (
    <DocShell
      page={page}
      headings={headings.filter((h) => h.depth === 2 && (built || h.text !== HEADINGS.source))}
      markdown={markdown}
    >
      <ItemPage docs={docs} headings={headings} built={built} />
    </DocShell>
  );
}

export default async function DocPage(props: PageProps<"/docs/[[...slug]]">) {
  const slug = slugOf(await props.params);
  const page = findDoc(slug);
  if (page?.item) return <ItemDocPage slug={slug} item={page.item} />;

  const Content = await loadDocContent(slug);
  if (!page || !Content) notFound();

  const { headings } = parseDoc(await readDocSource(slug));
  const markdown = (await docMarkdown(slug))!;
  return (
    <DocShell page={page} headings={headings} markdown={markdown}>
      <Content />
    </DocShell>
  );
}
