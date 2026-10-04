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

export type FontPluginResult = { added: boolean; manual?: string };

/**
 * Point the expo-font Config Plugin at the downloaded font files so they are embedded at build
 * time, merging into an existing "expo-font" entry. With app.config.(ts|js) nothing is edited:
 * the entry is returned for the user to add by hand.
 */
export function addFontPlugin(cwd: string, fonts: string[]): FontPluginResult {
  const dynamic = ["app.config.ts", "app.config.js"].find((f) => fs.existsSync(path.join(cwd, f)));
  const file = path.join(cwd, "app.json");
  if (dynamic || !fs.existsSync(file))
    return { added: false, manual: JSON.stringify(["expo-font", { fonts }]) };
  const json = JSON.parse(fs.readFileSync(file, "utf8")) as { expo?: { plugins?: unknown[] } };
  json.expo ??= {};
  const plugins = json.expo.plugins ?? [];
  const index = plugins.findIndex((p) => (Array.isArray(p) ? p[0] : p) === "expo-font");
  const current = index === -1 ? undefined : plugins[index];
  const options =
    Array.isArray(current) && typeof current[1] === "object" && current[1] !== null
      ? (current[1] as { fonts?: string[] })
      : {};
  const next = [
    "expo-font",
    { ...options, fonts: [...new Set([...(options.fonts ?? []), ...fonts])] },
  ];
  if (index === -1) plugins.push(next);
  else plugins[index] = next;
  json.expo.plugins = plugins;
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  return { added: true };
}
