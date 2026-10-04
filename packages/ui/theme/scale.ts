import { PixelRatio } from "react-native";

import { config } from "./config";
import {
  controlHeight,
  fonts,
  iconSize,
  radius,
  spacing,
  typeRamp,
  type TextVariant,
  type TypeStyle,
} from "./tokens";

/** Scale = shorter screen side ÷ baseline, clamped. The shorter side keeps it stable on rotation. */
export function computeScale(width: number, height: number, cfg = config.scale): number {
  const shorter = Math.min(width, height);
  return Math.min(cfg.max, Math.max(cfg.min, shorter / cfg.baseline));
}

/** Apply Scale to one base value, rounded to the nearest physical pixel. */
export function scaleValue(value: number, scale: number): number {
  return PixelRatio.roundToNearestPixel(value * scale);
}

function mapValues<T extends Record<string, number>>(obj: T, fn: (v: number) => number) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)])) as {
    [K in keyof T]: number;
  };
}

/**
 * Pre-scaled Tokens. Scales spacing, radius (except `full`), control heights, icon sizes and text;
 * never the touch target, borders, shadows, motion or opacity.
 */
export function scaleTokens(scale: number, base = { radiusBase: undefined as number | undefined }) {
  const s = (v: number) => scaleValue(v, scale);
  const r = radius(base.radiusBase);
  const type = Object.fromEntries(
    (Object.keys(typeRamp) as TextVariant[]).map((variant) => {
      const step = typeRamp[variant];
      const family = fonts[step.role][step.face];
      const style: TypeStyle = {
        fontFamily: family,
        fontSize: s(step.size),
        lineHeight: s(step.lineHeight),
        letterSpacing: (step.tracking + fonts.trackingOffset[step.role] * step.size) * scale,
      };
      return [variant, style];
    }),
  ) as Record<TextVariant, TypeStyle>;

  return {
    spacing: mapValues(spacing, s),
    radius: {
      ...mapValues({ sm: r.sm, md: r.md, lg: r.lg, xl: r.xl, "2xl": r["2xl"] }, s),
      full: r.full,
    },
    controlHeight: mapValues(controlHeight, s),
    iconSize: mapValues(iconSize, s),
    type,
  };
}

export type ScaledTokens = ReturnType<typeof scaleTokens>;
