// The "Copy to LLM" bundle for a Component or Block page (decision #27): description, add command,
// props, usage examples and source, as one prompt-ready markdown block. Pure and browser-safe;
// built from the same Registry item JSON the CLI installs and the MCP serves.
import type { RegistryItem } from "../../../packages/cli/src/registry.ts";

const fence = (file: string, content: string) => {
  const lang = /\.(tsx?|jsx?|json)$/.exec(file)?.[1] ?? "";
  return `\`\`\`${lang}\n${content.replace(/\n$/, "")}\n\`\`\``;
};

function propsSection(props: unknown): string {
  if (props && typeof props === "object" && !Array.isArray(props)) {
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
  const out = [`# ${item.title ? `${item.title} (${item.name})` : item.name}`];
  if (item.description) out.push("", item.description);
  out.push(
    "",
    `nativecn Registry item, Style ${style}. Source: https://nativecn.dev/r/styles/${style}/${item.name}.json`,
  );

  out.push("", "## Add", "", fence("sh", `npx nativecn-cli@latest add ${item.name}`));
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
