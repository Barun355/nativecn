"use client";

import { useState } from "react";

/** A copyable shell command. `wrap` breaks a long command over lines instead of truncating it. */
export function CopyCommand({ command, wrap = false }: { command: string; wrap?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={`flex gap-2 rounded-lg border bg-muted px-4 py-3 font-mono text-sm ${wrap ? "items-start" : "items-center"}`}
    >
      <span className="select-none text-muted-foreground">$</span>
      <code className={`min-w-0 flex-1 text-left ${wrap ? "" : "truncate"}`}>
        {wrap
          ? // Break only between words, never inside a flag such as --heading-font.
            command.split(" ").map((word, i) => (
              <span key={i}>
                {i > 0 ? " " : null}
                <span className="whitespace-nowrap">{word}</span>
              </span>
            ))
          : command}
      </code>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy command"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            // Clipboard access denied: the command is still selectable.
          }
        }}
        className="rounded-md px-2 py-1 font-sans text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
