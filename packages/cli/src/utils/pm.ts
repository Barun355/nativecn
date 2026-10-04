import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/** Detect the project's package manager from its lockfile, then from how the CLI was launched. */
export function detectPackageManager(cwd: string): PackageManager {
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(cwd, "bun.lock")) || fs.existsSync(path.join(cwd, "bun.lockb")))
    return "bun";
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm";
  const agent = process.env.npm_config_user_agent ?? "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  if (agent.startsWith("bun")) return "bun";
  return "npm";
}

/** Split specs: plain names go through `expo install` (SDK-matched); "name@range" are pinned exceptions (ADR 0007). */
export function splitDependencies(specs: string[]): { expo: string[]; pinned: string[] } {
  const expo: string[] = [];
  const pinned: string[] = [];
  for (const spec of specs) {
    const at = spec.lastIndexOf("@");
    if (at > 0) pinned.push(spec);
    else expo.push(spec);
  }
  return { expo, pinned };
}

export type InstallPlan = { command: string; args: string[] }[];

export function installPlan(specs: string[], pm: PackageManager): InstallPlan {
  const { expo, pinned } = splitDependencies(specs);
  const plan: InstallPlan = [];
  if (expo.length) plan.push({ command: "npx", args: ["expo", "install", ...expo] });
  if (pinned.length) {
    const add = pm === "npm" ? ["install"] : ["add"];
    plan.push({ command: pm, args: [...add, ...pinned] });
  }
  return plan;
}

export function runInstall(plan: InstallPlan, cwd: string): void {
  if (process.env.NATIVECN_SKIP_INSTALL) return;
  for (const step of plan) {
    const res = spawnSync(step.command, step.args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (res.status !== 0) throw new Error(`"${step.command} ${step.args.join(" ")}" failed`);
  }
}
