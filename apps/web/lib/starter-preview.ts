// The /create preview's Starter tab (#163, decision #28) renders the Starter's own promo Screen,
// packages/cli/starter/src/app/index.tsx, the file `nativecn-cli create` copies into every new
// app. It is written with a user app's import paths (`@/components/...`, `@/theme`, the app's
// components.json), so next.config.ts sends each of its imports to the repo's real files instead:
// one source, no copy to keep in step.

import { encodePreset, type Preset } from "preset";

/** The Starter's promo Screen, as `create` copies it, from the repo root. */
export const STARTER_SCREEN = "packages/cli/starter/src/app/index.tsx";

/** Where the Starter Screen's imports land in the website build. */
export type StarterTargets = {
  /** The Registry source (packages/ui/), which a new app's `@/components` hold. */
  ui: string;
  /** The Registry theme module as the preview sees it (a Preset-aware ThemeProvider). */
  theme: string;
  /** The app's components.json, holding the phone's Preset. */
  config: string;
  /** Expo Router: the preview has no navigator, so `<Stack.Screen>` draws nothing. */
  expoRouter: string;
};

/** A webpack request rewrite: a new request, or the same request resolved from another folder. */
export type StarterImport = { request: string } | { context: string };

const COMPONENT = /^@\/components\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)$/;
const PACKAGE = /^(?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9.-]*(?:\/.*)?$/;

/**
 * Where one of the Starter Screen's imports goes in the website. Null for an import the website
 * has no answer for: the Starter test then fails, naming it, before the build does.
 */
export function starterImport(request: string, to: StarterTargets): StarterImport | null {
  const component = COMPONENT.exec(request);
  if (component) return { request: `${to.ui}components/${component[1]}` };
  if (request === "@/theme") return { request: to.theme };
  if (request === "../../components.json") return { request: to.config };
  if (request === "expo-router") return { request: to.expoRouter };
  // Packages resolve from packages/ui, as for the Components the Screen arranges (the Starter
  // folder has no node_modules of its own in the repo).
  if (PACKAGE.test(request) && !request.startsWith("@/")) return { context: to.ui };
  return null;
}

/** The part of components.json the Starter Screen reads, for a Preset, as `create` writes it. */
export function starterConfig(preset: Preset): { preset: Preset & { code: string } } {
  return { preset: { code: encodePreset(preset), ...preset } };
}
