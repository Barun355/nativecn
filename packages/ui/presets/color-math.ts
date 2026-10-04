/**
 * Colour maths for Presets: oklch → sRGB hex, and WCAG 2 contrast.
 *
 * Self-written (no dependency) so that `scripts/generate-preset-colors.ts` is reproducible.
 * oklch → OKLab → linear sRGB uses Björn Ottosson's published matrices. Colours outside sRGB are
 * clipped per channel, which is how Tailwind's published hex fallbacks and culori's `formatHex`
 * behave (e.g. Tailwind red-600 → #e7000b).
 */

export type Oklch = { l: number; c: number; h: number; alpha: number };

/** Parses `oklch(L C H)` or `oklch(L C H / A%)`, with L as 0–1 or a percentage. */
export function parseOklch(value: string): Oklch {
  const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/.exec(
    value.trim(),
  );
  if (!match) throw new Error(`Not an oklch() colour: ${value}`);
  const [, l, lPercent, c, h, a, aPercent] = match;
  const alpha = a === undefined ? 1 : Number(a) / (aPercent ? 100 : 1);
  return { l: Number(l) / (lPercent ? 100 : 1), c: Number(c), h: Number(h), alpha };
}

export function formatOklch({ l, c, h, alpha }: Oklch): string {
  const round = (n: number, digits: number) => Number(n.toFixed(digits));
  const base = `${round(l, 3)} ${round(c, 3)} ${round(h, 3)}`;
  return alpha === 1 ? `oklch(${base})` : `oklch(${base} / ${round(alpha * 100, 1)}%)`;
}

const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const clip = (v: number) => Math.min(1, Math.max(0, v));
const hex2 = (v: number) => Math.round(v).toString(16).padStart(2, "0");

/** Converts oklch to `#rrggbb`, or `#rrggbbaa` when the colour has alpha (React Native reads both). */
export function oklchToHex(value: string | Oklch): string {
  const { l, c, h, alpha } = typeof value === "string" ? parseOklch(value) : value;
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const hex = `#${rgb.map((v) => hex2(clip(toGamma(v)) * 255)).join("")}`;
  return alpha === 1 ? hex : `${hex}${hex2(clip(alpha) * 255)}`;
}

/** WCAG 2 relative luminance of an opaque `#rrggbb` colour. */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Expected an opaque #rrggbb colour, got ${hex}`);
  const n = parseInt(match[1]!, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two opaque hex colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG 2.x AA for normal-size text. */
export const WCAG_AA = 4.5;
