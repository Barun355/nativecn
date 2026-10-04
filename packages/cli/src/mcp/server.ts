// nativecn's read-only MCP server (decision #19). It mirrors shadcn's MCP tool shape (ADR 0009):
// it reads the Registry and the project's components.json, and never writes files or runs the CLI.
import path from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  ACCENT_COLORS,
  BASE_COLORS,
  DEFAULT_PRESET,
  encodePreset,
  FONTS,
  HEADING_FONTS,
  RADII,
  STYLES,
  type Preset,
} from "preset";
import { z } from "zod";

import pkg from "../../package.json" with { type: "json" };
import { DEFAULT_ALIAS_CONFIG, type AliasConfig } from "../aliases.ts";
import { CONFIG_FILE, readConfig, type Config } from "../config.ts";
import { resolveTarget } from "../destinations.ts";
import { rewriteImports, rewriteItemImports, screenBlockFeature } from "../imports.ts";
import { aliasToDir } from "../paths.ts";
import {
  createRegistryClient,
  registryBase,
  RegistryUnreachableError,
  type RegistryClient,
  type RegistryIndexItem,
  type RegistryItem,
} from "../registry.ts";
import { planAddCommands } from "./add-command.ts";
import {
  blockPurposes,
  blockVariants,
  findExamples,
  isScreenBlock,
  kindOf,
  screenshotsOf,
  search,
  suggest,
  summarize,
} from "./catalog.ts";
import { auditChecklist } from "./checklist.ts";

/** How long a Registry answer is reused within a session. */
export const DEFAULT_CACHE_MS = 5 * 60 * 1000;
/** The Style used when there is no project (the remote endpoint, or before `init`). */
export const DEFAULT_STYLE = "vega";

export type CreateServerOptions = {
  /**
   * The project folder whose components.json the answers fit. Omit it for the remote
   * endpoint (nativecn.dev/mcp): answers then use default settings and
   * `get_project_config` is not offered.
   */
  cwd?: string;
  /** The Registry (a URL or a local folder). Defaults to NATIVECN_REGISTRY_URL or nativecn.dev/r. */
  registryUrl?: string;
  /** Registry cache lifetime in ms (default 5 minutes). */
  cacheMs?: number;
};

const KINDS = ["component", "primitive", "block", "helper", "theme"] as const;
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true } as const;

class ToolError extends Error {}

const text = (body: string): CallToolResult => ({ content: [{ type: "text", text: body }] });
const json = (data: unknown): CallToolResult => text(JSON.stringify(data, null, 2));

function failure(err: unknown): CallToolResult {
  const message =
    err instanceof RegistryUnreachableError
      ? `The nativecn Registry is unreachable, so this can't be answered: ${err.message}\nTell the user. Do not guess item names, files, props or commands.`
      : err instanceof Error
        ? err.message
        : String(err);
  return { isError: true, content: [{ type: "text", text: message }] };
}

/** Run a tool body, turning every failure into a clear tool error (never a guess). */
const safely =
  <A>(fn: (args: A) => Promise<CallToolResult>) =>
  async (args: A): Promise<CallToolResult> => {
    try {
      return await fn(args);
    } catch (err) {
      return failure(err);
    }
  };

const fence = (file: string, content: string) => {
  const lang = /\.(tsx?|jsx?)$/.exec(file)?.[1] ?? "";
  return `\`\`\`${lang}\n${content.replace(/\n$/, "")}\n\`\`\``;
};

/**
 * An item's code with the imports `add` would write (#137): the project's aliases, else those a
 * fresh `create` writes. Never the Registry's own `@/registry/…` paths, which don't resolve in an
 * app. In feature mode, an import of `{screens}` with no Feature to hand reads `<feature>`.
 */
function userCode<T extends RegistryItem>(item: T, cfg: AliasConfig | null): T {
  const aliases = cfg ?? DEFAULT_ALIAS_CONFIG;
  try {
    return rewriteItemImports(item, aliases);
  } catch {
    const feature = screenBlockFeature(item) ?? "<feature>";
    return {
      ...item,
      files: item.files?.map((f) => ({
        ...f,
        content: rewriteImports(f.content, aliases, feature),
      })),
    };
  }
}

