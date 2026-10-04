import fs from "node:fs";
import path from "node:path";

export const DEFAULT_REGISTRY_URL = "https://nativecn.dev/r";

export type RegistryFile = { path: string; type: string; target: string; content: string };
export type RegistryItem = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  categories?: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
  meta?: Record<string, unknown>;
};
/** An entry of a Style's registry.json index: files are listed without their content. */
export type RegistryIndexItem = Omit<RegistryItem, "files"> & {
  files?: Omit<RegistryFile, "content">[];
};
export type RegistryIndex = { name?: string; items: RegistryIndexItem[] };

/** /r/presets/index.json: every Preset option, in short-code order (decision #28). */
export type PresetIndex = {
  style: string[];
  baseColor: string[];
  accentColor: string[];
  radius: string[];
  radiusBase?: Record<string, number | null>;
  bodyFont: string[];
  headingFont: string[];
  [key: string]: unknown;
};

/** The built-in Registry, or NATIVECN_REGISTRY_URL (a URL or a local folder) for nativecn's own development. */
export function registryBase(): string {
  return process.env.NATIVECN_REGISTRY_URL ?? DEFAULT_REGISTRY_URL;
}

export class RegistryError extends Error {}
/** The Registry itself could not be reached (network failure, server error, missing folder). */
export class RegistryUnreachableError extends RegistryError {}
/** The Registry answered, but has no such file. */
export class RegistryNotFoundError extends RegistryError {}

/** Read one JSON file from the Registry (a URL or a local folder), without caching. */
export async function loadRegistryJson<T>(relative: string, base = registryBase()): Promise<T> {
  if (/^https?:\/\//.test(base)) {
    const url = `${base.replace(/\/$/, "")}/${relative}`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      throw new RegistryUnreachableError(
        `Can't reach the nativecn Registry (${url}): ${(err as Error).message}`,
      );
    }
    if (res.status === 404)
      throw new RegistryNotFoundError(`Not found in the Registry: ${relative}`);
    if (!res.ok)
      throw new RegistryUnreachableError(`Registry request failed (${res.status}) for ${url}`);
    try {
      return (await res.json()) as T;
    } catch {
      throw new RegistryUnreachableError(`The Registry returned invalid JSON for ${url}`);
    }
  }
  const root = path.resolve(base.replace(/^file:\/\//, ""));
  if (!fs.existsSync(root))
    throw new RegistryUnreachableError(`Can't reach the nativecn Registry: ${root} does not exist`);
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file))
    throw new RegistryNotFoundError(`Not found in the Registry: ${relative}`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    throw new RegistryUnreachableError(`The Registry returned invalid JSON for ${file}`);
  }
}

const NAME = /^[a-z0-9-]+$/;

export function assertItemName(name: string): void {
  if (!NAME.test(name))
    throw new RegistryError(`"${name}" is not an item name (names only; no URLs or paths).`);
}

function assertStyle(style: string): void {
  if (!NAME.test(style)) throw new RegistryError(`"${style}" is not a Style name.`);
}

/**
 * Registry reads with a cache. `maxAgeMs` bounds how long an answer is reused
 * (the MCP uses a few minutes; a one-shot CLI command keeps it for the whole run).
 * Failures are never cached, so the next call tries the Registry again.
 */
export function createRegistryClient(opts: { base?: () => string; maxAgeMs?: number } = {}) {
  const base = opts.base ?? registryBase;
  const maxAgeMs = opts.maxAgeMs ?? Infinity;
  const cache = new Map<string, { at: number; data: Promise<unknown> }>();

  function get<T>(relative: string): Promise<T> {
    const b = base();
    const key = `${b}|${relative}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < maxAgeMs) return hit.data as Promise<T>;
    const data = loadRegistryJson<T>(relative, b);
    cache.set(key, { at: Date.now(), data });
    data.catch(() => {
      if (cache.get(key)?.data === data) cache.delete(key);
    });
    return data;
  }

  const guarded = <T>(check: () => void, load: () => Promise<T>): Promise<T> => {
    try {
      check();
    } catch (err) {
      return Promise.reject(err);
    }
    return load();
  };

  return {
    item(name: string, style: string): Promise<RegistryItem> {
      return guarded(
        () => (assertItemName(name), assertStyle(style)),
        () => get<RegistryItem>(`styles/${style}/${name}.json`),
      );
    },
    index(style: string): Promise<RegistryIndex> {
      return guarded(
        () => assertStyle(style),
        () => get<RegistryIndex>(`styles/${style}/registry.json`),
      );
    },
    presets(): Promise<PresetIndex> {
      return get<PresetIndex>("presets/index.json");
    },
    clear(): void {
      cache.clear();
    },
  };
}

export type RegistryClient = ReturnType<typeof createRegistryClient>;

const defaultClient = createRegistryClient();

export function fetchItem(name: string, style: string): Promise<RegistryItem> {
  return defaultClient.item(name, style);
}

export function fetchIndex(style: string): Promise<RegistryIndex> {
  return defaultClient.index(style);
}

export function clearRegistryCache(): void {
  defaultClient.clear();
}
