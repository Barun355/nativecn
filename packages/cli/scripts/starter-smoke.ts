// The Starter smoke test (#31): `create` and `add` end to end against a locally built Registry.
//   1. `create` with the defaults (Vega, flat).
//   2. `create` with Nova + violet + Lora headings in feature mode, then `add` every Registry Item.
//   3. For each app: install, type-check, then `expo export --platform android` (no device needed).
// One run covers one Expo SDK; CI runs it for SDK 57 (the floor, ADR 0010) and for the latest SDK.
//
// Usage: node scripts/starter-smoke.ts --sdk <57|latest> [--work <dir>] [--keep]
//   --work  the temporary folder (default: a new one in the OS temp folder)
//   --keep  keep the folder afterwards, to inspect the apps
import { spawnSync, type SpawnSyncOptions } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  dependencyRuleViolations,
  loadPinnedModules,
} from "../../ui/scripts/registry/dependency-rule.ts";
import { BASE_ITEMS, STARTER_ITEMS } from "../src/commands/init.ts";

const CLI = path.resolve(import.meta.dirname, "..");
const REPO = path.resolve(CLI, "..", "..");
const STARTER = path.join(CLI, "starter");
/** The permanent support floor (ADR 0010). */
export const SDK_FLOOR = 57;

/** The SDK major of an `expo` version or range: `~57.0.26` → 57. */
export function sdkMajor(range: string): number {
  const match = /(\d+)\.\d+/.exec(range);
  if (!match) throw new Error(`Can't read an Expo SDK from "${range}"`);
  return Number(match[1]);
}

/** The Starter's own SDK, from its package.json. */
export function starterSdk(starter = STARTER): number {
  const pkg = JSON.parse(fs.readFileSync(path.join(starter, "package.json"), "utf8")) as {
    dependencies: Record<string, string>;
  };
  return sdkMajor(pkg.dependencies.expo ?? "");
}

export type Leg =
  { run: true; sdk: number; npmTag: string; switchFrom?: number } | { run: false; reason: string };

/**
 * What one leg does. `sdk` is "57" (or any major) or "latest"; `latestVersion` is npm's
 * `expo@latest`. The latest leg is skipped when it is the floor itself, as the floor leg covers it.
 */
export function planLeg(sdk: string, latestVersion: string, starter: number): Leg {
  const latest = sdkMajor(latestVersion);
  const target = sdk === "latest" ? latest : Number(sdk);
  if (!Number.isInteger(target) || target < SDK_FLOOR)
    throw new Error(`--sdk must be "latest" or an SDK of at least ${SDK_FLOOR}, not "${sdk}"`);
  if (sdk === "latest" && latest === SDK_FLOOR)
    return {
      run: false,
      reason: `The latest Expo SDK is ${latest}, the floor itself: the SDK ${SDK_FLOOR} leg covers it.`,
    };
  return {
    run: true,
    sdk: target,
    npmTag: sdk === "latest" ? "latest" : `sdk-${target}`,
    ...(target === starter ? {} : { switchFrom: starter }),
  };
}

/** Where each Destination lands in a created app (the Starter has src/). */
const DESTINATION_DIRS: Record<string, string> = {
  components: "src/components",
  hooks: "src/hooks",
  utils: "src/utils",
  theme: "src/theme",
  screens: "src/screens",
};

type IndexItem = { name: string; registryDependencies?: string[]; files?: { target: string }[] };

/**
 * The files `create` should install for `items` and everything they depend on, from a Style's
 * registry.json index. Paths are relative to the app.
 */
export function expectedInstalledFiles(index: { items: IndexItem[] }, items: string[]): string[] {
  const byName = new Map(index.items.map((i) => [i.name, i]));
  const seen = new Set<string>();
  const visit = (name: string): void => {
    if (seen.has(name)) return;
    seen.add(name);
    for (const dep of byName.get(name)?.registryDependencies ?? []) visit(dep);
  };
  items.forEach(visit);
  const files: string[] = [];
  for (const name of seen)
    for (const f of byName.get(name)?.files ?? []) {
      const m = /^\{(\w+)\}\/(.*)$/.exec(f.target);
      const dir = m ? DESTINATION_DIRS[m[1]!] : undefined;
      if (dir) files.push(`${dir}/${m![2]}`);
    }
  return files.sort();
}

