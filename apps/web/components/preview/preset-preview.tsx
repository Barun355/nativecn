"use client";

// The live preview panel: tabs, the phone frame and the renderer inside it. react-native-web
// runs only in the browser, so the renderer is loaded once the page has mounted. The spec card is
// the server-rendered HTML, stands in while the renderer loads, and takes its place if it fails.

import { Component, Suspense, lazy, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Preset } from "preset";

import type { PreviewTab } from "./phone-preview";
import { SpecCard } from "./spec-card";
import type { PreviewScheme } from "./theme";

const TABS: { id: PreviewTab; label: string }[] = [
  { id: "components", label: "Components" },
  { id: "sign-in", label: "Sign-in" },
];

export type PresetPreviewProps = {
  preset: Preset;
  scheme: PreviewScheme;
  onSchemeChange?: (scheme: PreviewScheme) => void;
};

export function PresetPreview({ preset, scheme, onSchemeChange }: PresetPreviewProps) {
  const [tab, setTab] = useState<PreviewTab>("components");
  // False in the server render and during hydration, true once in the browser.
  const mounted = useSyncExternalStore(subscribeNothing, isBrowser, isServer);
  const fallback = <SpecCard preset={preset} scheme={scheme} />;
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="tablist"
        aria-label="Preview"
        className="inline-flex rounded-md border p-0.5 text-sm"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tab}
            onClick={() => setTab(t.id)}
            className={`rounded px-3 py-1 font-medium ${
              t.id === tab
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <PhoneFrame>
        {mounted ? (
          <PreviewBoundary fallback={fallback}>
            <Suspense fallback={fallback}>
              <PhonePreview
                preset={preset}
                scheme={scheme}
                onSchemeChange={onSchemeChange}
                tab={tab}
              />
            </Suspense>
          </PreviewBoundary>
        ) : (
          fallback
        )}
      </PhoneFrame>
    </div>
  );
}

const subscribeNothing = () => () => {};
const isBrowser = () => true;
const isServer = () => false;

const PhonePreview = lazy(() => import("./phone-preview"));

/**
 * A 390 × 780 phone: the 390pt baseline phone Tokens are designed for, so Scale is 1. `short`
 * is a shorter phone of the same width, for a docs page showing one Component's example.
 */
export function PhoneFrame({ children, short }: { children: ReactNode; short?: boolean }) {
  return (
    <div className="w-[406px] max-w-full rounded-[2.75rem] border-8 border-neutral-900 bg-neutral-900 shadow-xl dark:border-neutral-700">
      <div
        data-preview
        className={`relative flex ${short ? "h-[600px]" : "h-[780px]"} max-h-[80vh] flex-col overflow-hidden rounded-[2.25rem] bg-background`}
      >
        {children}
      </div>
    </div>
  );
}

/** Shows the spec card if the live preview throws. */
export class PreviewBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
