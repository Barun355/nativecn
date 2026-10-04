import fs from "node:fs";
import path from "node:path";

import * as p from "@clack/prompts";
import { applyEdits, modify } from "jsonc-parser";
import {
  DEFAULT_PRESET,
  PRESET_OPTIONS,
  decodePreset,
  encodePreset,
  type Preset,
  type PresetField,
} from "preset";

import { CONFIG_FILE, writeConfig, type Config } from "../config.ts";
import { readTsconfigPaths } from "../paths.ts";
import { fetchItem, RegistryError } from "../registry.ts";
import { addFontPlugin, type FontPluginResult } from "../utils/app-config.ts";
import { checkExpoApp, overlappingThemeFiles } from "../utils/expo.ts";
import { detectPackageManager, runInstall } from "../utils/pm.ts";
import {
  composeColorsFile,
  composeTokensFile,
  downloadFonts,
  presetColors,
  presetFonts,
  presetRadiusBase,
  type FontDownload,
} from "../utils/preset-theme.ts";
import { fetchStarter, gitInitialCommit, renameStarter, type GitResult } from "../utils/starter.ts";
import { add, type AddResult } from "./add.ts";
import { AGENTS, agents, type AgentName, type AgentsResult } from "./agents.ts";

export { AGENTS };
export type Agent = AgentName;

/** Items every nativecn app gets: the Theme and what the root Layout renders (#16, #105). */
export const BASE_ITEMS = ["theme", "portal", "keyboard", "toast"];
/** Registry Items the Starter's promo Screen uses (#25). */
export const STARTER_ITEMS = [
  "text",
  "icon",
  "button",
  "badge",
  "card",
  "separator",
  "container",
  "segmented-tabs",
  "scheme-switcher",
];

export type InitOptions = {
  cwd: string;
  /** "create" forces a new app (the `create` command); otherwise it is chosen from the folder. */
  mode?: "init" | "create";
  name?: string;
  preset?: string;
  yes?: boolean;
  defaults?: boolean;
  force?: boolean;
  silent?: boolean;
  style?: string;
  base?: string;
  accent?: string;
  radius?: string;
  font?: string;
  headingFont?: string;
  folderFeat?: boolean;
  agents?: string;
};

type ThemeFileStatus = "written" | "kept" | "missing";

export type InitResult = {
  mode: "init" | "create";
  /** The project folder (for create, the new app's folder). */
  cwd: string;
  config: Config;
  items: { requested: string[]; missing: string[]; add?: AddResult };
  theme: { colors: ThemeFileStatus; tokens: ThemeFileStatus };
  fonts: FontDownload;
  fontPlugin: FontPluginResult;
  tsconfig: "present" | "added" | "declined" | "missing";
  overlaps: string[];
  layout: { file: string; snippet: string; written: boolean };
  git?: GitResult;
  /** The Agent Kit written for the chosen agents (none when no agents were chosen). */
  agentKit?: AgentsResult;
};

export class InitError extends Error {}

const isInteractive = (opts: InitOptions) =>
  !opts.yes &&
  !opts.defaults &&
  !opts.silent &&
  Boolean(process.stdin.isTTY) &&
  Boolean(process.stdout.isTTY);

function cancelled<T>(value: T): Exclude<T, symbol> {
  if (p.isCancel(value)) throw new InitError("Cancelled.");
  return value as Exclude<T, symbol>;
}

