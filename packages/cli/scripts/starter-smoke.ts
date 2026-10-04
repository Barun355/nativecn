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
    switchSdk(customApp);
    cli(["add", "--all", "--yes", "--cwd", customApp]);
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
