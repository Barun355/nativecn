import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

/** nativecn's own components.json (#14). Not shadcn-compatible by design (CLI ADR 0001). */
export const configSchema = z.object({
  $schema: z.string().optional(),
  version: z.literal(1),
  preset: z.object({
    code: z.string(),
    style: z.string(),
    baseColor: z.string(),
    accentColor: z.string(),
    radius: z.string(),
    bodyFont: z.string(),
    headingFont: z.string(),
  }),
  structure: z.enum(["flat", "feature"]),
  aliases: z.object({
    components: z.string(),
    hooks: z.string(),
    utils: z.string(),
    theme: z.string(),
    screens: z.string(),
    features: z.string().optional(),
  }),
  /** The {app} Destination: the Expo Router routes folder, relative to the project root. */
  routes: z.string(),
  agents: z.array(z.enum(["claude", "codex", "cursor", "antigravity"])).default([]),
});

export type Config = z.infer<typeof configSchema>;

export const CONFIG_FILE = "components.json";
export const CONFIG_SCHEMA_URL = "https://nativecn.dev/schema/components.json";

export class ConfigError extends Error {}

export function readConfig(cwd: string): Config | null {
  const file = path.join(cwd, CONFIG_FILE);
  if (!fs.existsSync(file)) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new ConfigError(`${CONFIG_FILE} is not valid JSON.`);
  }
  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`,
    );
    throw new ConfigError(`${CONFIG_FILE} is invalid:\n${issues.join("\n")}`);
  }
  return parsed.data;
}

export function writeConfig(cwd: string, config: Config): void {
  const data = { $schema: CONFIG_SCHEMA_URL, ...configSchema.parse(config) };
  fs.writeFileSync(path.join(cwd, CONFIG_FILE), JSON.stringify(data, null, 2) + "\n");
}
