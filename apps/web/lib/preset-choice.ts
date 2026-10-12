// The visitor's current Preset outside /create (#162): the docs pages' live preview shows each
// item with it. The URL's ?preset=<code> comes first (a link from /create, or a shared link),
// then the Preset last chosen on /create (remembered in this browser), then the default.
//
// Only the short code is stored, and it is decoded strictly (#91), so a stale or tampered value is
// ignored. Storage can be missing or throw (private windows, blocked site data); the page still
// works, it just forgets.

import { DEFAULT_PRESET, decodePreset, encodePreset, type Preset } from "preset";

export const PRESET_STORAGE_KEY = "nativecn:preset";

type ReadStorage = Pick<Storage, "getItem">;
type WriteStorage = Pick<Storage, "setItem">;

export type PresetChoice = { preset: Preset; from: "url" | "remembered" | "default" };

/** The Preset for a page with this `location.search`, given the remembered code (or null). */
export function currentPreset(search: string, remembered: string | null): PresetChoice {
  const code = new URLSearchParams(search).get("preset")?.trim();
  const fromUrl = code ? decodePreset(code) : null;
  if (fromUrl) return { preset: fromUrl, from: "url" };
  const fromStorage = remembered ? decodePreset(remembered.trim()) : null;
  if (fromStorage) return { preset: fromStorage, from: "remembered" };
  return { preset: DEFAULT_PRESET, from: "default" };
}

/** The remembered Preset code, or null when there is none or storage is unavailable. */
export function readRememberedPreset(storage: ReadStorage | undefined): string | null {
  try {
    return storage?.getItem(PRESET_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Remembers a Preset as the visitor's current one. Never throws. */
export function rememberPreset(storage: WriteStorage | undefined, preset: Preset): void {
  try {
    storage?.setItem(PRESET_STORAGE_KEY, encodePreset(preset));
  } catch {
    // Storage is full or blocked: the choice is simply not remembered.
  }
}

/** This browser's localStorage, or undefined on the server or when the browser blocks it. */
export function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