/** Every file under the app's Destination folders (and src/features). */
function installedFiles(app: string): string[] {
  const out: string[] = [];
  const walk = (rel: string): void => {
    const abs = path.join(app, rel);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true }))
      if (e.isDirectory()) walk(`${rel}/${e.name}`);
      else out.push(`${rel}/${e.name}`);
  };
  [...Object.values(DESTINATION_DIRS), "src/features"].forEach(walk);
  return out.sort();
}

/**
 * What is wrong with a created app's promo Screen (#75). Its index route must be the Starter's own
 * promo Screen, which reads the Preset from components.json. components.json must hold the chosen
 * Preset. When `installed` is given, exactly those files must be installed: the Theme, the root
 * Layout's items and #25's nine Starter items with their dependencies, nothing else. Empty when
 * all is well.
 */
export function promoScreenProblems(
  app: string,
  expected: { preset: Record<string, string>; installed?: string[] },
  starter = STARTER,
): string[] {
  const problems: string[] = [];
  const routeFile = path.join(app, "src", "app", "index.tsx");
  const route = fs.existsSync(routeFile) ? fs.readFileSync(routeFile, "utf8") : "";
  if (route !== fs.readFileSync(path.join(starter, "src", "app", "index.tsx"), "utf8"))
    problems.push("src/app/index.tsx is not the Starter's promo Screen");
  if (!route.includes('import config from "../../components.json";'))
    problems.push("src/app/index.tsx does not read components.json");
  const config = JSON.parse(fs.readFileSync(path.join(app, "components.json"), "utf8")) as {
    preset: Record<string, string>;
  };
  for (const [field, value] of Object.entries(expected.preset))
    if (config.preset[field] !== value)
      problems.push(`components.json preset.${field} is "${config.preset[field]}", not "${value}"`);
  if (expected.installed) {
    const want = new Set(expected.installed);
    const have = installedFiles(app);
    for (const f of have) if (!want.has(f)) problems.push(`installed but not expected: ${f}`);
    for (const f of want) if (!have.includes(f)) problems.push(`expected but not installed: ${f}`);
  }
  return problems;
}

function assertPromoScreen(app: string, expected: Parameters<typeof promoScreenProblems>[1]) {
  const problems = promoScreenProblems(app, expected);
  if (problems.length)
    throw new Error(
      [`${path.basename(app)}: promo Screen`, ...problems.map((p) => `  - ${p}`)].join("\n"),
    );
  const exact = expected.installed
    ? `, exactly the Starter's items installed (${expected.installed.length} files)`
    : "";
  console.log(`${path.basename(app)}: promo Screen and Preset OK${exact}`);
}

