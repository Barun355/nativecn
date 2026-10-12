"use client";

// The live preview on a Component or Block docs page (#162, decision #28): the item running in
// the builder's phone, with the visitor's current Preset (the URL's ?preset=, else the one last
// chosen on /create, else the default) and a link to change it.
//
// The docs text never waits for it: the server renders the spec card, and react-native-web and
// the item's code are loaded with dynamic imports once the page is in the browser. The spec card
// also stays while they load, if they fail, and for items that cannot run on the web.

import Link from "next/link";
import { useTheme } from "next-themes";
import { lazy, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { describePreset, encodePreset } from "preset";

import type { DocsPreviewPlan } from "@/lib/docs-preview";
import { builderHref } from "@/lib/preset-builder";
import {
  PRESET_STORAGE_KEY,
  browserStorage,
  currentPreset,
  readRememberedPreset,
  rememberPreset,
} from "@/lib/preset-choice";

import { PhoneFrame, PreviewBoundary } from "./preset-preview";
import { SpecCard } from "./spec-card";
import type { PreviewScheme } from "./theme";

const DocsPhone = lazy(() => import("./docs-phone"));

/** What decides the Preset, as one string (a stable snapshot): the URL's query, then storage. */
const choiceSnapshot = () =>
  `${window.location.search}\n${readRememberedPreset(browserStorage()) ?? ""}`;
const serverSnapshot = () => null;
/** Another tab choosing a Preset on /create updates this page too. */
function subscribeToChoice(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === PRESET_STORAGE_KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("popstate", onChange);
  };
}

const subscribeNothing = () => () => {};
const isBrowser = () => true;
const isServer = () => false;

export function DocsPreview({ plan }: { plan: DocsPreviewPlan }) {
  // Null in the server render and during hydration: the default Preset until the browser's
  // choice is known.
  const snapshot = useSyncExternalStore(subscribeToChoice, choiceSnapshot, serverSnapshot);
  const choice = useMemo(() => {
    const [search = "", remembered = ""] = (snapshot ?? "").split("\n");
    return currentPreset(search, remembered || null);
  }, [snapshot]);
  const { preset } = choice;

  // A Preset opened from a link becomes the visitor's current one, so the other docs pages
  // (whose links carry no ?preset=) keep showing it.
  useEffect(() => {
    if (choice.from === "url") rememberPreset(browserStorage(), preset);
  }, [choice.from, preset]);

  const mounted = useSyncExternalStore(subscribeNothing, isBrowser, isServer);
  const { resolvedTheme } = useTheme();
  const siteScheme: PreviewScheme = mounted && resolvedTheme === "dark" ? "dark" : "light";
  // The SchemeSwitcher demo changes the phone's Scheme; the site's own toggle resets it.
  const [override, setOverride] = useState<{ site: PreviewScheme; scheme: PreviewScheme }>();
  const scheme = override?.site === siteScheme ? override.scheme : siteScheme;
  const onSchemeChange = useCallback(
    (next: PreviewScheme) => setOverride({ site: siteScheme, scheme: next }),
    [siteScheme],
  );

  const fallback = <SpecCard preset={preset} scheme={scheme} />;
  const show = !plan.live ? undefined : "block" in plan ? { block: plan.block } : plan;

  return (
    <figure className="not-prose my-8 flex flex-col items-center gap-4 rounded-xl border bg-muted/30 px-2 py-6 sm:px-6">
      <PhoneFrame short={!!show && !("block" in show)}>
        {show && mounted ? (
          <PreviewBoundary fallback={fallback}>
            <DocsPhone
              preset={preset}
              scheme={scheme}
              onSchemeChange={onSchemeChange}
              show={show}
              fallback={fallback}
            />
          </PreviewBoundary>
        ) : (
          fallback
        )}
      </PhoneFrame>
      <figcaption className="flex max-w-[406px] flex-col items-center gap-1 px-2 text-center text-sm text-muted-foreground">
        {!plan.live && <span>{plan.reason}</span>}
        <span>
          {choice.from === "default" ? "Default Preset" : "Your Preset"}{" "}
          <code className="font-mono text-foreground" data-testid="docs-preset-code">
            {encodePreset(preset)}
          </code>
          : {describePreset(preset)}.
        </span>
        <Link
          href={builderHref(preset)}
          className="font-medium text-foreground underline underline-offset-4"
        >
          Change Preset
        </Link>
      </figcaption>
    </figure>
  );
}
