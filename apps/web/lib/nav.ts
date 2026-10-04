// The docs navigation as client components receive it: links only, no Registry metadata.
import { docHref, docsNav } from "./docs-config.ts";

export type NavLink = { href: string; title: string; description: string };
export type NavSection = { title: string; pages: NavLink[] };

/** Server-side: the sidebar sections, for passing to client components as props. */
export function navSections(): NavSection[] {
  return docsNav.map((section) => ({
    title: section.title,
    pages: section.pages.map((p) => ({
      href: docHref(p.slug),
      title: p.title,
      description: p.description,
    })),
  }));
}
