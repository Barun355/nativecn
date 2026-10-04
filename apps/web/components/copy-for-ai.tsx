"use client";

import { CopyButton } from "@/components/copy-button";

/** "Copy for AI" on every docs page: the page as clean markdown, plus a link to its `.md` twin. */
export function CopyForAi({ markdown, mdHref }: { markdown: string; mdHref: string }) {
  return (
    <div className="flex items-center gap-3">
      <CopyButton
        label="Copy for AI"
        title="Copy this page as markdown, ready to paste into an agent"
        produce={() => markdown}
      />
      <a href={mdHref} className="text-xs text-muted-foreground hover:text-foreground">
        View as Markdown
      </a>
    </div>
  );
}
