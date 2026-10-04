import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_URL = "https://github.com/Barun355/nativecn.git";
export const STARTER_PATH = "packages/cli/starter";

/** The CLI's own version, read from its package.json (works from src/ and from the dist bundle). */
export function cliVersion(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    const file = path.join(dir, "package.json");
    if (fs.existsSync(file)) {
      const pkg = JSON.parse(fs.readFileSync(file, "utf8")) as { name?: string; version?: string };
      if (pkg.name === "nativecn-cli" && pkg.version) return pkg.version;
    }
    dir = path.dirname(dir);
  }
  return "0.0.0";
}

/**
 * The git ref the nativecn repo (Starter, Agent Kit) is fetched at: the release tag
 * `nativecn-cli@<version>`, or main for 0.0.x and dev builds.
 */
export function repoRef(version = cliVersion()): string {
  if (version.startsWith("0.0.") || version.includes("-")) return "main";
  return `nativecn-cli@${version}`;
}

/** The ref the Starter is fetched at (same as the Agent Kit). */
export const starterRef = repoRef;

const git = (args: string[], cwd: string, env?: NodeJS.ProcessEnv) =>
  spawnSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, ...env } });

const SKIP = new Set(["node_modules", ".expo", "dist"]);

function copyStarter(from: string, to: string): void {
  fs.cpSync(from, to, {
    recursive: true,
    filter: (src) => !SKIP.has(path.basename(src)),
  });
}

/**
 * Copy the Starter into `dest`: from NATIVECN_STARTER_DIR, else by a shallow sparse git checkout
 * of the nativecn repo's packages/cli/starter (as shadcn fetches its templates).
 */
export function fetchStarter(dest: string, log: (msg: string) => void = () => {}): void {
  const local = process.env.NATIVECN_STARTER_DIR;
  if (local) {
    if (!fs.existsSync(path.join(local, "package.json")))
      throw new Error(`NATIVECN_STARTER_DIR (${local}) has no package.json.`);
    copyStarter(local, dest);
    return;
  }
  withRepoCheckout([STARTER_PATH], (dir) => copyStarter(path.join(dir, STARTER_PATH), dest), {
    what: "Starter",
    log,
  });
}

export class RepoFetchError extends Error {}

/**
 * A shallow sparse git checkout of `paths` from the nativecn repo at `repoRef()`, falling back to
 * main when that tag is missing (as shadcn fetches its templates). Used for the Starter and the
 * Agent Kit. `use` gets the checkout folder, which is deleted afterwards; `what` names the content
 * in messages. Throws RepoFetchError when git is missing or the fetch fails (e.g. offline).
 */
export function withRepoCheckout<T>(
  paths: string[],
  use: (dir: string, ref: string) => T,
  opts: { what: string; log?: (msg: string) => void },
): T {
  const log = opts.log ?? (() => {});
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nativecn-repo-"));
  try {
    const clone = (ref: string) =>
      git(
        ["clone", "--depth", "1", "--filter=blob:none", "--sparse", "--branch", ref, REPO_URL, tmp],
        os.tmpdir(),
      );
    let ref = repoRef();
    let res = clone(ref);
    if (res.status !== 0 && !res.error && ref !== "main") {
      log(`No ${opts.what} at ${ref}; using main.`);
      fs.rmSync(tmp, { recursive: true, force: true });
      ref = "main";
      res = clone(ref);
    }
    if (res.error)
      throw new RepoFetchError(`git is needed to fetch the ${opts.what}: ${res.error.message}`);
    if (res.status !== 0)
      throw new RepoFetchError(`could not fetch the ${opts.what}: ${res.stderr.trim()}`);
    const sparse = git(["sparse-checkout", "set", ...paths], tmp);
    if (sparse.status !== 0)
      throw new RepoFetchError(`could not fetch the ${opts.what}: ${sparse.stderr.trim()}`);
    return use(tmp, ref);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** An npm-safe package name for the app folder name. */
export function packageName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._~-]+/g, "-")
      .replace(/^[._-]+|-+$/g, "") || "my-app"
  );
}

/** The URL scheme: letters and digits only, lower-cased (as create-expo-app does). */
export function schemeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "") || "myapp";
}

/** Replace the Starter's placeholders (#92): name/slug `nativecn-starter`, scheme `nativecnstarter`. */
export function renameStarter(dest: string, name: string): void {
  const pkgFile = path.join(dest, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8")) as Record<string, unknown>;
  pkg.name = packageName(name);
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");

  const appFile = path.join(dest, "app.json");
  if (fs.existsSync(appFile)) {
    const text = fs
      .readFileSync(appFile, "utf8")
      .replaceAll("nativecnstarter", schemeName(name))
      .replaceAll("nativecn-starter", "__NATIVECN_APP__");
    const app = JSON.parse(text) as { expo?: Record<string, unknown> };
    app.expo ??= {};
    app.expo.name = name;
    app.expo.slug = packageName(name);
    const out = JSON.stringify(app, null, 2).replaceAll("__NATIVECN_APP__", packageName(name));
    fs.writeFileSync(appFile, out + "\n");
  }
}

export type GitResult = { committed: boolean; reason?: string };

/** `git init` and one commit, `feat: initial commit` (skipped inside an existing repo). */
export function gitInitialCommit(dest: string): GitResult {
  const inside = git(["rev-parse", "--is-inside-work-tree"], dest);
  if (inside.error) return { committed: false, reason: "git is not installed" };
  if (inside.status === 0 && inside.stdout.trim() === "true")
    return { committed: false, reason: "the folder is already inside a git repository" };
  const init = git(["init", "-q"], dest);
  if (init.status !== 0) return { committed: false, reason: init.stderr.trim() };
  git(["add", "-A"], dest);
  // Fall back to a placeholder identity where git has none (e.g. CI), so the commit still lands.
  const hasIdentity = git(["config", "user.email"], dest).stdout.trim() !== "";
  const env = hasIdentity
    ? undefined
    : {
        GIT_AUTHOR_NAME: "nativecn",
        GIT_AUTHOR_EMAIL: "nativecn@users.noreply.github.com",
        GIT_COMMITTER_NAME: "nativecn",
        GIT_COMMITTER_EMAIL: "nativecn@users.noreply.github.com",
      };
  const commit = git(["commit", "-q", "--no-verify", "-m", "feat: initial commit"], dest, env);
  if (commit.status !== 0) return { committed: false, reason: commit.stderr.trim() };
  return { committed: true };
}