export async function init(items: string[], opts: InitOptions): Promise<InitResult> {
  const interactive = isInteractive(opts);
  const log = (msg: string) => !opts.silent && p.log.message(msg);
  const info = (msg: string) => !opts.silent && p.log.info(msg);
  const warn = (msg: string) => !opts.silent && p.log.warn(msg);

  const root = path.resolve(opts.cwd);
  const mode =
    opts.mode === "create" || opts.name || !fs.existsSync(path.join(root, "package.json"))
      ? "create"
      : "init";

  // Step 0: always first, before anything is created or written. The Starter is SDK 57+.
  if (mode === "init") {
    checkExpoApp(root);
    if (fs.existsSync(path.join(root, CONFIG_FILE)) && !opts.force)
      throw new InitError(
        `${CONFIG_FILE} already exists: nativecn is set up here. Use \`nativecn-cli add\`, or --force to write ${CONFIG_FILE} again.`,
      );
  }

  // Prompts or flags: name → Preset → structure → agents.
  let name = opts.name;
  if (mode === "create" && !name) {
    name = interactive
      ? cancelled(
          await p.text({
            message: "What is your app named?",
            initialValue: "my-app",
            validate: (v) => (validAppName(v ?? "") ? undefined : "Use letters, digits, . - _"),
          }),
        )
      : "my-app";
  }
  if (name !== undefined && !validAppName(name))
    throw new InitError(`"${name}" is not a valid app name (letters, digits, ".", "-", "_").`);
  const preset = await resolvePreset(opts, interactive);
  const structure: Config["structure"] = opts.folderFeat
    ? "feature"
    : interactive
      ? cancelled(
          await p.select({
            message: "Folder structure",
            options: [
              { value: "flat" as const, label: "flat", hint: "Expo's folders" },
              { value: "feature" as const, label: "feature", hint: "plus src/features/<feature>" },
            ],
            initialValue: "flat" as const,
          }),
        )
      : "flat";
  const agents = await resolveAgents(opts, interactive);
  const code = encodePreset(preset);

  log(
    [
      mode === "create" ? `Creating ${name}` : `Setting up nativecn in ${root}`,
      `  Preset:    ${code} (${preset.style} · ${preset.baseColor} · ${preset.accentColor} · radius ${preset.radius} · ${preset.bodyFont}${preset.headingFont === "inherit" ? "" : ` / headings ${preset.headingFont}`})`,
      `  Structure: ${structure}`,
      `  Agents:    ${agents.length ? agents.join(", ") : "none"}`,
    ].join("\n"),
  );

  // create: fetch the Starter, rename it and install it.
  const cwd = mode === "create" ? path.resolve(root, name!) : root;
  if (mode === "create") {
    if (fs.existsSync(cwd) && fs.readdirSync(cwd).length > 0)
      throw new InitError(`${cwd} already exists and is not empty.`);
    fs.mkdirSync(cwd, { recursive: true });
    fetchStarter(cwd, info);
    renameStarter(cwd, name!);
    const pm = detectPackageManager(cwd);
    if (!opts.silent && !process.env.NATIVECN_SKIP_INSTALL) info(`Installing with ${pm}…`);
    runInstall([{ command: pm, args: ["install"] }], cwd);
  }

  // Aliases and routes; apps without src/ point the aliases at root folders (#14).
  const srcMode =
    fs.existsSync(path.join(cwd, "src", "app")) ||
    (!fs.existsSync(path.join(cwd, "app")) && fs.existsSync(path.join(cwd, "src")));
  const tsconfig = await ensureAtAlias(cwd, srcMode ? "./src/*" : "./*", interactive, opts);
  if (tsconfig === "declined" || tsconfig === "missing")
    warn(
      `No "@/*" path in tsconfig.json: nativecn's imports use @/…; add "@/*": ["${srcMode ? "./src/*" : "./*"}"] to compilerOptions.paths.`,
    );

  const config: Config = {
    version: 1,
    preset: { code, ...preset },
    structure,
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      utils: "@/utils",
      theme: "@/theme",
      screens: "@/screens",
      ...(structure === "feature" ? { features: "@/features" } : {}),
    },
    routes: srcMode ? "src/app" : "app",
    agents,
  };
  writeConfig(cwd, config);

  // The Theme, the root Layout's items, the Starter's items and any positional items.
  const requested = [
    ...new Set([...BASE_ITEMS, ...(mode === "create" ? STARTER_ITEMS : []), ...items]),
  ];
  const { available, missing } = await partitionAvailable(requested, preset.style, items);
  if (missing.length)
    info(
      `Not in the Registry yet, skipped: ${missing.join(", ")}. Add them later with \`nativecn-cli add\`.`,
    );
  const added = available.length
    ? await add(available, { cwd, yes: true, silent: opts.silent })
    : undefined;

  // Compose the Theme from the Preset ingredients.
  const theme = await composeTheme(cwd, preset, added, warn);
  const fonts = await presetFonts(preset);
  const fontFiles = await downloadFonts(
    cwd,
    fonts.body.id === fonts.heading.id ? [fonts.body] : [fonts.body, fonts.heading],
  );
  const fontPlugin = addFontPlugin(cwd, fontFiles.faces);
  if (fontPlugin.manual) warn(`Add to the plugins in your app config: ${fontPlugin.manual}`);

  // Interactive runs may still be asked before an edited AGENTS.md section is replaced.
  const agentKit = await writeAgentKit(cwd, agents, {
    yes: opts.yes || !interactive,
    silent: opts.silent,
  });

  const installed = new Set((added?.files ?? []).map((f) => f.item));
  const layoutFile = path.posix.join(config.routes, "_layout.tsx");
  const snippet = rootLayout(config, {
    portal: installed.has("portal"),
    keyboard: installed.has("keyboard"),
    toast: installed.has("toast"),
  });
  const result: InitResult = {
    mode,
    cwd,
    config,
    items: { requested, missing, add: added },
    theme,
    fonts: fontFiles,
    fontPlugin,
    tsconfig,
    overlaps: [],
    layout: { file: layoutFile, snippet, written: false },
    agentKit,
  };

  if (mode === "create") {
    // The Starter's root Layout is ours to write.
    fs.writeFileSync(path.join(cwd, layoutFile), snippet);
    result.layout.written = true;
    result.git = gitInitialCommit(cwd);
    if (!result.git.committed) warn(`Skipped the initial commit: ${result.git.reason}.`);
    if (!opts.silent) {
      const rel = path.relative(process.cwd(), cwd);
      const dir = !rel ? "." : rel.startsWith("..") ? cwd : rel;
      p.note([`cd ${dir}`, "npx expo run:ios   # or run:android"].join("\n"), "Next steps");
    }
    return result;
  }

  // init never rewrites existing files: print the root Layout and the overlapping Expo files.
  result.overlaps = overlappingThemeFiles(cwd);
  if (!opts.silent) {
    p.note(snippet, `Wrap your root Layout (${layoutFile}) like this`);
    if (result.overlaps.length)
      p.log.warn(
        `These files overlap with nativecn's Theme; move their users to @/theme and remove them when ready:\n${result.overlaps.map((f) => `  ${f}`).join("\n")}`,
      );
    p.log.success("nativecn is set up. Rebuild the native app to embed the fonts.");
  }
  return result;
}

