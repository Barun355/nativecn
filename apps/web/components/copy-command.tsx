"use client";

import { useState } from "react";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted px-4 py-3 font-mono text-sm">
      <span className="select-none text-muted-foreground">$</span>
      <code className="flex-1 truncate text-left">{command}</code>
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
