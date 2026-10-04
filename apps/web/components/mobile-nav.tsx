"use client";

import { useState } from "react";

import { DocsSidebar } from "@/components/docs-sidebar";
import type { NavSection } from "@/lib/nav";

export function MobileNav({ nav }: { nav: NavSection[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"}
          />
        </svg>
      </button>
      {open && (
        <div
          id="mobile-nav"
          className="fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto border-t bg-background p-4"
        >
          <DocsSidebar nav={nav} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