/**
 * Write the Agent Kit for the chosen agents (#16 step 8) via `nativecn-cli agents` (#57). A failed
 * GitHub fetch doesn't stop create/init: `agents()` prints how to retry and reports it.
 */
export async function writeAgentKit(
  cwd: string,
  chosen: Agent[],
  opts: { yes?: boolean; silent?: boolean },
): Promise<AgentsResult | undefined> {
  if (chosen.length === 0) return undefined;
  return agents({ cwd, agents: chosen, yes: opts.yes, silent: opts.silent });
}

export function validAppName(name: string): boolean {
  const reserved = [
    "react-native",
    "react",
    "react-dom",
    "react-native-web",
    "expo",
    "expo-router",
  ];
  return /^[a-z0-9@.\-_]+$/i.test(name) && !reserved.includes(name.toLowerCase());
}

const FIELD_FLAGS: [PresetField, keyof InitOptions, string][] = [
  ["style", "style", "Style"],
  ["baseColor", "base", "Base colour"],
  ["accentColor", "accent", "Accent colour"],
  ["radius", "radius", "Radius"],
  ["bodyFont", "font", "Body font"],
  ["headingFont", "headingFont", "Heading font"],
];

/** --preset code, then long flags on top, then prompts for the rest (or the defaults, #5). */
export async function resolvePreset(opts: InitOptions, interactive: boolean): Promise<Preset> {
  let preset: Partial<Preset> = {};
  if (opts.preset) {
    const decoded = decodePreset(opts.preset);
    if (!decoded) throw new InitError(`"${opts.preset}" is not a Preset code.`);
    preset = decoded;
  }
  for (const [field, flag] of FIELD_FLAGS) {
    let value = opts[flag] as string | undefined;
    if (value === undefined) continue;
    value = value.toLowerCase().replace(/\s+/g, "-");
    if (field === "headingFont" && ["same", "body", "same-as-body"].includes(value))
      value = "inherit";
    const options: readonly string[] = PRESET_OPTIONS[field];
    if (!options.includes(value))
      throw new InitError(
        `Unknown --${flagName(flag)} "${value}". Options: ${options.join(", ")}.`,
      );
    (preset as Record<string, string>)[field] = value;
  }
  if (interactive && !opts.preset) {
    for (const [field, , label] of FIELD_FLAGS) {
      if (preset[field] !== undefined) continue;
      const options: readonly string[] = PRESET_OPTIONS[field];
      const value = cancelled(
        await p.select({
          message: label,
          options: options.map((o) => ({
            value: o,
            label: o === "inherit" ? "same as body" : o,
          })),
          initialValue: DEFAULT_PRESET[field] as string,
        }),
      );
      (preset as Record<string, string>)[field] = value;
    }
  }
  return { ...DEFAULT_PRESET, ...preset };
}

const flagName = (flag: string) => flag.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

async function resolveAgents(opts: InitOptions, interactive: boolean): Promise<Agent[]> {
  if (opts.agents !== undefined) {
    const list = opts.agents
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a && a !== "none");
    for (const a of list)
      if (!(AGENTS as readonly string[]).includes(a))
        throw new InitError(`Unknown agent "${a}". Options: ${AGENTS.join(", ")}, none.`);
    return [...new Set(list)] as Agent[];
  }
  if (!interactive) return [...AGENTS];
  return cancelled(
    await p.multiselect({
      message: "Which coding agents do you use?",
      options: AGENTS.map((a) => ({ value: a, label: a })),
      initialValues: [...AGENTS],
      required: false,
    }),
  );
}

