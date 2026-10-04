import type { ReactNode } from "react";

import { DocsSidebar } from "@/components/docs-sidebar";
import { navSections } from "@/lib/nav";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-screen-2xl px-4 md:px-6">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 pr-4 md:block">
        <DocsSidebar nav={navSections()} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
