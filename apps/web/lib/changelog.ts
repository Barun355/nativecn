// The Changelog page's markdown, shared by the page and its `.md` twin. Changesets writes one
// CHANGELOG.md per versioned package (decision #30); until the first release there are none.
import { readFile } from "node:fs/promises";
import path from "node:path";

const SOURCES = [
  { name: "nativecn-cli", file: "packages/cli/CHANGELOG.md" },
  { name: "Components and Theme", file: "packages/ui/CHANGELOG.md" },
];

/** Shown (and copied) while nothing has been released. */
export const UNRELEASED =
  "nativecn has not been released yet. The first release is 0.1.0. From then on, every release's notes appear here, generated from the same Changesets entries as each package's `CHANGELOG.md` and the GitHub Release.";

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

/** Every package's release notes as one markdown document; "" before the first release. */
export async function changelogMarkdown(): Promise<string> {
  const sections = await Promise.all(
    SOURCES.map(async ({ name, file }) => {
      const source = await readChangelog(file);
      return source ? nest(source, name) : null;
    }),
  );
  return sections.filter(Boolean).join("\n");
}
