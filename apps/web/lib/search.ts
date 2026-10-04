// Client-side docs search. The index is built at build time (app/search-index.json) and
// searched in the browser, so ⌘K needs no external service.

export type SearchEntry = {
  /** Page title, e.g. "CLI". */
  page: string;
  /** Section heading, absent for a page's intro. */
  heading?: string;
  /** Link to the page, with `#id` for a section. */
  href: string;
  /** The section's plain text. */
  text: string;
};

export type SearchResult = SearchEntry & { score: number; snippet: string };

const SNIPPET_RADIUS = 60;

function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1 && count < 5) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function snippetFor(text: string, tokens: string[]): string {
  const lower = text.toLowerCase();
  const hit = tokens.map((t) => lower.indexOf(t)).find((i) => i !== -1) ?? 0;
  const start = Math.max(0, hit - SNIPPET_RADIUS);
  const end = Math.min(text.length, hit + SNIPPET_RADIUS * 2);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/**
 * Every query word must appear in the entry's page title, heading or text. Matches in the
 * title outrank the heading, which outranks the text.
 */
export function search(entries: SearchEntry[], query: string, limit = 12): SearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];
  for (const entry of entries) {
    const page = entry.page.toLowerCase();
    const heading = entry.heading?.toLowerCase() ?? "";
    const text = entry.text.toLowerCase();

    let score = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const inPage = page.includes(token);
      const inHeading = heading.includes(token);
      const inText = countOccurrences(text, token);
      if (!inPage && !inHeading && inText === 0) {
        matchedAll = false;
        break;
      }
      score += (inPage ? 10 : 0) + (inHeading ? 6 : 0) + inText;
      if (page === token || heading === token) score += 5;
    }
    if (!matchedAll) continue;
    // A page's intro is the best target when only its title matched.
    if (!entry.heading) score += 1;
    results.push({ ...entry, score, snippet: snippetFor(entry.text, tokens) });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