export function createServer(options: CreateServerOptions = {}): McpServer {
  const local = options.cwd !== undefined;
  const cwd = options.cwd ? path.resolve(options.cwd) : undefined;
  const registry: RegistryClient = createRegistryClient({
    base: () => options.registryUrl ?? registryBase(),
    maxAgeMs: options.cacheMs ?? DEFAULT_CACHE_MS,
  });

  const server = new McpServer(
    { name: "nativecn", title: "nativecn", version: pkg.version },
    {
      instructions: [
        "nativecn is shadcn for Expo apps: Components, Primitives and Blocks copied into the app by nativecn-cli.",
        "These tools are read-only. Use them instead of guessing item names, props, Variants or commands.",
        "Before choosing a Block, call list_block_variants. To add items, call get_add_command and run exactly what it returns.",
        "After changing code, call get_audit_checklist and fix anything it flags.",
        local
          ? "Answers fit this project's components.json (Style, Structure, routes)."
          : "No project here: answers use the default Style (vega) and a flat Structure.",
      ].join("\n"),
    },
  );

  /** The project's components.json: null when absent (or remote). Invalid config is an error. */
  const config = (): Config | null => (cwd ? readConfig(cwd) : null);
  const styleFor = (requested?: string) => requested ?? config()?.preset.style ?? DEFAULT_STYLE;
  const index = async (style: string) => (await registry.index(style)).items ?? [];
  const kindFilter = (types?: (typeof KINDS)[number][]) => (item: RegistryIndexItem) =>
    !types?.length || types.some((t) => t === kindOf(item).toLowerCase());

  server.registerTool(
    "list_items",
    {
      title: "List nativecn items",
      description:
        "List every nativecn Component, Primitive and Block, grouped by kind and category. Use search_items to find items for a need.",
      inputSchema: {
        types: z.array(z.enum(KINDS)).optional().describe("Only these kinds of item."),
        category: z.string().optional().describe('Only items in this category, e.g. "auth".'),
      },
      annotations: { ...READ_ONLY, openWorldHint: true },
    },
    safely(async ({ types, category }) => {
      const style = styleFor();
      const items = (await index(style))
        .filter((i) => kindOf(i) !== "Example")
        .filter(kindFilter(types))
        .filter((i) => !category || (i.categories ?? []).includes(category));
      const grouped: Record<string, Record<string, ReturnType<typeof summarize>[]>> = {};
      for (const item of items) {
        const kind = `${kindOf(item)}s`;
        const cat = item.categories?.[0] ?? "general";
        ((grouped[kind] ??= {})[cat] ??= []).push(summarize(item));
      }
      return json({ style, total: items.length, items: grouped });
    }),
  );

  server.registerTool(
    "search_items",
    {
      title: "Search nativecn items",
      description:
        'Find Components, Primitives and Blocks for a need (e.g. "dark mode toggle"). Then use view_items for details and get_item_examples for usage.',
      inputSchema: {
        query: z.string().min(1).describe("What the item should do, or part of its name."),
        types: z.array(z.enum(KINDS)).optional().describe("Only these kinds of item."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("At most this many (default 20)."),
      },
      annotations: { ...READ_ONLY, openWorldHint: true },
    },
    safely(async ({ query, types, limit }) => {
      const style = styleFor();
      const pool = (await index(style))
        .filter((i) => kindOf(i) !== "Example")
        .filter(kindFilter(types));
      const found = search(pool, query).slice(0, limit ?? 20);
      if (!found.length)
        return text(
          `No nativecn items match "${query}". Call list_items to see everything; don't invent an item.`,
        );
      return json({ style, query, items: found.map(summarize) });
    }),
  );

  server.registerTool(
    "view_items",
    {
      title: "View nativecn items",
      description:
        "Show items' files, props, Variants, dependencies and docs, rendered in this project's Style (vega when there is no project). For usage examples use get_item_examples.",
      inputSchema: {
        items: z
          .array(z.string())
          .min(1)
          .max(10)
          .describe('Item names, e.g. ["button", "sign-in-01"].'),
        style: z
          .string()
          .optional()
          .describe("A Style to view instead of the project's (the project's Preset stays fixed)."),
      },
      annotations: { ...READ_ONLY, openWorldHint: true },
    },
    safely(async ({ items, style: requested }) => {
      const cfg = config();
      const style = styleFor(requested);
      const results = await Promise.allSettled(items.map((n) => registry.item(n, style)));
      const unreachable = results.find(
        (r) => r.status === "rejected" && r.reason instanceof RegistryUnreachableError,
      );
      if (unreachable?.status === "rejected") throw unreachable.reason;
      const missing = items.filter((_n, i) => results[i]!.status === "rejected");
      const found = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      if (!found.length)
        throw new ToolError(
          `Not in the Registry (Style ${style}): ${missing.join(", ")}. Use search_items to find the right names.`,
        );
      const sections = found.map((item) => renderItem(userCode(item, cfg), cfg, style));
      if (missing.length)
        sections.push(`Not found in the Registry: ${missing.join(", ")} (use search_items).`);
      if (cfg && requested && requested !== cfg.preset.style)
        sections.unshift(
          `Note: this project's Style is ${cfg.preset.style} and is fixed; \`add\` installs the ${cfg.preset.style} version.`,
        );
      return text(sections.join("\n\n---\n\n"));
    }),
  );

  function renderItem(item: RegistryItem, cfg: Config | null, style: string): string {
    const lines = [`# ${item.name}${item.title ? ` (${item.title})` : ""}`];
    lines.push(`Kind: ${kindOf(item)} · type ${item.type} · Style ${style}`);
    if (item.description) lines.push("", item.description);
    if (item.categories?.length) lines.push(`Categories: ${item.categories.join(", ")}`);
    if (item.registryDependencies?.length)
      lines.push(`Registry dependencies: ${item.registryDependencies.join(", ")}`);
    if (item.dependencies?.length) lines.push(`Packages: ${item.dependencies.join(", ")}`);
    const meta = { ...(item.meta ?? {}) };
    for (const key of ["props", "variants", "docs"] as const) {
      if (meta[key] === undefined) continue;
      const value = meta[key];
      lines.push(
        "",
        `## ${key[0]!.toUpperCase()}${key.slice(1)}`,
        typeof value === "string" ? value : JSON.stringify(value, null, 2),
      );
      delete meta[key];
    }
    if (Object.keys(meta).length) lines.push("", "## Meta", JSON.stringify(meta, null, 2));
    for (const file of item.files ?? []) {
      let where = file.target;
      if (cfg && cwd) {
        try {
          const feature = isScreenBlock(item) ? item.categories?.[0] : undefined;
          where = `${file.target} → ${resolveTarget(file.target, cfg, { cwd, feature })}`;
        } catch {
          // Feature mode without a default Feature: show the placeholder only.
        }
      }
      lines.push("", `## ${where}`, fence(file.path, file.content ?? ""));
    }
    return lines.join("\n");
  }

  server.registerTool(
    "get_item_examples",
    {
      title: "Get usage examples",
      description:
        'Ready-to-copy usage examples with their full code. Query with an item name or patterns like "button-demo", "button example".',
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe('An item name or example name, e.g. "button" or "button-demo".'),
      },
      annotations: { ...READ_ONLY, openWorldHint: true },
    },
    safely(async ({ query }) => {
      const style = styleFor();
      const names = findExamples(await index(style), query).slice(0, 5);
      if (!names.length)
        return text(
          `No examples found for "${query}". Use view_items for the item's docs, or search_items to find the item.`,
        );
      let cfg: Config | null = null;
      try {
        cfg = config();
      } catch {
        // An invalid components.json still gets examples, with the default aliases.
      }
      const examples = (await Promise.all(names.map((n) => registry.item(n, style)))).map((ex) =>
        userCode(ex, cfg),
      );
      return text(
        examples
          .map((ex) =>
            [
              `# ${ex.name}${ex.title ? ` (${ex.title})` : ""}`,
              ex.description ?? "",
              ex.registryDependencies?.length ? `Uses: ${ex.registryDependencies.join(", ")}` : "",
              ...(ex.files ?? []).map((f) => fence(f.path, f.content ?? "")),
            ]
              .filter(Boolean)
              .join("\n\n"),
          )
          .join("\n\n---\n\n"),
      );
    }),
  );

  server.registerTool(
    "get_add_command",
    {
      title: "Get the add command",
      description:
        "The exact `npx nativecn-cli@latest add …` command(s) for items, with the right --route and --feature for this project's Structure. Run what it returns; don't hand-write add commands.",
      inputSchema: {
        items: z.array(z.string()).min(1).describe('Item names, e.g. ["button", "sign-in-02"].'),
        route: z
          .string()
          .optional()
          .describe(
            'Route for a single Screen Block, e.g. "(auth)/sign-in" (default: the Block\'s suggestion).',
          ),
        feature: z
          .string()
          .optional()
          .describe("Feature for Screen Blocks in feature mode (default: the Block's category)."),
      },
      annotations: { ...READ_ONLY, openWorldHint: true },
    },
    safely(async ({ items, route, feature }) => {
      const cfg = config();
      const style = styleFor();
      const all = await index(style);
      const byName = new Map(all.map((i) => [i.name, i]));
      const unknown = items.filter((n) => !byName.has(n));
      if (unknown.length) {
        const hints = unknown.map((n) => {
          const near = suggest(all, n);
          return `${n}${near.length ? ` (did you mean ${near.join(", ")}?)` : ""}`;
        });
        throw new ToolError(`Not in the nativecn Registry: ${hints.join("; ")}.`);
      }
      const unique = [...new Set(items)];
      const resolved = await Promise.all(
        unique.map(async (n) => {
          const entry = byName.get(n)!;
          return kindOf(entry) === "Block" || !entry.files ? registry.item(n, style) : entry;
        }),
      );
      const plan = planAddCommands(resolved, cfg, { route, feature, hasProject: local });
      return json({
        ...(cfg ? { structure: cfg.structure, style } : {}),
        commands: plan.commands,
        notes: plan.notes,
      });
    }),
  );

  if (local && cwd) {
    server.registerTool(
      "get_project_config",
      {
        title: "Get the project config",
        description:
          "This project's components.json (Preset, Structure, aliases, routes) and the folders each Destination resolves to.",
        inputSchema: {},
        annotations: { ...READ_ONLY, openWorldHint: false },
      },
      safely(async () => {
        const cfg = readConfig(cwd);
        if (!cfg)
          throw new ToolError(
            `No ${CONFIG_FILE} in ${cwd}. Set nativecn up with \`npx nativecn-cli@latest init\` (or \`create\` for a new app).`,
          );
        const folders: Record<string, string> = {};
        for (const key of ["components", "hooks", "utils", "theme"] as const)
          folders[key] = aliasToDir(cfg.aliases[key], cwd);
        if (cfg.structure === "flat") folders.screens = aliasToDir(cfg.aliases.screens, cwd);
        else
          folders.screens = `${aliasToDir(cfg.aliases.features ?? "@/features", cwd)}/<feature>/screens`;
        folders.app = cfg.routes;
        return json({ cwd, config: cfg, folders });
      }),
    );
  }

  server.registerTool(
    "get_audit_checklist",
    {
      title: "Get the audit checklist",
      description:
        "After creating or changing code, get the checklist from the nativecn Rules (Tokens only, no Alert.alert, placement, accessibility) and fix anything that fails.",
      inputSchema: {},
      annotations: { ...READ_ONLY, openWorldHint: false },
    },
    safely(async () => {
      let cfg: Config | null = null;
      try {
        cfg = config();
      } catch {
        // An invalid components.json still gets the generic checklist.
      }
      return text(auditChecklist(cfg));
    }),
  );

  server.registerTool(
    "list_block_variants",
    {
      title: "List Block Variants",
      description:
        'Compare the Block Variants for a purpose (e.g. "sign-in", "sign-up", "drawer", or a category like "auth") before choosing one: what makes each different, plus screenshot links when they exist.',
      inputSchema: {
        purpose: z
          .string()
          .min(1)
          .describe('What the Block is for, e.g. "sign-in", "login", "drawer", "auth".'),
      },
      annotations: { ...READ_ONLY, openWorldHint: true },
    },
    safely(async ({ purpose }) => {
      const style = styleFor();
      const all = await index(style);
      const variants = blockVariants(all, purpose);
      if (!variants.length) {
        const purposes = blockPurposes(all);
        return text(
          `No Blocks for "${purpose}". ${purposes.length ? `Purposes with Blocks: ${purposes.join(", ")}.` : "The Registry has no Blocks yet."}`,
        );
      }
      return json({
        purpose,
        style,
        variants: variants.map((b) => {
          const difference = b.meta?.difference ?? b.meta?.design;
          const shots = screenshotsOf(b);
          return {
            name: b.name,
            ...(b.title ? { title: b.title } : {}),
            kind: isScreenBlock(b) ? "Screen Block" : "Block",
            ...(typeof difference === "string"
              ? { different: difference }
              : b.description
                ? { different: b.description }
                : {}),
            ...(b.categories?.length ? { categories: b.categories } : {}),
            ...(typeof b.meta?.route === "string" ? { suggestedRoute: b.meta.route } : {}),
            ...(shots ? { screenshots: shots } : {}),
          };
        }),
        next: "Pick one, then call get_add_command with its name.",
      });
    }),
  );

  server.registerTool(
    "list_preset_options",
    {
      title: "List Preset options",
      description:
        "Every Preset setting nativecn offers (Style, base colour, accent colour, radius, body and heading font) with the defaults. Use build_preset_code to turn a choice into a Preset code.",
      inputSchema: {},
      annotations: { ...READ_ONLY, openWorldHint: true },
    },
    safely(async () => {
      const options = await registry.presets();
      let current: Config["preset"] | undefined;
      try {
        current = config()?.preset;
      } catch {
        current = undefined;
      }
      return json({
        options: {
          style: options.style,
          baseColor: options.baseColor,
          accentColor: options.accentColor,
          radius: options.radius,
          ...(options.radiusBase ? { radiusBase: options.radiusBase } : {}),
          bodyFont: options.bodyFont,
          headingFont: options.headingFont,
        },
        defaults: DEFAULT_PRESET,
        notes: [
          'headingFont "inherit" means the same font as the body.',
          'radius "default" keeps the Style\'s own radius; radiusBase lists the others in points.',
          "A Preset is chosen at create/init and fixed for the project.",
        ],
        ...(current ? { thisProject: current } : {}),
      });
    }),
  );

  server.registerTool(
    "build_preset_code",
    {
      title: "Build a Preset code",
      description:
        "Turn Preset settings into a short code and the create/init commands. Unset settings take their defaults. Call list_preset_options for the choices.",
      inputSchema: {
        style: z.enum(STYLES).optional(),
        baseColor: z.enum(BASE_COLORS).optional(),
        accentColor: z.enum(ACCENT_COLORS).optional(),
        radius: z.enum(RADII).optional(),
        bodyFont: z.enum(FONTS).optional(),
        headingFont: z
          .enum(HEADING_FONTS)
          .optional()
          .describe('"inherit" = same as the body font.'),
      },
      annotations: { ...READ_ONLY, openWorldHint: false },
    },
    safely(async (settings) => {
      const preset: Preset = { ...DEFAULT_PRESET };
      for (const [k, v] of Object.entries(settings))
        if (v !== undefined) (preset as Record<string, string>)[k] = v as string;
      const code = encodePreset(preset);
      const flags = [
        `--style ${preset.style}`,
        `--base ${preset.baseColor}`,
        `--accent ${preset.accentColor}`,
        `--radius ${preset.radius}`,
        `--font ${preset.bodyFont}`,
        `--heading-font ${preset.headingFont}`,
      ].join(" ");
      let cfg: Config | null = null;
      try {
        cfg = config();
      } catch {
        cfg = null;
      }
      return json({
        code,
        preset,
        commands: {
          create: `npx nativecn-cli@latest create my-app --preset ${code}`,
          init: `npx nativecn-cli@latest init --preset ${code}`,
          longFlags: `npx nativecn-cli@latest create my-app ${flags}`,
        },
        ...(cfg
          ? {
              note: `This project's Preset (${cfg.preset.code}) is fixed; a new code is for a new app or another project.`,
            }
          : {}),
      });
    }),
  );

  return server;
}
