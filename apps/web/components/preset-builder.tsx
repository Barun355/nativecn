"use client";

// The Preset builder at /create (decision #28): controls on the left, the live preview in the
// middle, and the code, commands and Copy for AI on the right. The URL follows every change, so
// any Preset can be shared as a link.

import { useCallback, useEffect, useState } from "react";
import {
  createCommand,
  encodePreset,
  initCommand,
  promptForAi,
  type Preset,
  type PresetField,
} from "preset";

import { CopyButton } from "@/components/copy-button";
import { CopyCommand } from "@/components/copy-command";
import { PresetPreview } from "@/components/preview/preset-preview";
import type { PreviewScheme } from "@/components/preview/theme";
import { PRESET_CONTROLS, builderHref, previewValues, withSetting } from "@/lib/preset-builder";
import { browserStorage, rememberPreset } from "@/lib/preset-choice";

export function PresetBuilder({
  initialPreset,
  invalidCode,
  fromLink = false,
}: {
  initialPreset: Preset;
  /** The URL's code, when it could not be decoded (the default Preset is shown instead). */
  invalidCode?: string;
  /** True when the URL's valid code chose `initialPreset` (a shared or docs link). */
  fromLink?: boolean;
}) {
  const [preset, setPreset] = useState(initialPreset);
  const [scheme, setScheme] = useState<PreviewScheme>("light");
  const [longFlags, setLongFlags] = useState(false);
  const code = encodePreset(preset);

  // Keep the URL on the current Preset without a navigation (no re-render of the page, no
  // history entry per click), so the address bar is always the shareable link. The Preset is
  // also remembered, so the docs pages' preview shows it (#162); the default shown for a missing
  // or invalid code is not a choice, so it never replaces the remembered one.
  useEffect(() => {
    const href = builderHref(preset);
    if (window.location.pathname + window.location.search !== href) {
      window.history.replaceState(window.history.state, "", href);
    }
    if (fromLink || preset !== initialPreset) rememberPreset(browserStorage(), preset);
  }, [preset, initialPreset, fromLink]);

  const set = useCallback(
    (field: PresetField, value: string) => setPreset((p) => withSetting(p, field, value)),
    [],
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[17rem_minmax(0,1fr)_20rem] lg:items-start">
      <section aria-label="Preset settings" className="space-y-6">
        {invalidCode ? (
          <p role="alert" className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            <code>{invalidCode}</code> is not a valid Preset code, so the default Preset is shown.
          </p>
        ) : null}
        {PRESET_CONTROLS.map((c) => (
          <PresetControlField
            key={c.field}
            control={c}
            preset={preset}
            scheme={scheme}
            onChange={set}
          />
        ))}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Preview</legend>
          <Segmented
            label="Preview scheme"
            options={[
              { id: "light", label: "Light" },
              { id: "dark", label: "Dark" },
            ]}
            value={scheme}
            onChange={(v) => setScheme(v as PreviewScheme)}
          />
          <p className="text-xs text-muted-foreground">
            For the preview only: apps follow the system or the user&apos;s choice.
          </p>
        </fieldset>
      </section>

      <PresetPreview preset={preset} scheme={scheme} onSchemeChange={setScheme} />

      <section aria-label="Use this Preset" className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Preset code</h2>
          <div className="flex items-center justify-between gap-2 rounded-lg border px-4 py-3">
            <code className="font-mono text-lg" data-testid="preset-code">
              {code}
            </code>
            <CopyButton label="Copy" title="Copy the Preset code" produce={() => code} />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Create a new app</h2>
          <CopyCommand wrap command={createCommand(preset, { longFlags })} />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Or add nativecn to an existing Expo app</h2>
          <CopyCommand wrap command={initCommand(preset, { longFlags })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={longFlags}
            onChange={(e) => setLongFlags(e.target.checked)}
          />
          Show long flags
        </label>
        <div className="space-y-2">
          <CopyButton
            label="Copy for AI"
            title="Copy an instruction naming this Preset, ready to paste into an agent"
            produce={() => promptForAi(preset)}
          />
          <p className="text-xs text-muted-foreground">
            Copies the code, its settings in words and the command, for your AI agent.
          </p>
        </div>
      </section>
    </div>
  );
}

function PresetControlField({
  control,
  preset,
  scheme,
  onChange,
}: {
  control: (typeof PRESET_CONTROLS)[number];
  preset: Preset;
  scheme: PreviewScheme;
  onChange: (field: PresetField, value: string) => void;
}) {
  const { field, label, options } = control;
  const value = preset[field];

  if (field === "baseColor" || field === "accentColor") {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          {label} <span className="font-normal text-muted-foreground">{value}</span>
        </legend>
        <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
          {options.map((o) => {
            const colors = previewValues({ ...preset, [field]: o.id }).colors[scheme];
            const swatch = field === "accentColor" ? colors.primary : colors.mutedForeground;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={o.id === value}
                aria-label={o.label}
                title={o.label}
                onClick={() => onChange(field, o.id)}
                className={`size-7 rounded-full border-2 ${
                  o.id === value ? "border-foreground" : "border-transparent"
                }`}
              >
                <span className="block size-full rounded-full" style={{ background: swatch }} />
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field === "bodyFont" || field === "headingFont") {
    const id = `preset-${field}`;
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <Segmented
        label={label}
        options={options}
        value={value}
        onChange={(v) => onChange(field, v)}
      />
    </fieldset>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-1 rounded-md border p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded px-2.5 py-1 text-sm font-medium ${
            o.id === value
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
