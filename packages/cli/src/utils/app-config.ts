import fs from "node:fs";
import path from "node:path";

export type PluginResult = { added: string[]; manual: string[] };

/**
 * Add Config Plugins to app.json. With a code-based app.config.(ts|js) nothing is edited:
 * the plugins are returned for the user to add by hand.
 */
export function addConfigPlugins(cwd: string, plugins: string[], dryRun = false): PluginResult {
  if (plugins.length === 0) return { added: [], manual: [] };
  const dynamic = ["app.config.ts", "app.config.js"].find((f) => fs.existsSync(path.join(cwd, f)));
  if (dynamic) return { added: [], manual: plugins };
  const file = path.join(cwd, "app.json");
  if (!fs.existsSync(file)) return { added: [], manual: plugins };
  const json = JSON.parse(fs.readFileSync(file, "utf8")) as { expo?: { plugins?: unknown[] } };
  json.expo ??= {};
  const existing = (json.expo.plugins ?? []).map((p) => (Array.isArray(p) ? p[0] : p));
  const added = plugins.filter((p) => !existing.includes(p));
  if (added.length && !dryRun) {
    json.expo.plugins = [...(json.expo.plugins ?? []), ...added];
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  }
  return { added, manual: [] };
}
