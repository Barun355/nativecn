import { useSyncExternalStore } from "react";

import { resetStyles, type Theme } from "@/registry/theme";

import { nova } from "./nova";
import { vega, type SlotName } from "./vega";

export { defineStyle, type SlotFill } from "./define";
export type { SlotName } from "./vega";

/** The Styles shipped in 0.1. Adding one is a new file here; existing projects are untouched. */
export const STYLES = { vega, nova } as const;
export type StyleName = keyof typeof STYLES;

// Repo-only runtime state. In user apps there is no slot(): the Registry build replaces every
// call with the chosen Style's literal values (ADR 0006).
let active: StyleName = "vega";
const listeners = new Set<() => void>();

export function getActiveStyle(): StyleName {
  return active;
}

/** Switch Style live (Showcase App, Preset builder). Clears cached styles so Components rebuild. */
export function setActiveStyle(name: StyleName): void {
  if (name === active) return;
  active = name;
  resetStyles();
  for (const listener of listeners) listener();
}

export function useActiveStyle(): StyleName {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getActiveStyle,
    getActiveStyle,
  );
}

/** The style object a Slot returns, typed from the canonical Style (Vega). */
export type SlotStyle<N extends SlotName> = ReturnType<(typeof vega)[N]>;

/**
 * A named place in a base Component's styles, filled by the active Style. Typed per Slot, so
 * `slot("button.pressed", t)` is a ViewStyle and `slot("button.label", t)` a TextStyle with no
 * cast. The Registry build replaces each call with the Style's literal object.
 */
export function slot<N extends SlotName>(name: N, t: Theme): SlotStyle<N> {
  const fill = STYLES[active][name] as ((theme: Theme) => SlotStyle<N>) | undefined;
  if (!fill) throw new Error(`Style "${active}" has no fill for slot "${name}".`);
  return fill(t);
}
