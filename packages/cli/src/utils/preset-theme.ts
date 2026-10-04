import fs from "node:fs";
import path from "node:path";

import type { Preset } from "preset";

import {
  fetchAccentColor,
  fetchBaseColor,
  fetchFont,
  fetchPresetIndex,
  type FontFace,
  type FontIngredient,
  type SchemeName,
} from "../registry.ts";

const FACES: FontFace[] = ["regular", "medium", "semibold", "bold"];
const SCHEMES: SchemeName[] = ["light", "dark"];

/** The distinct fonts a Preset needs (one or two); "inherit" means the Heading Font is the body's. */
export function presetFontIds(preset: Preset): string[] {
  const heading = preset.headingFont === "inherit" ? preset.bodyFont : preset.headingFont;
  return preset.bodyFont === heading ? [preset.bodyFont] : [preset.bodyFont, heading];
}

/** Light and dark Colour Roles for the Preset's Base and Accent Colour (shared roles last). */
export async function presetColors(
  preset: Preset,
): Promise<Record<SchemeName, Record<string, string>>> {
  const [index, base, accent] = await Promise.all([
    fetchPresetIndex(),
    fetchBaseColor(preset.baseColor),
    fetchAccentColor(preset.accentColor),
  ]);
  const scheme = (s: SchemeName) => ({ ...base[s], ...accent[s], ...index.shared[s] });
  return { light: scheme("light"), dark: scheme("dark") };
}

/**
 * Rewrite the Registry's `{theme}/colors.ts` with the Preset's colours, keeping the file's shape
 * and role order. Throws if the file has a role the Preset ingredients do not define.
 */
export function composeColorsFile(
  source: string,
  colors: Record<SchemeName, Record<string, string>>,
  preset: Preset,
): string {
  let out = source.replace(
    /^(\/\/.*\n)+/,
    `// The installed Preset's Colour Roles: Base Colour "${preset.baseColor}", Accent Colour ` +
      `"${preset.accentColor}".\n// Written by nativecn-cli at create/init; the Preset is fixed for the project.\n`,
  );
  for (const scheme of SCHEMES) {
    const re = new RegExp(`(const ${scheme}\\b[^=]*=\\s*\\{\\n)([\\s\\S]*?)(\\n\\};)`);
    const match = re.exec(out);
    if (!match) throw new Error(`colors.ts: cannot find the ${scheme} Colour Roles.`);
    const body = match[2]!;
    const roles = [...body.matchAll(/^\s*(\w+):/gm)].map((m) => m[1]!);
    const lines = roles.map((role) => {
      const value = colors[scheme][role];
      if (!value) throw new Error(`The Preset has no ${scheme} value for "${role}".`);
      return `  ${role}: "${value}",`;
    });
    out = out.replace(re, `$1${lines.join("\n")}$3`);
  }
  return out;
}

/** Radius base for the Preset, or null for "default" (the Style's own radius stays). */
export async function presetRadiusBase(preset: Preset): Promise<number | null> {
  if (preset.radius === "default") return null;
  const index = await fetchPresetIndex();
  const value = index.radiusBase[preset.radius];
  if (value === undefined) throw new Error(`Unknown radius "${preset.radius}".`);
  return value;
}

export type PresetFonts = { body: FontIngredient; heading: FontIngredient };

export async function presetFonts(preset: Preset): Promise<PresetFonts> {
  const headingId = preset.headingFont === "inherit" ? preset.bodyFont : preset.headingFont;
  const [body, heading] = await Promise.all([fetchFont(preset.bodyFont), fetchFont(headingId)]);
  return { body, heading };
}

const faceBlock = (font: FontIngredient) =>
  `{\n${FACES.map((f) => `    ${f}: "${font.faces[f]}",`).join("\n")}\n  }`;

/**
 * Rewrite the radius base and the `fonts` Token in the Registry's `{theme}/tokens.ts`. The fonts'
 * letter-spacing corrections (em, #94) become `fonts.trackingOffset`, which the Theme multiplies by
 * each Text Variant's font size.
 */
export function composeTokensFile(
  source: string,
  radiusBase: number | null,
  fonts: PresetFonts,
): string {
  let out = source;
  if (radiusBase !== null) {
    if (!/export const radiusBase = [\d.]+;/.test(out))
      throw new Error("tokens.ts: cannot find radiusBase.");
    out = out.replace(
      /export const radiusBase = [\d.]+;/,
      `export const radiusBase = ${radiusBase};`,
    );
  }
  const fontsRe = /export const fonts = \{[\s\S]*?\n\} as const;/;
  if (!fontsRe.test(out)) throw new Error("tokens.ts: cannot find the fonts Token.");
  const block = [
    "export const fonts = {",
    `  body: ${faceBlock(fonts.body)},`,
    `  heading: ${faceBlock(fonts.heading)},`,
    "  /** Letter-spacing correction in em for the Body/Heading Font (Inter is the baseline, 0). */",
    `  trackingOffset: { body: ${fonts.body.letterSpacingCorrection}, heading: ${fonts.heading.letterSpacingCorrection} },`,
    "} as const;",
  ].join("\n");
  return out.replace(fontsRe, block);
}

/** Where fonts are downloaded from: nativecn.dev, or NATIVECN_FONTS_URL (a URL or local folder). */
export function fontsBase(): string {
  return process.env.NATIVECN_FONTS_URL ?? "https://nativecn.dev/fonts";
}

export type FontDownload = { written: string[]; kept: string[]; faces: string[] };

/**
 * Download only the chosen fonts' four faces and licence into `assets/fonts/<id>/` (one folder per
 * font, so the OFL.txt files don't collide). Existing files are kept. Returns the face paths for
 * the expo-font Config Plugin.
 */
export async function downloadFonts(cwd: string, fonts: FontIngredient[]): Promise<FontDownload> {
  const base = fontsBase();
  const result: FontDownload = { written: [], kept: [], faces: [] };
  for (const font of fonts) {
    const files = [...FACES.map((f) => font.files[f]), font.license];
    for (const file of files) {
      const rel = path.posix.join("assets/fonts", font.id, file);
      if (file.endsWith(".ttf")) result.faces.push(`./${rel}`);
      const dest = path.join(cwd, rel);
      if (fs.existsSync(dest)) {
        result.kept.push(rel);
        continue;
      }
      const data = await readFontFile(base, `${font.id}/${file}`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, data);
      result.written.push(rel);
    }
  }
  return result;
}

async function readFontFile(base: string, rel: string): Promise<Uint8Array> {
  if (/^https?:\/\//.test(base)) {
    const url = `${base.replace(/\/$/, "")}/${rel}`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      throw new Error(`Can't download ${url}: ${(err as Error).message}`);
    }
    if (!res.ok) throw new Error(`Font download failed (${res.status}) for ${url}`);
    return new Uint8Array(await res.arrayBuffer());
  }
  const file = path.resolve(base.replace(/^file:\/\//, ""), rel);
  if (!fs.existsSync(file)) throw new Error(`Font file not found: ${file}`);
  return fs.readFileSync(file);
}
