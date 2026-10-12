// A Preset in words and as commands, shared by the Preset builder on nativecn.dev and the
// Showcase App (decision #28), so both say and copy exactly the same thing.
// Browser-safe: no Node.js dependencies.

import type { Preset } from "./options.ts";
import { encodePreset } from "./preset.ts";

const WORDS: Record<string, string> = { dm: "DM", jetbrains: "JetBrains" };

/** An option id as people read it: `source-serif-4` → `Source Serif 4`, `dm-sans` → `DM Sans`. */
export function optionLabel(id: string): string {
  if (id === "inherit") return "Same as body";
  return id
    .split("-")
    .map((w) => WORDS[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** One line in words, e.g. "Nova, zinc, violet accent, large radius, Lora with Inter headings". */
export function describePreset(preset: Preset): string {
  const font =
    preset.headingFont === "inherit" || preset.headingFont === preset.bodyFont
      ? optionLabel(preset.bodyFont)
      : `${optionLabel(preset.bodyFont)} with ${optionLabel(preset.headingFont)} headings`;
  return [
    optionLabel(preset.style),
    preset.baseColor,
    `${preset.accentColor} accent`,
    `${preset.radius} radius`,
    font,
  ].join(", ");
}

/** The Preset as `create`/`init` long flags: all six settings, as the MCP's build_preset_code gives them. */
export function presetFlags(preset: Preset): string {
  return [
    `--style ${preset.style}`,
    `--base ${preset.baseColor}`,
    `--accent ${preset.accentColor}`,
    `--radius ${preset.radius}`,
    `--font ${preset.bodyFont}`,
    `--heading-font ${preset.headingFont}`,
  ].join(" ");
}

type CommandOptions = { longFlags?: boolean };

const presetArgs = (preset: Preset, { longFlags = false }: CommandOptions) =>
  longFlags ? presetFlags(preset) : `--preset ${encodePreset(preset)}`;

/** The command that creates a new app with this Preset. */
export function createCommand(preset: Preset, options: CommandOptions = {}): string {
  return `npx nativecn-cli@latest create my-app ${presetArgs(preset, options)}`;
}

/** The command that sets nativecn up with this Preset in an existing Expo app. */
export function initCommand(preset: Preset, options: CommandOptions = {}): string {
  return `npx nativecn-cli@latest init ${presetArgs(preset, options)}`;
}

/** "Copy for AI": the code and its settings in words, and the command an agent runs with it. */
export function promptForAi(preset: Preset): string {
  return `Use the nativecn Preset ${encodePreset(preset)} (${describePreset(preset)}). Create the app with: ${createCommand(preset)}`;
}