/** Split names into those the Registry has and those it doesn't have yet. */
async function partitionAvailable(names: string[], style: string, explicit: string[]) {
  const available: string[] = [];
  const missing: string[] = [];
  for (const name of names) {
    try {
      await fetchItem(name, style);
      available.push(name);
    } catch (err) {
      // Items the user named must exist; ours may not have shipped yet.
      if (!(err instanceof RegistryError) || !/^Not found/.test(err.message)) throw err;
      if (explicit.includes(name) && !BASE_ITEMS.includes(name) && !STARTER_ITEMS.includes(name))
        throw err;
      missing.push(name);
    }
  }
  return { available, missing };
}

/**
 * Rewrite `{theme}/colors.ts` and the radius/font parts of `{theme}/tokens.ts` from the Preset,
 * but only where the file is still the Registry's default (never over the user's own file).
 */
async function composeTheme(
  cwd: string,
  preset: Preset,
  added: AddResult | undefined,
  warn: (msg: string) => void,
): Promise<InitResult["theme"]> {
  const status: InitResult["theme"] = { colors: "missing", tokens: "missing" };
  const files = (added?.files ?? []).filter((f) => f.item === "theme");
  const fresh = (suffix: string) => {
    const f = files.find((x) => x.target.endsWith(suffix));
    if (!f) return undefined;
    const untouched = added!.written.includes(f.target) || f.status === "identical";
    return { file: f, untouched };
  };
  const colors = fresh("/colors.ts");
  if (colors?.untouched) {
    const content = composeColorsFile(colors.file.content, await presetColors(preset), preset);
    fs.writeFileSync(path.join(cwd, colors.file.target), content);
    status.colors = "written";
  } else if (colors) {
    status.colors = "kept";
    warn(`Kept your ${colors.file.target}; the Preset's colours were not applied to it.`);
  }
  const tokens = fresh("/tokens.ts");
  if (tokens?.untouched) {
    const content = composeTokensFile(
      tokens.file.content,
      await presetRadiusBase(preset),
      await presetFonts(preset),
    );
    fs.writeFileSync(path.join(cwd, tokens.file.target), content);
    status.tokens = "written";
  } else if (tokens) {
    status.tokens = "kept";
    warn(`Kept your ${tokens.file.target}; the Preset's radius and fonts were not applied to it.`);
  }
  return status;
}

/** Offer to add "@/*" to tsconfig.json when it is missing (yes by default with --yes). */
async function ensureAtAlias(
  cwd: string,
  target: string,
  interactive: boolean,
  opts: InitOptions,
): Promise<InitResult["tsconfig"]> {
  const file = path.join(cwd, "tsconfig.json");
  if (!fs.existsSync(file)) return "missing";
  if (readTsconfigPaths(cwd)["@/*"]) return "present";
  const text = fs.readFileSync(file, "utf8");
  const edits = modify(text, ["compilerOptions", "paths", "@/*"], [target], {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  });
  const next = applyEdits(text, edits);
  if (interactive) {
    p.note(`"paths": { "@/*": ["${target}"] }`, "tsconfig.json compilerOptions");
    const ok = cancelled(
      await p.confirm({
        message: 'Add the "@/*" import alias to tsconfig.json?',
        initialValue: true,
      }),
    );
    if (!ok) return "declined";
  } else if (!opts.silent) {
    p.log.info(`Adding "@/*": ["${target}"] to tsconfig.json compilerOptions.paths.`);
  }
  fs.writeFileSync(file, next);
  return "added";
}

/** The root Layout: ThemeProvider outermost, KeyboardProvider around the navigator, PortalHost and one Toaster. */
export function rootLayout(
  config: Config,
  parts: { portal: boolean; keyboard: boolean; toast: boolean },
): string {
  const c = config.aliases.components;
  const imports = [
    'import { Stack } from "expo-router";',
    'import { KeyboardProvider } from "react-native-keyboard-controller";',
    "",
    parts.portal ? `import { PortalHost } from "${c}/primitives/portal";` : "",
    parts.toast ? `import { Toaster } from "${c}/toast";` : "",
    `import { ThemeProvider } from "${config.aliases.theme}";`,
  ].filter((line, i) => line !== "" || i === 2);
  const body = [
    "    <ThemeProvider>",
    "      <KeyboardProvider>",
    "        <Stack />",
    parts.portal ? "        <PortalHost />" : "",
    parts.toast
      ? "        <Toaster />"
      : "        {/* <Toaster /> goes here once the toast Component is added */}",
    "      </KeyboardProvider>",
    "    </ThemeProvider>",
  ].filter(Boolean);
  return [
    ...imports,
    "",
    "export default function RootLayout() {",
    "  return (",
    ...body,
    "  );",
    "}",
    "",
  ].join("\n");
}
