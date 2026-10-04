import type { Ref } from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { createStyles, useTheme, type ColorRole, type tokens } from "@/registry/theme";

/** The type ramp: one Variant per typographic role. */
export type TextVariant = keyof typeof tokens.typeRamp;

/** Colour Roles meant for text: `foreground`, every `…Foreground`, and the status colours. */
export type TextColor =
  | "foreground"
  | Extract<ColorRole, `${string}Foreground`>
  | "primary"
  | "destructive"
  | "success"
  | "warning"
  | "info";

export type TextAlign = "auto" | "left" | "right" | "center" | "justify";

/**
 * Per-Variant behaviour. Headings get the `heading` role; reading text is selectable; chrome
 * Variants (button, label, caption) cap the OS font scale at 1.5× when font scaling is on.
 */
const variants = {
  display: { heading: true, selectable: false, chrome: false },
  h1: { heading: true, selectable: false, chrome: false },
  h2: { heading: true, selectable: false, chrome: false },
  h3: { heading: true, selectable: false, chrome: false },
  h4: { heading: true, selectable: false, chrome: false },
  lead: { heading: false, selectable: false, chrome: false },
  body: { heading: false, selectable: true, chrome: false },
  label: { heading: false, selectable: false, chrome: true },
  small: { heading: false, selectable: true, chrome: false },
  caption: { heading: false, selectable: false, chrome: true },
  button: { heading: false, selectable: false, chrome: true },
} as const satisfies Record<
  TextVariant,
  { heading: boolean; selectable: boolean; chrome: boolean }
>;

/** The OS font-scale cap for chrome Variants (ADR 0004). */
const CHROME_MAX_FONT_SCALE = 1.5;

export type TextProps = RNTextProps & {
  /** The typographic role (default `body`). */
  variant?: TextVariant;
  /** A text Colour Role (default `foreground`). */
  color?: TextColor;
  align?: TextAlign;
  ref?: Ref<RNText>;
};

const useVariantStyles = createStyles((t) => ({
  display: { ...t.type.display },
  h1: { ...t.type.h1 },
  h2: { ...t.type.h2 },
  h3: { ...t.type.h3 },
  h4: { ...t.type.h4 },
  lead: { ...t.type.lead },
  body: { ...t.type.body },
  label: { ...t.type.label },
  small: { ...t.type.small },
  caption: { ...t.type.caption },
  button: { ...t.type.button },
}));

const useColorStyles = createStyles(
  (t) =>
    ({
      foreground: { color: t.colors.foreground },
      cardForeground: { color: t.colors.cardForeground },
      popoverForeground: { color: t.colors.popoverForeground },
      primaryForeground: { color: t.colors.primaryForeground },
      secondaryForeground: { color: t.colors.secondaryForeground },
      mutedForeground: { color: t.colors.mutedForeground },
      accentForeground: { color: t.colors.accentForeground },
      destructiveForeground: { color: t.colors.destructiveForeground },
      successForeground: { color: t.colors.successForeground },
      warningForeground: { color: t.colors.warningForeground },
      infoForeground: { color: t.colors.infoForeground },
      primary: { color: t.colors.primary },
      destructive: { color: t.colors.destructive },
      success: { color: t.colors.success },
      warning: { color: t.colors.warning },
      info: { color: t.colors.info },
    }) satisfies Record<TextColor, { color: string }>,
);

const useAlignStyles = createStyles(() => ({
  auto: { textAlign: "auto" },
  left: { textAlign: "left" },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  justify: { textAlign: "justify" },
}));

/**
 * All text in the app. Applies the type ramp and a text Colour Role, and honours the Theme's
 * font-scaling switch (`config.fontScaling`, off by default). React Native Text props pass
 * through; `style` is merged last.
 */
export function Text({
  variant = "body",
  color = "foreground",
  align,
  selectable,
  allowFontScaling,
  maxFontSizeMultiplier,
  role,
  style,
  ...props
}: TextProps) {
  const { config } = useTheme();
  const variantStyles = useVariantStyles();
  const colorStyles = useColorStyles();
  const alignStyles = useAlignStyles();
  const v = variants[variant];
  const scaling = allowFontScaling ?? config.fontScaling;

  return (
    <RNText
      role={role ?? (v.heading ? "heading" : undefined)}
      selectable={selectable ?? v.selectable}
      allowFontScaling={scaling}
      maxFontSizeMultiplier={
        maxFontSizeMultiplier ?? (scaling && v.chrome ? CHROME_MAX_FONT_SCALE : undefined)
      }
      style={[variantStyles[variant], colorStyles[color], align ? alignStyles[align] : null, style]}
      {...props}
    />
  );
}
