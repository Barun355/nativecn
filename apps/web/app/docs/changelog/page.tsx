import { evaluate } from "@mdx-js/mdx";
import type { Metadata } from "next";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import { DocShell } from "@/components/doc-shell";
import { changelogMarkdown } from "@/lib/changelog";
import { docMarkdown } from "@/lib/docs";
import { findDoc } from "@/lib/docs-config";
import { parseDoc } from "@/lib/markdown";

const page = findDoc("changelog")!;

export const metadata: Metadata = { title: page.title, description: page.description };

export default async function ChangelogPage() {
  const markdown = await changelogMarkdown();
  const copy = (await docMarkdown("changelog"))!;

  if (!markdown) {
    return (
      <DocShell page={page} headings={[]} markdown={copy}>
        <p>
          nativecn has not been released yet. The first release is 0.1.0. From then on, every
          release&apos;s notes appear here, generated from the same Changesets entries as each
          package&apos;s <code>CHANGELOG.md</code> and the GitHub Release.
        </p>
      </DocShell>
    );
  }

  const { default: Content } = await evaluate(markdown, {
    ...runtime,
    format: "md",
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  });
  return (
    <DocShell page={page} headings={parseDoc(markdown).headings} markdown={copy}>
      <Content />
    </DocShell>
  );
}
