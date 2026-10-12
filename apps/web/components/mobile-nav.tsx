"use client";

import { useState } from "react";

import { DocsSidebar } from "@/components/docs-sidebar";
import { MobileSiteNav } from "@/components/site-nav";
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
        // The header's backdrop-blur makes it the containing block for this fixed panel, so
        // `bottom-0` would end at the header; an explicit height fills the screen below it.
        <div
          id="mobile-nav"
          className="fixed inset-x-0 top-14 z-40 h-[calc(100dvh-3.5rem)] overflow-y-auto border-t bg-background p-4"
        >
          <MobileSiteNav onNavigate={() => setOpen(false)} />
          <DocsSidebar nav={nav} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
