import Link from "next/link";
import type { ReactNode } from "react";

import { docHref, neighbours, type DocPage } from "@/lib/docs-config";
import type { Heading } from "@/lib/markdown";

/** The frame around every docs page: title, body, pager and "On this page". */
export function DocShell({
  page,
  headings,
  children,
}: {
  page: DocPage;
  headings: Heading[];
  children: ReactNode;
}) {
  const { prev, next } = neighbours(page.slug);
  return (
    <div className="flex gap-10">
      <main id="main" className="min-w-0 flex-1 py-8 md:px-4 lg:py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{page.description}</p>
          <div className="docs-prose prose prose-neutral mt-8 max-w-none dark:prose-invert">
            {children}
          </div>
          <nav
            aria-label="Pager"
            className="mt-12 flex justify-between gap-4 border-t pt-6 text-sm"
          >
            {prev ? (
              <Link href={docHref(prev.slug)} className="hover:underline">
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={docHref(next.slug)} className="hover:underline">
                {next.title} →
              </Link>
            )}
          </nav>
        </div>
      </main>
      {headings.length > 0 && (
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 text-sm xl:block">
          <p className="mb-2 font-medium">On this page</p>
          <ul className="space-y-1.5">
            {headings.map((h) => (
              <li key={h.id} className={h.depth === 3 ? "pl-3" : undefined}>
                <a href={`#${h.id}`} className="text-muted-foreground hover:text-foreground">
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
