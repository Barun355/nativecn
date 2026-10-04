/**
 * Font data for the Body Font and Heading Font Preset settings.
 *
 * This file is never copied into users' apps. The CLI and the Registry build
 * read it to pick font files and to write the `fonts` part of `{theme}/tokens.ts`.
 *
 * Each font ships as four static faces (400/500/600/700). Every file is named
 * after its PostScript name, so one `fontFamily` string selects the same face
 * on iOS (which reads the PostScript name) and Android (which reads the file
 * name). Weight is always chosen by face, never with `fontWeight`.
 *
 * The files are hosted on nativecn.dev at `/fonts/<id>/<file>`, each folder
 * with the font's `OFL.txt` (source: `apps/web/public/fonts`).
 */

/**
 * Font ids in Preset order. The Preset short-code encoder stores a font as its
 * index in this list, so the list is APPEND-ONLY: never remove or reorder ids.
 */
export const FONT_IDS = [
  "inter",
  "geist",
  "dm-sans",
  "figtree",
  "lora",
  "source-serif-4",
  "geist-mono",
  "jetbrains-mono",
] as const;

export type FontId = (typeof FONT_IDS)[number];

export type FontCategory = "sans" | "serif" | "mono";

/** The four faces every font ships, keyed by weight name. */
export const FONT_FACES = ["regular", "medium", "semibold", "bold"] as const;

export type FontFace = (typeof FONT_FACES)[number];

/** The CSS-style weight of each face, for the builder and docs only. */
export const FONT_FACE_WEIGHTS: Record<FontFace, 400 | 500 | 600 | 700> = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export type FontData = {
  id: FontId;
  /** Name shown in the builder, CLI prompts and docs. */
  name: string;
  category: FontCategory;
  /** PostScript name of each face; this is also the `fontFamily` string. */
  faces: Record<FontFace, string>;
  /** File name of each face: `<PostScript name>.ttf`. */
  files: Record<FontFace, string>;
  /** Licence file shipped next to the faces. */
  license: "OFL.txt";
  /** Where the files come from (for maintainers refreshing them). */
  source: string;
  /**
   * Letter-spacing correction for the type ramp, in em (multiplied by the
   * Text Variant's font size). The ramp in `tokens.ts` is tuned for Inter, so
   * Inter is 0. See LETTER-SPACING CORRECTIONS below.
   */
  letterSpacingCorrection: number;
};

/*
 * LETTER-SPACING CORRECTIONS
 *
 * The type ramp's letter spacing (#2: display -0.8 … h3 -0.2, the rest 0) was
 * set for Inter. Other fonts carry different built-in spacing, so the same
 * values would make them look cramped (or loose). Each font's correction is an
 * em value added to every step: `ramp + correction × fontSize`.
 *
 * How the values were chosen: the average lowercase side bearing (advance minus
 * ink width, a–z, Regular face) was measured with fontTools and compared to
 * Inter's (0.104 em). Fonts spaced tighter than Inter get a positive correction
 * of about a fifth of the difference, rounded to 0.0025 em:
 *   geist 0.106 → 0, dm-sans 0.093 → 0.0025, figtree 0.082 → 0.005,
 *   lora 0.047 → 0.0125, source-serif-4 0.045 → 0.0125.
 * Monospace fonts are a special case: tightening breaks their fixed grid and
 * their wide side bearings are part of the design, so both get +0.01 em, which
 * roughly halves the heading tightening and is invisible at body sizes.
 * All corrections stay within ±0.015 em (under 0.25 px at body size).
 */

function defineFont(
  id: FontId,
  name: string,
  category: FontCategory,
  postScriptPrefix: string,
  letterSpacingCorrection: number,
  source: string,
): FontData {
  const faces: Record<FontFace, string> = {
    regular: `${postScriptPrefix}-Regular`,
    medium: `${postScriptPrefix}-Medium`,
    semibold: `${postScriptPrefix}-SemiBold`,
    bold: `${postScriptPrefix}-Bold`,
  };
  const files = Object.fromEntries(FONT_FACES.map((f) => [f, `${faces[f]}.ttf`])) as Record<
    FontFace,
    string
  >;
  return {
    id,
    name,
    category,
    faces,
    files,
    license: "OFL.txt",
    source,
    letterSpacingCorrection,
  };
}

