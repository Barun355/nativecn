// The "Copy to LLM" bundle for a Component or Block page (decision #27): description, add command,
// props, usage examples and source, as one prompt-ready markdown block. Pure and browser-safe;
// built from the same Registry item JSON the CLI installs and the MCP serves, with its imports
// rewritten by the CLI's own rewriteImports.
import { planAddCommands } from "../../../packages/cli/src/mcp/add-command.ts";
import { a11yOf, isScreenBlock, kindOf } from "../../../packages/cli/src/mcp/catalog.ts";
import { rewriteItemImports } from "../../../packages/cli/src/imports.ts";
import type { RegistryIndexItem, RegistryItem } from "../../../packages/cli/src/registry.ts";

/**
 * An item's own example items: its `meta.examples` and `<item>-…` examples (`<item>-demo`).
 * Unlike the MCP's findExamples there is no fuzzy fallback, which would put the drawer
 * Component's demo on the drawer-01 Block's page.
 */
export function exampleNames(index: RegistryIndexItem[], name: string): string[] {
  const item = index.find((i) => i.name === name);
  if (!item || kindOf(item) === "Example") return [];
  const isExample = (n: string) => {
    const ex = index.find((i) => i.name === n);
    return ex !== undefined && kindOf(ex) === "Example";
  };
  const listed = Array.isArray(item.meta?.examples) ? item.meta.examples.map(String) : [];
  const named = index.filter((i) => i.name.startsWith(`${name}-`)).map((i) => i.name);
  return [...new Set([...listed, ...named])].filter(isExample);
}

const fence = (file: string, content: string) => {
  const lang = /\.(tsx?|jsx?|json)$/.exec(file)?.[1] ?? (/^\w+$/.test(file) ? file : "");
  return `\`\`\`${lang}\n${content.replace(/\n$/, "")}\n\`\`\``;
};

function propsSection(props: unknown): string {
  if (props && typeof props === "object" && !Array.isArray(props)) {
    const entries = Object.entries(props as Record<string, unknown>);
    // { Export: { prop: description } }: one table per export.
    if (entries.length && entries.every(([, v]) => v && typeof v === "object" && !Array.isArray(v)))
      return entries.map(([name, rows]) => `### ${name}\n\n${propsSection(rows)}`).join("\n\n");
    const rows = Object.entries(props as Record<string, unknown>).map(
      ([name, type]) =>
        `| \`${name}\` | ${(typeof type === "string" ? type : JSON.stringify(type)).replace(/\|/g, "\\|")} |`,
    );
    return ["| Prop | Type |", "|---|---|", ...rows].join("\n");
  }
  return typeof props === "string" ? props : fence("props.json", JSON.stringify(props, null, 2));
}

export function itemBundle({
  item,
  examples = [],
  style = "vega",
}: {
  item: RegistryItem;
  examples?: RegistryItem[];
  style?: string;
}): string {
  // Code is shown with the imports `add` writes into a fresh `create` app (#137).
  item = rewriteItemImports(item);
  examples = examples.map((ex) => rewriteItemImports(ex));
  const out = [`# ${item.title ? `${item.title} (${item.name})` : item.name}`];
  if (item.description) out.push("", item.description);
  out.push(
    "",
    `nativecn Registry item, Style ${style}. Source: https://nativecn.dev/r/styles/${style}/${item.name}.json`,
  );

  // The same command the MCP's get_add_command gives (a Screen Block gets its suggested --route).
  const plan = planAddCommands([item], null, { hasProject: false });
  out.push("", "## Add", "", fence("sh", plan.commands.map((c) => c.command).join("\n")));
  if (isScreenBlock(item))
    out.push(
      "",
      "In a project with the feature Structure, also pass `--feature <name>`. `add` never overwrites an existing route file.",
    );
  const deps = [
    item.registryDependencies?.length
      ? `Also installs: ${item.registryDependencies.join(", ")}.`
      : "",
    item.dependencies?.length ? `Packages: ${item.dependencies.join(", ")}.` : "",
  ].filter(Boolean);
  if (deps.length) out.push("", deps.join(" "));

  const meta = item.meta ?? {};
  if (meta.props !== undefined) out.push("", "## Props", "", propsSection(meta.props));
  if (Array.isArray(meta.variants) && meta.variants.length)
    out.push("", "## Variants", "", meta.variants.map((v) => `- \`${String(v)}\``).join("\n"));
  else if (meta.variants && typeof meta.variants === "object") {
    const lines = Object.entries(meta.variants as Record<string, unknown>)
      .filter(([, v]) => Array.isArray(v) && v.length)
      .map(
        ([prop, v]) =>
          `- \`${prop}\`: ${(v as unknown[]).map((x) => `\`${String(x)}\``).join(", ")}`,
      );
    if (lines.length) out.push("", "## Variants", "", lines.join("\n"));
  }
  if (typeof meta.difference === "string")
    out.push("", "## What makes it different", "", meta.difference);
  // meta.a11y (#138); without it, the accessibility notes stay inside meta.docs below.
  const a11y = a11yOf(item);
  if (a11y) out.push("", "## Accessibility", "", a11y.map((s) => `- ${s}`).join("\n"));
  if (typeof meta.docs === "string") out.push("", "## Notes", "", meta.docs);

  if (examples.length) {
    out.push("", "## Usage examples");
    for (const ex of examples) {
      out.push("", `### ${ex.title ?? ex.name}`);
      if (ex.description) out.push("", ex.description);
      for (const file of ex.files ?? []) out.push("", fence(file.path, file.content ?? ""));
    }
  }

  if (item.files?.length) {
    out.push("", "## Source");
    for (const file of item.files)
      out.push("", `### ${file.target}`, "", fence(file.path, file.content ?? ""));
  }
  return `${out.join("\n")}\n`;
}
