"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import type { NavSection } from "@/lib/nav";
import { search, type SearchEntry } from "@/lib/search";

// ⌘K search over the docs. The index is a static JSON file built with the site
// (app/search-index.json), fetched on first open and searched in the browser.
let indexPromise: Promise<SearchEntry[]> | undefined;
function loadIndex(): Promise<SearchEntry[]> {
  indexPromise ??= fetch("/search-index.json")
    .then((res) => (res.ok ? (res.json() as Promise<SearchEntry[]>) : []))
    .catch(() => {
      indexPromise = undefined;
      return [];
    });
  return indexPromise;
}

export function SearchDialog({ nav }: { nav: NavSection[] }) {
  // With no query, every page is listed: the guides, then every Component, Block and Primitive.
  const pageEntries = useMemo(
    () =>
      nav.flatMap((section) =>
        section.pages.map((p) => ({ page: p.title, href: p.href, snippet: p.description })),
      ),
    [nav],
  );
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [active, setActive] = useState(0);
  const listId = useId();

  const open = useCallback(() => {
    dialogRef.current?.showModal();
    void loadIndex().then(setIndex);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) dialogRef.current.close();
        else open();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return pageEntries.map((p) => ({ ...p, heading: undefined }));
    return search(index ?? [], query);
  }, [index, query, pageEntries]);

  const go = (href: string) => {
    dialogRef.current?.close();
    router.push(href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      const result = results[active];
      if (result) go(result.href);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-accent md:w-56"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </g>
        </svg>
        <span className="hidden md:inline">Search docs…</span>
        <span className="sr-only md:hidden">Search docs</span>
        <kbd className="ml-auto hidden rounded border bg-background px-1.5 font-mono text-xs md:inline">
          ⌘K
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Search docs"
        onClose={() => {
          setQuery("");
          setActive(0);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
        className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl rounded-xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50"
      >
        <div className="border-b p-3">
          <input
            autoFocus
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            placeholder="Search the docs…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            className="w-full bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul id={listId} role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {index === null ? "Loading…" : "No results."}
            </li>
          )}
          {results.map((result, i) => (
            <li
              key={result.href}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => go(result.href)}
              className={`cursor-pointer rounded-md px-3 py-2 ${i === active ? "bg-accent" : ""}`}
            >
              <div className="text-sm font-medium">
                {result.page}
                {result.heading && (
                  <span className="text-muted-foreground"> › {result.heading}</span>
                )}
              </div>
              <div className="line-clamp-2 text-xs text-muted-foreground">{result.snippet}</div>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
