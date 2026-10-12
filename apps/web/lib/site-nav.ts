// The site's main links: the desktop header and the phone menu both render this one list,
// so they show the same labels in the same order (issue #165). No imports: client-safe.

export type SiteNavLink = { href: string; title: string };

export const SITE_NAV: readonly SiteNavLink[] = [
  { href: "/docs", title: "Docs" },
  { href: "/create", title: "Create" },
  { href: "/docs/changelog", title: "Changelog" },
];

/**
 * Whether `href` is the current section: the page itself or a page under it, unless a more
 * specific link claims it (the changelog sits under /docs but has its own link).
 */
export function isSiteNavActive(href: string, pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const within = (h: string) => path === h || path.startsWith(`${h}/`);
  if (!within(href)) return false;
  return !SITE_NAV.some((l) => l.href !== href && l.href.length > href.length && within(l.href));
}
