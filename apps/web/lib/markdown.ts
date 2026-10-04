// Turns a docs page's MDX source into headings (for "On this page") and plain-text sections
// (for search). Pure and browser-safe; ids match what rehype-slug gives the rendered headings.
import GithubSlugger from "github-slugger";

export type Heading = { depth: 2 | 3; text: string; id: string };
export type Section = { heading?: Heading; text: string };

/** Strips inline Markdown/MDX syntax, leaving the text a reader sees. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|[\s(])[*_]([^*_\s][^*_]*?)[*_](?=[\s).,:;!?]|$)/g, "$1$2")
    .replace(/\\([\\`*_{}[\]()#+\-.!|<>])/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Splits a page into sections, one before the first heading and one per `##`/`###` heading. */
export function parseDoc(source: string): { headings: Heading[]; sections: Section[] } {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  const sections: Section[] = [{ text: "" }];
  let inFence = false;

  const push = (line: string) => {
    const text = line.trim();
    if (!text) return;
    const current = sections[sections.length - 1]!;
    current.text = current.text ? `${current.text} ${text}` : text;
  };

  for (const raw of source.split("\n")) {
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      push(raw);
      continue;
    }
    if (/^(import|export)\s/.test(raw)) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(raw);
    if (match) {
      const text = plainText(match[2]!).trim();
      const heading: Heading = {
        depth: match[1]!.length as 2 | 3,
        text,
        id: slugger.slug(text),
      };
      headings.push(heading);
      sections.push({ heading, text: "" });
      continue;
    }

    // Table separator rows carry no text; other table rows keep their cells.
    if (/^\s*\|?\s*:?-{3,}/.test(raw)) continue;
    push(plainText(raw.replace(/^\s*>\s?/, "").replace(/\|/g, " ")).replace(/\s+/g, " "));
  }

  return { headings, sections: sections.filter((s) => s.heading || s.text) };
}
