import { Check, CircleAlert, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { Icon, type IconSize } from "@/registry/components/icon";
import { Pressable, type PressableProps } from "@/registry/components/primitives/pressable";
import { Spinner } from "@/registry/components/spinner";
import { Text, type TextColor } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles, type ColorRole } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

/** Each Variant's Colour Roles: fill, content and (optional) border. */
const variants = {
  primary: { background: "primary", foreground: "primaryForeground" },
  secondary: { background: "secondary", foreground: "secondaryForeground" },
  outline: { background: "background", foreground: "foreground", border: "border" },
  ghost: { foreground: "foreground" },
  destructive: { background: "destructive", foreground: "destructiveForeground" },
  link: { foreground: "primary", underline: true },
} as const satisfies Record<
  string,
  { background?: ColorRole; foreground: TextColor; border?: ColorRole; underline?: boolean }
>;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonStatus = "error" | "success";

const statusIcons = { error: CircleAlert, success: Check } as const;
const iconSizes = { sm: "sm", md: "md", lg: "lg" } as const satisfies Record<ButtonSize, IconSize>;

type ButtonBaseProps = Omit<
  PressableProps,
  "children" | "style" | "size" | "pressedStyle" | "aria-label"
> & {
  /** Placement of the icon slot (icon, spinner or status icon) next to the label (default `start`). */
  iconPosition?: "start" | "end";
  /** Default `primary`. */
  variant?: ButtonVariant;
  /** Default `md`. */
  size?: ButtonSize;
  /** A spinner takes the icon slot, the label stays, presses are blocked and it is announced busy. */
  loading?: boolean;
  /** Shows an error or success icon in the icon slot and announces it. The screen clears it. */
  status?: ButtonStatus;
  /** Layout only (e.g. full width), merged last onto the root. */
  style?: StyleProp<ViewStyle>;
};

type LabelledButtonProps = {
  /** The visible text, which is also the accessible name. */
  label: string;
  /** A Lucide icon component shown in the icon slot. */
  icon?: LucideIcon;
  "aria-label"?: string;
};

type IconOnlyButtonProps = {
  label?: undefined;
  icon: LucideIcon;
  /** Required for an icon-only Button: it is the only accessible name. */
  "aria-label": string;
};

/** A Button has a `label`, or is icon-only with an `icon` and a required `aria-label`. */
export type ButtonProps = ButtonBaseProps & (LabelledButtonProps | IconOnlyButtonProps);

const useStyles = createStyles((t) => {
  const md = slot("button.root", t);
  const sm = slot("button.sm", t);
  const lg = slot("button.lg", t);
  return {
    root: {
      ...md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderCurve: "continuous",
      borderWidth: t.borderWidth.default,
      borderColor: "transparent",
    },
    sm,
    md: {},
    lg,
    iconOnlySm: { width: sm.height, paddingHorizontal: 0 },
    iconOnlyMd: { width: md.height, paddingHorizontal: 0 },
    iconOnlyLg: { width: lg.height, paddingHorizontal: 0 },
    label: slot("button.label", t),
    underline: { textDecorationLine: "underline" },
    pressed: slot("button.pressed", t),
    disabled: { opacity: t.opacity.disabled },
  };
});

const useVariantStyles = createStyles((t) => ({
  primary: { backgroundColor: t.colors.primary },
  secondary: { backgroundColor: t.colors.secondary },
  outline: { backgroundColor: t.colors.background, borderColor: t.colors.border },
  ghost: { backgroundColor: "transparent" },
  destructive: { backgroundColor: t.colors.destructive },
  link: { backgroundColor: "transparent" },
}));

const iconOnlyStyle = { sm: "iconOnlySm", md: "iconOnlyMd", lg: "iconOnlyLg" } as const;

/**
 * The app's Button. Variants and Sizes map to Tokens and Style Slots; built on the Pressable
 * Primitive (pressed look from the `button.pressed` Slot, tap area extended to 48, no press
 * while disabled or loading). Precedence: `disabled` > `loading` > `status`.
 */
export function Button({
  label,
  icon,
  iconPosition = "start",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  status,
  style,
  ...props
}: ButtonProps) {
  const styles = useStyles();
  const variantStyles = useVariantStyles();
  const v: { foreground: TextColor; underline?: boolean } = variants[variant];

  const isLoading = !disabled && loading;
  const shownStatus = disabled || loading ? undefined : status;
  const iconOnly = label == null;

  // Announce a new status once; the visible icon alone is not enough for screen readers.
  const announced = useRef<ButtonStatus | undefined>(undefined);
  useEffect(() => {
    if (shownStatus && shownStatus !== announced.current) {
      announce(label ? `${label}: ${shownStatus}` : shownStatus);
    }
    announced.current = shownStatus;
  }, [shownStatus, label]);

  // Known before layout, so the tap area reaches 48 from the first frame.
  const height = (size === "md" ? styles.root : styles[size]).height;

  const iconColor = v.foreground;
  const slotIcon = isLoading ? (
    // The Button itself is announced busy, so the Spinner stays silent.
    <Spinner size={iconSizes[size]} color={iconColor} aria-hidden />
  ) : shownStatus ? (
    <Icon icon={statusIcons[shownStatus]} size={iconSizes[size]} color={iconColor} />
  ) : icon ? (
    <Icon icon={icon} size={iconSizes[size]} color={iconColor} />
  ) : null;

  return (
    <Pressable
      disabled={disabled}
      loading={isLoading}
      size={{ height, width: iconOnly ? height : undefined }}
      pressedStyle={styles.pressed}
      style={[
        styles.root,
        styles[size],
        variantStyles[variant],
        iconOnly ? styles[iconOnlyStyle[size]] : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      {...props}
    >
      {iconPosition === "start" ? slotIcon : null}
      {label != null ? (
        <Text
          variant="button"
          color={v.foreground}
          numberOfLines={1}
          style={[styles.label, v.underline ? styles.underline : null]}
        >
          {label}
        </Text>
      ) : null}
      {iconPosition === "end" ? slotIcon : null}
    </Pressable>
  );
}
