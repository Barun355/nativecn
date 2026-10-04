"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { docHref, docsNav } from "@/lib/docs-config";

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Docs" className="space-y-6 text-sm">
      {docsNav.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-2 font-medium">{section.title}</p>
          <ul className="space-y-0.5">
            {section.pages.map((page) => {
              const href = docHref(page.slug);
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-2 py-1.5 ${
                      active
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {page.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
