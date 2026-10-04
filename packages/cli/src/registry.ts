import fs from "node:fs";
import path from "node:path";

export const DEFAULT_REGISTRY_URL = "https://nativecn.dev/r";

export type RegistryFile = { path: string; type: string; target: string; content: string };
export type RegistryItem = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
  meta?: Record<string, unknown>;
};

/** The built-in Registry, or NATIVECN_REGISTRY_URL (a URL or a local folder) for nativecn's own development. */
export function registryBase(): string {
  return process.env.NATIVECN_REGISTRY_URL ?? DEFAULT_REGISTRY_URL;
}

export class RegistryError extends Error {}

const cache = new Map<string, unknown>();

async function getJson<T>(relative: string): Promise<T> {
  const base = registryBase();
  const key = `${base}|${relative}`;
  if (cache.has(key)) return cache.get(key) as T;
  let data: unknown;
  if (/^https?:\/\//.test(base)) {
    const url = `${base.replace(/\/$/, "")}/${relative}`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      throw new RegistryError(
        `Can't reach the nativecn Registry (${url}): ${(err as Error).message}`,
      );
    }
    if (res.status === 404) throw new RegistryError(`Not found in the Registry: ${relative}`);
    if (!res.ok) throw new RegistryError(`Registry request failed (${res.status}) for ${url}`);
    data = await res.json();
  } else {
    const file = path.resolve(base.replace(/^file:\/\//, ""), relative);
    if (!fs.existsSync(file)) throw new RegistryError(`Not found in the Registry: ${relative}`);
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  cache.set(key, data);
  return data as T;
}

export function fetchItem(name: string, style: string): Promise<RegistryItem> {
  if (!/^[a-z0-9-]+$/.test(name)) {
    return Promise.reject(
      new RegistryError(`"${name}" is not an item name (names only; no URLs or paths).`),
    );
  }
  return getJson<RegistryItem>(`styles/${style}/${name}.json`);
}

export function fetchIndex(style: string): Promise<{ items: Omit<RegistryItem, "files">[] }> {
  return getJson(`styles/${style}/registry.json`);
}

export function clearRegistryCache(): void {
  cache.clear();
}
