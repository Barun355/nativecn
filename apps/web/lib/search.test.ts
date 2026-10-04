import assert from "node:assert/strict";
import { test } from "node:test";

import { parseDoc, plainText } from "./markdown.ts";
import { search, type SearchEntry } from "./search.ts";

test("plainText strips inline Markdown", () => {
  assert.equal(
    plainText("Run **`npx nativecn-cli init`** — see [the CLI](/docs/cli)."),
    "Run npx nativecn-cli init — see the CLI.",
  );
});

test("parseDoc gives headings the ids rehype-slug renders", () => {
  const { headings, sections } = parseDoc(
    [
      "Intro text.",
      "",
      "## The `components.json` file",
      "",
      "```sh",
      "## not a heading",
      "```",
      "",
      "### Flags",
      "",
      "| Flag | Meaning |",
      "|---|---|",
      "| `-y` | no prompts |",
      "",
      "## Flags",
    ].join("\n"),
  );
  assert.deepEqual(
    headings.map((h) => [h.depth, h.text, h.id]),
    [
      [2, "The components.json file", "the-componentsjson-file"],
      [3, "Flags", "flags"],
      [2, "Flags", "flags-1"],
    ],
  );
  assert.equal(sections[0]?.text, "Intro text.");
  assert.equal(sections[1]?.text, "## not a heading");
  assert.equal(sections[2]?.text, "Flag Meaning -y no prompts");
});

const entries: SearchEntry[] = [
  { page: "CLI", href: "/docs/cli", text: "Every command." },
  { page: "CLI", heading: "add", href: "/docs/cli#add", text: "Use --dry-run to preview." },
  { page: "Theming", heading: "Scheme", href: "/docs/theming#scheme", text: "Light or dark." },
];

test("search requires every word and ranks titles first", () => {
  assert.deepEqual(
    search(entries, "cli").map((r) => r.href),
    ["/docs/cli", "/docs/cli#add"],
  );
  assert.deepEqual(
    search(entries, "dark scheme").map((r) => r.href),
    ["/docs/theming#scheme"],
  );
  assert.deepEqual(search(entries, "dark cli"), []);
  assert.deepEqual(search(entries, "  "), []);
});

test("search returns a snippet around the match", () => {
  assert.equal(search(entries, "dry-run")[0]?.snippet, "Use --dry-run to preview.");
});