function run(command: string, args: string[], opts: SpawnSyncOptions & { cwd: string }): void {
  const rel = path.relative(REPO, opts.cwd);
  const where = rel.startsWith("..") ? opts.cwd : rel || ".";
  console.log(`\n$ ${[command, ...args].join(" ")}   (in ${where})`);
  const res = spawnSync(command, args, { stdio: "inherit", ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`"${command} ${args.join(" ")}" exited ${res.status}`);
}

function output(command: string, args: string[], cwd: string): string {
  const res = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (res.status !== 0) throw new Error(`"${command} ${args.join(" ")}" failed: ${res.stderr}`);
  return res.stdout.trim();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const get = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const sdkArg = get("--sdk");
  if (!sdkArg) throw new Error("Usage: node scripts/starter-smoke.ts --sdk <57|latest>");

  const latestVersion = output("npm", ["view", "expo@latest", "version"], REPO);
  const leg = planLeg(sdkArg, latestVersion, starterSdk());
  if (!leg.run) {
    console.log(`Skipped: ${leg.reason}`);
    return;
  }
  console.log(
    `Starter smoke test on Expo SDK ${leg.sdk} (expo@${leg.npmTag}; latest is ${latestVersion})`,
  );

  const work = path.resolve(
    get("--work") ?? fs.mkdtempSync(path.join(os.tmpdir(), "nativecn-smoke-")),
  );
  fs.mkdirSync(work, { recursive: true });
  const registry = path.join(work, "r");
  try {
    // A locally built Registry and CLI: what this branch would publish.
    run("node", ["--no-warnings", "scripts/registry/build.ts", "--out", registry], {
      cwd: path.join(REPO, "packages", "ui"),
    });
    run("pnpm", ["run", "build"], { cwd: CLI });

    // Everything create/add would fetch comes from this checkout; installs use npm, as most users do.
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NATIVECN_REGISTRY_URL: registry,
      NATIVECN_STARTER_DIR: STARTER,
      NATIVECN_FONTS_URL: path.join(REPO, "apps", "web", "public", "fonts"),
      NATIVECN_AGENT_KIT_DIR: REPO,
      npm_config_user_agent: "npm",
      CI: "1",
    };
    const cli = (cliArgs: string[]) =>
      run("node", [path.join(CLI, "dist", "index.js"), ...cliArgs], { cwd: work, env });

    /** Move a created app to the leg's SDK, as a user would with `expo install --fix`. */
    const switchSdk = (app: string) => {
      if (leg.switchFrom === undefined) return;
      run("npm", ["install", `expo@${leg.npmTag}`], { cwd: app, env });
      run("npx", ["expo", "install", "--fix"], { cwd: app, env });
    };

    const apps: string[] = [];

    // 1. The defaults: Vega, flat.
    cli(["create", "smoke-default", "--yes", "--defaults", "--cwd", work]);
    const defaultApp = path.join(work, "smoke-default");
    /** What `create` installs: the Theme, the root Layout's items and #25's nine Starter items. */
    const createFiles = (style: string) =>
      expectedInstalledFiles(
        JSON.parse(fs.readFileSync(path.join(registry, "styles", style, "registry.json"), "utf8")),
        [...BASE_ITEMS, ...STARTER_ITEMS],
      );
    assertPromoScreen(defaultApp, {
      preset: { style: "vega", baseColor: "neutral", accentColor: "neutral", bodyFont: "inter" },
      installed: createFiles("vega"),
    });
    switchSdk(defaultApp);
    apps.push(defaultApp);

    // 2. Nova + violet + Lora headings, feature mode, then every Registry Item.
    cli([
      "create",
      "smoke-custom",
      "--yes",
      "--style",
      "nova",
      "--accent",
      "violet",
      "--heading-font",
      "lora",
      "--folder-feat",
      "--cwd",
      work,
    ]);
    const customApp = path.join(work, "smoke-custom");
    const customPreset = { style: "nova", accentColor: "violet", headingFont: "lora" };
    assertPromoScreen(customApp, { preset: customPreset, installed: createFiles("nova") });
    switchSdk(customApp);
    cli(["add", "--all", "--yes", "--cwd", customApp]);
    // `add --all` leaves the promo Screen alone.
    assertPromoScreen(customApp, { preset: customPreset });
    apps.push(customApp);

    // Every item's dependencies on this SDK's pinned list (ADR 0007, ADR 0010).
    const pinned = loadPinnedModules(customApp);
    if (sdkMajor(pinned.sdk) !== leg.sdk)
      throw new Error(`smoke-custom has expo ${pinned.sdk}, expected SDK ${leg.sdk}`);
    const index = JSON.parse(
      fs.readFileSync(path.join(registry, "styles", "nova", "registry.json"), "utf8"),
    ) as { items: { name: string; dependencies?: string[]; devDependencies?: string[] }[] };
    const violations = dependencyRuleViolations(index.items, pinned.modules);
    if (violations.length)
      throw new Error(
        [
          `Dependency rule failed on Expo ${pinned.sdk}:`,
          ...violations.map((v) => `  - ${v}`),
        ].join("\n"),
      );

    // 3. Install, type-check and bundle each app for Android.
    for (const app of apps) {
      run("npm", ["install"], { cwd: app, env });
      run("npx", ["tsc", "--noEmit"], { cwd: app, env });
      run(
        "npx",
        [
          "expo",
          "export",
          "--platform",
          "android",
          "--output-dir",
          path.join(work, `${path.basename(app)}-export`),
        ],
        { cwd: app, env },
      );
    }
    console.log(`\nStarter smoke test passed on Expo SDK ${leg.sdk}.`);
  } finally {
    if (args.includes("--keep")) console.log(`Kept ${work}`);
    else fs.rmSync(work, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err: Error) => {
    console.error(`\nStarter smoke test failed: ${err.message}`);
    process.exit(1);
  });
}
