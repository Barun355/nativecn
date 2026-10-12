"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isSiteNavActive, SITE_NAV } from "@/lib/site-nav";

/** The main links in the desktop header (hidden below md, where the phone menu has them). */
export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-4 text-sm md:flex">
      {SITE_NAV.map((link) => {
        const active = isSiteNavActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
          >
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
}

/** The same links at the top of the phone menu, styled like the docs sidebar below them. */
export function MobileSiteNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="mb-6 border-b pb-4 text-sm">
      <ul className="space-y-0.5">
        {SITE_NAV.map((link) => {
          const active = isSiteNavActive(link.href, pathname);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`block rounded-md px-2 py-1.5 ${
                  active
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
