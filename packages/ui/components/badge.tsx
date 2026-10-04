import type { Ref } from "react";
import { View, type ViewProps } from "react-native";

import { Text, type TextColor } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles, type ColorRole } from "@/registry/theme";

/** Each Variant's Colour Roles: fill, content and (optional) border. */
const variants = {
  default: { background: "primary", foreground: "primaryForeground" },
  secondary: { background: "secondary", foreground: "secondaryForeground" },
  outline: { foreground: "foreground", border: "border" },
  destructive: { background: "destructive", foreground: "destructiveForeground" },
  success: { background: "success", foreground: "successForeground" },
  warning: { background: "warning", foreground: "warningForeground" },
} as const satisfies Record<
  string,
  { background?: ColorRole; foreground: TextColor; border?: ColorRole }
>;

export type BadgeVariant = keyof typeof variants;

export type BadgeProps = Omit<ViewProps, "children"> & {
  /** The visible text, which is also the accessible name. */
  label: string;
  /** Default `default`. */
  variant?: BadgeVariant;
  ref?: Ref<View>;
};

const useStyles = createStyles((t) => ({
  root: {
    ...slot("badge.root", t),
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderCurve: "continuous",
    borderWidth: t.borderWidth.default,
    borderColor: "transparent",
  },
  label: slot("badge.label", t),
}));

const useVariantStyles = createStyles((t) => ({
  default: { backgroundColor: t.colors.primary },
  secondary: { backgroundColor: t.colors.secondary },
  outline: { backgroundColor: "transparent", borderColor: t.colors.border },
  destructive: { backgroundColor: t.colors.destructive },
  success: { backgroundColor: t.colors.success },
  warning: { backgroundColor: t.colors.warning },
}));

/**
 * A small status or count label. Not pressable; for a pressable or selectable pill use Chip.
 * Its `label` is the accessible name. `style` is merged last onto the root.
 */
export function Badge({ label, variant = "default", style, ...props }: BadgeProps) {
  const styles = useStyles();
  const variantStyles = useVariantStyles();
  return (
    <View style={[styles.root, variantStyles[variant], style]} {...props}>
      <Text
        variant="caption"
        color={variants[variant].foreground}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Text>
    </View>
  );
}
