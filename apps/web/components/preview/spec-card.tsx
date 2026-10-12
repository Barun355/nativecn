// The spec card (decision #28): a plain-HTML summary of a Preset's Tokens: swatches in light and
// dark, a type sample in the chosen fonts, radius chips and sample control shapes. It needs no
// React Native, so it shows while the live preview loads, and in its place if the preview fails.

import type { CSSProperties } from "react";
import { optionLabel, type Preset } from "preset";

import { previewValues } from "@/lib/preset-builder";
import { nova } from "@/registry/styles/nova";
import { vega } from "@/registry/styles/vega";
import type { Theme } from "@/registry/theme";
import { controlHeight, radius, radiusBase, spacing } from "@/registry/theme/tokens";

const STYLES = { vega, nova };

const SWATCHES = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "muted",
  "border",
  "destructive",
] as const;

/** The control sizes a Style gives a Button and an Input, at Scale 1. */
function controlShapes(preset: Preset, base: number) {
  // Only what the button.root and input.root fills read. Scale 1, so values are the Tokens.
  const t = {
    controlHeight,
    radius: radius(base),
    spacing,
    scaleValue: (v: number) => v,
    borderWidth: { default: 1 },
    type: {},
  } as unknown as Theme;
  const style = STYLES[preset.style];
  const button = style["button.root"](t) as { height: number; borderRadius: number };
  const input = style["input.root"](t) as { height: number; borderRadius: number };
  return { button, input };
}

export function SpecCard({
  preset,
  scheme = "light",
}: {
  preset: Preset;
  scheme?: "light" | "dark";
}) {
  const values = previewValues(preset);
  const base = values.radiusBase ?? radiusBase;
  const steps = radius(base);
  const { button, input } = controlShapes(preset, base);
  // The card itself is drawn in the preview's Scheme; the swatches show both.
  const c = values.colors[scheme];
  const font = (name: string): CSSProperties => ({ fontFamily: `"${name}", sans-serif` });

  return (
    <div
      className="flex h-full flex-col gap-6 overflow-y-auto p-5 text-left"
      style={{ background: c.background, color: c.foreground }}
      aria-label="Preset spec card"
    >
      {(["light", "dark"] as const).map((swatchScheme) => (
        <div key={swatchScheme} className="space-y-2">
          <p
            className="text-xs"
            style={{ ...font(values.fonts.body.medium), color: c.mutedForeground }}
          >
            {swatchScheme === "light" ? "Light" : "Dark"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map((role) => (
              <span
                key={role}
                title={role}
                className="size-7 rounded-md border"
                style={{ background: values.colors[swatchScheme][role], borderColor: c.border }}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-1">
        <p style={{ ...font(values.fonts.heading.bold), fontSize: 30, lineHeight: "36px" }}>
          Your app is ready.
        </p>
        <p
          style={{
            ...font(values.fonts.body.regular),
            fontSize: 16,
            lineHeight: "24px",
            color: c.mutedForeground,
          }}
        >
          {optionLabel(preset.bodyFont)} body text,{" "}
          {optionLabel(preset.headingFont === "inherit" ? preset.bodyFont : preset.headingFont)}{" "}
          headings.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {(["sm", "md", "lg", "xl"] as const).map((step) => (
          <span
            key={step}
            className="flex size-12 items-center justify-center border text-[11px]"
            style={{
              ...font(values.fonts.body.medium),
              borderRadius: steps[step],
              borderColor: c.border,
              background: c.muted,
            }}
          >
            {step}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        <div
          className="flex items-center border px-3"
          style={{
            ...font(values.fonts.body.regular),
            height: input.height,
            borderRadius: input.borderRadius,
            borderColor: c.input,
            color: c.mutedForeground,
          }}
        >
          you@example.com
        </div>
        <div
          className="flex items-center justify-center"
          style={{
            ...font(values.fonts.body.semibold),
            height: button.height,
            borderRadius: button.borderRadius,
            background: c.primary,
            color: c.primaryForeground,
            fontSize: 15,
          }}
        >
          Continue
        </div>
      </div>
    </div>
  );
}
