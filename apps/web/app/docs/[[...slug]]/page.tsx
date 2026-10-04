import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocShell } from "@/components/doc-shell";
import { loadDocContent, mdxSlugs, readDocSource } from "@/lib/docs";
import { findDoc } from "@/lib/docs-config";
import { parseDoc } from "@/lib/markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return mdxSlugs.map((slug) => ({ slug: slug ? [slug] : [] }));
}

function slugOf(params: { slug?: string[] }): string {
  return params.slug?.join("/") ?? "";
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const page = findDoc(slugOf(await props.params));
  if (!page) return {};
  return { title: page.title, description: page.description };
}

export default async function DocPage(props: PageProps<"/docs/[[...slug]]">) {
  const slug = slugOf(await props.params);
  const page = findDoc(slug);
  const Content = await loadDocContent(slug);
  if (!page || !Content) notFound();

  const { headings } = parseDoc(await readDocSource(slug));
  return (
    <DocShell page={page} headings={headings}>
      <Content />
    </DocShell>
  );
}
