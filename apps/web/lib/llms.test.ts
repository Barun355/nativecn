import assert from "node:assert/strict";
import { test } from "node:test";

import type { DocPage } from "./docs-config.ts";
import { itemBundle } from "./llm-bundle.ts";
import {
  llmsFullTxt,
  llmsTxt,
  mdPath,
  mdxToMarkdown,
  pageMarkdown,
  type LlmsItem,
} from "./llms.ts";

const pages: DocPage[] = [
  { slug: "", title: "Introduction", description: "What nativecn is." },
  { slug: "cli", title: "CLI", description: "Every command." },
];

const items: LlmsItem[] = [
  { name: "pressable", type: "registry:ui", description: "Pressed look.", kind: "Primitive" },
  {
    name: "button",
    type: "registry:ui",
    description: "A button.",
    kind: "Component",
    href: "/docs/components/button",
  },
  { name: "button-demo", type: "registry:example", kind: "Example" },
];

test("mdPath appends .md to the page URL", () => {
  assert.equal(mdPath(""), "/docs.md");
  assert.equal(mdPath("installation"), "/docs/installation.md");
});

test("mdxToMarkdown drops MDX-only lines, keeps code and makes links absolute", () => {
  const source = [
    'import { X } from "@/x";',
    "",
    "See [the CLI](/docs/cli) and [GitHub](https://github.com).",
    "",
    '<CopyToLlm item="button" />',
    "",
    "```tsx",
    'import { createStyles } from "@/theme";',
    "<ThemeProvider />",
    "```",
  ].join("\n");
  assert.equal(
    mdxToMarkdown(source),
    [
      "See [the CLI](https://nativecn.dev/docs/cli) and [GitHub](https://github.com).",
      "",
      "```tsx",
      'import { createStyles } from "@/theme";',
      "<ThemeProvider />",
      "```",
    ].join("\n"),
  );
});

test("pageMarkdown puts the title and description first", () => {
  assert.equal(
    pageMarkdown({ page: pages[1]!, body: "## add\n\nAdds items.\n" }),
    "# CLI\n\n> Every command.\n\n## add\n\nAdds items.\n",
  );
});

test("llms.txt indexes every page's .md twin and the Registry items by kind", () => {
  const txt = llmsTxt({ pages, items });
  assert.match(txt, /^# nativecn\n\n> /);
  assert.ok(txt.includes("- [Introduction](https://nativecn.dev/docs.md): What nativecn is."));
  assert.ok(txt.includes("- [CLI](https://nativecn.dev/docs/cli.md): Every command."));
  // Components before Primitives; Examples are left out.
  const components = txt.indexOf("## Components");
  const primitives = txt.indexOf("## Primitives");
  assert.ok(components !== -1 && primitives > components);
  // An item with a docs page links to its .md twin; one without links to its Registry JSON.
  assert.ok(txt.includes("- [button](https://nativecn.dev/docs/components/button.md): A button."));
  assert.ok(txt.includes("- [pressable](https://nativecn.dev/r/styles/vega/pressable.json)"));
  assert.ok(!txt.includes("button-demo"));
  assert.ok(txt.includes("https://nativecn.dev/llms-full.txt"));
});

test("llms-full.txt concatenates every page, nesting its headings", () => {
  const txt = llmsFullTxt({
    docs: [
      { page: pages[0]!, body: "Intro text." },
      { page: pages[1]!, body: "## add\n\n```sh\n# a comment\n```" },
    ],
    items,
  });
  assert.ok(txt.includes("## Introduction\n\nSource: https://nativecn.dev/docs\n"));
  assert.ok(txt.includes("## CLI\n\nSource: https://nativecn.dev/docs/cli\n"));
  assert.ok(txt.includes("### add"));
  assert.ok(txt.includes("# a comment"), "code fences are not demoted");
  assert.ok(txt.indexOf("## Introduction") < txt.indexOf("## CLI"));
  assert.ok(txt.includes("## Registry items"));
});

test("itemBundle has the description, add command, props, examples and source", () => {
  const bundle = itemBundle({
    item: {
      name: "button",
      type: "registry:ui",
      title: "Button",
      description: "A pressable button.",
      registryDependencies: ["pressable"],
      meta: {
        props: { variant: "default | ghost" },
        docs: "Icon-only Buttons need aria-label.",
        a11y: ["role button.", "The tap area is extended to 48."],
      },
      files: [
        {
          path: "components/button.tsx",
          type: "registry:ui",
          target: "{components}/button.tsx",
          content: "export const Button = 1;\n",
        },
      ],
    },
    examples: [
      {
        name: "button-demo",
        type: "registry:example",
        files: [
          {
            path: "examples/button-demo.tsx",
            type: "registry:example",
            target: "",
            content: "<Button />",
          },
        ],
      },
    ],
  });
  assert.ok(bundle.startsWith("# Button (button)\n\nA pressable button."));
  assert.ok(bundle.includes("npx nativecn-cli@latest add button"));
  assert.ok(bundle.includes("Also installs: pressable."));
  assert.ok(bundle.includes("| `variant` | default \\| ghost |"));
  assert.ok(bundle.includes("Icon-only Buttons need aria-label."));
  assert.ok(
    bundle.includes("## Accessibility\n\n- role button.\n- The tap area is extended to 48."),
  );
  assert.ok(bundle.includes("### button-demo\n\n```tsx\n<Button />\n```"));
  assert.ok(
    bundle.includes("### {components}/button.tsx\n\n```tsx\nexport const Button = 1;\n```"),
  );
});
