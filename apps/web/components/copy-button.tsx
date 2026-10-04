"use client";

import { useState } from "react";

/**
 * Copies text produced on click. The text may need fetching first, so it is handed to the
 * clipboard as a promise where supported (Safari drops the user gesture across an await).
 */
async function copy(produce: () => string | Promise<string>): Promise<void> {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    const blob = Promise.resolve(produce()).then((t) => new Blob([t], { type: "text/plain" }));
    await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
    return;
  }
  await navigator.clipboard.writeText(await produce());
}

export function CopyButton({
  label,
  produce,
  title,
}: {
  label: string;
  produce: () => string | Promise<string>;
  title?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      title={title}
      onClick={async () => {
        try {
          await copy(produce);
          setState("copied");
        } catch {
          setState("failed");
        }
        setTimeout(() => setState("idle"), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <span aria-live="polite">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}
      </span>
    </button>
  );
}
