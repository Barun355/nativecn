import { readFile } from "node:fs/promises";
import path from "node:path";

import { evaluate } from "@mdx-js/mdx";
import type { Metadata } from "next";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import { DocShell } from "@/components/doc-shell";
import { findDoc } from "@/lib/docs-config";
import { parseDoc } from "@/lib/markdown";

// Changesets writes one CHANGELOG.md per versioned package (decision #30). This page renders
// them at build time; until the first release there are none and it shows a placeholder.
const SOURCES = [
  { name: "nativecn-cli", file: "packages/cli/CHANGELOG.md" },
  { name: "Components and Theme", file: "packages/ui/CHANGELOG.md" },
];

const page = findDoc("changelog")!;

export const metadata: Metadata = { title: page.title, description: page.description };

async function readChangelog(file: string): Promise<string | null> {
  try {
    // Read at build time only (the page is static), so nothing needs tracing into the output.
    return await readFile(
      path.join(/*turbopackIgnore: true*/ process.cwd(), "../..", file),
      "utf8",
    );
  } catch {
    return null;
  }
}

/** Drops the package's own `# name` title and nests its headings under the package heading. */
function nest(markdown: string, name: string): string {
  let inFence = false;
  const body = markdown
    .split("\n")
    .filter((line) => !/^#\s/.test(line))
    .map((line) => {
      if (/^\s*```/.test(line)) inFence = !inFence;
      return !inFence && /^#{2,5}\s/.test(line) ? `#${line}` : line;
    })
    .join("\n");
  return `## ${name}\n\n${body.trim()}\n`;
}

export default async function ChangelogPage() {
  const sections = await Promise.all(
    SOURCES.map(async ({ name, file }) => {
      const source = await readChangelog(file);
      return source ? nest(source, name) : null;
    }),
  );
  const markdown = sections.filter(Boolean).join("\n");

  if (!markdown) {
    return (
      <DocShell page={page} headings={[]}>
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
    <DocShell page={page} headings={parseDoc(markdown).headings}>
      <Content />
    </DocShell>
  );
}