export const FONTS: Record<FontId, FontData> = {
  inter: defineFont(
    "inter",
    "Inter",
    "sans",
    "Inter",
    0,
    "github.com/rsms/inter v4.1 (extras/ttf)",
  ),
  geist: defineFont(
    "geist",
    "Geist",
    "sans",
    "Geist",
    0,
    "github.com/vercel/geist-font v1.7.2 (Geist/ttf)",
  ),
  "dm-sans": defineFont(
    "dm-sans",
    "DM Sans",
    "sans",
    "DMSans",
    0.0025,
    "github.com/googlefonts/dm-fonts (Sans/fonts/ttf)",
  ),
  figtree: defineFont(
    "figtree",
    "Figtree",
    "sans",
    "Figtree",
    0.005,
    "github.com/erikdkennedy/figtree v2.0.3 (fonts/ttf)",
  ),
  lora: defineFont(
    "lora",
    "Lora",
    "serif",
    "Lora",
    0.0125,
    "github.com/cyrealtype/Lora-Cyrillic v3.021 (Lora.zip ttf)",
  ),
  "source-serif-4": defineFont(
    "source-serif-4",
    "Source Serif 4",
    "serif",
    "SourceSerif4",
    0.0125,
    "github.com/google/fonts ofl/sourceserif4 variable font, instanced at opsz 20 and wght 400/500/600/700 with fontTools (Adobe's static release has no Medium)",
  ),
  "geist-mono": defineFont(
    "geist-mono",
    "Geist Mono",
    "mono",
    "GeistMono",
    0.01,
    "github.com/vercel/geist-font v1.7.2 (GeistMono/ttf)",
  ),
  "jetbrains-mono": defineFont(
    "jetbrains-mono",
    "JetBrains Mono",
    "mono",
    "JetBrainsMono",
    0.01,
    "github.com/JetBrains/JetBrainsMono v2.304 (fonts/ttf)",
  ),
};

export const DEFAULT_BODY_FONT: FontId = "inter";

export function isFontId(value: string): value is FontId {
  return (FONT_IDS as readonly string[]).includes(value);
}

export function getFont(id: FontId): FontData {
  return FONTS[id];
}

/** The `fonts.body` / `fonts.heading` entry written into `{theme}/tokens.ts`. */
export type FontToken = Record<FontFace, string> & {
  /** Letter-spacing correction in em; see `trackedLetterSpacing`. */
  letterSpacing: number;
};

export type FontTokens = { body: FontToken; heading: FontToken };

export function fontToken(id: FontId): FontToken {
  const font = FONTS[id];
  return { ...font.faces, letterSpacing: font.letterSpacingCorrection };
}

/**
 * Builds the `fonts` Token entries for a Preset. The Heading Font sets
 * `display` and `h1`–`h4`; the Body Font sets every other Text Variant. A
 * missing Heading Font means "same as body".
 */
export function fontTokens(body: FontId, heading: FontId = body): FontTokens {
  return { body: fontToken(body), heading: fontToken(heading) };
}

/**
 * Final letter spacing for one type-ramp step: the ramp value (tuned for Inter)
 * plus the font's em correction scaled to the step's font size, rounded to
 * 0.01 pt.
 */
export function trackedLetterSpacing(
  rampLetterSpacing: number,
  fontSize: number,
  correction: number,
): number {
  const value = rampLetterSpacing + correction * fontSize;
  return Math.round(value * 100) / 100 || 0;
}

/** The distinct font ids a Preset needs (one or two). */
export function presetFontIds(body: FontId, heading: FontId = body): FontId[] {
  return body === heading ? [body] : [body, heading];
}

/** Path of a face file relative to the site root, e.g. `fonts/inter/Inter-Bold.ttf`. */
export function fontFilePath(id: FontId, f: FontFace): string {
  return `fonts/${id}/${FONTS[id].files[f]}`;
}

/** Path of a font's licence relative to the site root. */
export function fontLicensePath(id: FontId): string {
  return `fonts/${id}/${FONTS[id].license}`;
}

/**
 * Every file the CLI downloads into `assets/fonts/` for a Preset: the faces of
 * the chosen fonts plus their licences.
 */
export function presetFontFiles(body: FontId, heading: FontId = body): string[] {
  return presetFontIds(body, heading).flatMap((id) => [
    ...FONT_FACES.map((f) => fontFilePath(id, f)),
    fontLicensePath(id),
  ]);
}
