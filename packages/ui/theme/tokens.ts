import type { TextStyle } from "react-native";

// Base Token values (before Scale). See "Token set for 0.1" and "Scale mechanics".

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Every radius step derives from one base, which the Preset's Radius setting overrides. */
export const radiusBase = 10;
export const radius = (base: number = radiusBase) =>
  ({
    sm: base - 4,
    md: base - 2,
    lg: base,
    xl: base + 4,
    "2xl": base + 8,
    full: 9999,
  }) as const;

/** Body and Heading Font faces (PostScript names). `create`/`init` rewrite these from the Preset. */
export const fonts = {
  body: {
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
  },
  heading: {
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
  },
  /** Letter-spacing correction in em for the Body/Heading Font (Inter is the baseline, 0). */
  trackingOffset: { body: 0, heading: 0 },
} as const;

type Face = keyof typeof fonts.body;
type Step = {
  size: number;
  lineHeight: number;
  face: Face;
  tracking: number;
  role: "body" | "heading";
};

/** Text Variants (the type ramp). Weight is chosen by face, never fontWeight. */
export const typeRamp = {
  display: { size: 36, lineHeight: 40, face: "bold", tracking: -0.8, role: "heading" },
  h1: { size: 30, lineHeight: 36, face: "bold", tracking: -0.6, role: "heading" },
  h2: { size: 24, lineHeight: 32, face: "semibold", tracking: -0.4, role: "heading" },
  h3: { size: 20, lineHeight: 28, face: "semibold", tracking: -0.2, role: "heading" },
  h4: { size: 17, lineHeight: 24, face: "semibold", tracking: 0, role: "heading" },
  lead: { size: 18, lineHeight: 28, face: "regular", tracking: 0, role: "body" },
  body: { size: 16, lineHeight: 24, face: "regular", tracking: 0, role: "body" },
  label: { size: 14, lineHeight: 20, face: "medium", tracking: 0, role: "body" },
  small: { size: 14, lineHeight: 20, face: "regular", tracking: 0, role: "body" },
  caption: { size: 12, lineHeight: 16, face: "regular", tracking: 0, role: "body" },
  button: { size: 15, lineHeight: 20, face: "semibold", tracking: 0, role: "body" },
} as const satisfies Record<string, Step>;

export type TextVariant = keyof typeof typeRamp;
export type TypeStyle = Pick<TextStyle, "fontSize" | "lineHeight" | "letterSpacing" | "fontFamily">;

export const controlHeight = { sm: 36, md: 44, lg: 52 } as const;
export const iconSize = { sm: 16, md: 20, lg: 24 } as const;

/** Not scaled: an accessibility floor (48 on both platforms). */
export const minTouchTarget = 48;

export const borderWidth = { default: 1, hairline: "hairline" as const };

/** boxShadow strings per Scheme; exact values are tuned during the build. */
export const elevation = {
  light: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.06)",
    md: "0 4px 12px rgba(0, 0, 0, 0.08)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.14)",
  },
  dark: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.6)",
    md: "0 4px 12px rgba(0, 0, 0, 0.6)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.7)",
  },
} as const;

export const motion = {
  duration: { fast: 150, base: 250, slow: 400 },
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0, 0, 0, 1],
    exit: [0.3, 0, 1, 1],
  },
  spring: {
    snappy: { damping: 20, stiffness: 300, mass: 1 },
    gentle: { damping: 18, stiffness: 140, mass: 1 },
  },
} as const;

export const opacity = { disabled: 0.5 } as const;
