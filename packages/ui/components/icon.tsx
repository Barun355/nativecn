import type { LucideIcon } from "lucide-react-native";
import type { Ref } from "react";
import { View, type ViewProps } from "react-native";

import { createStyles, useTheme, type ColorRole } from "@/registry/theme";

/** Icon sizes, from the `iconSize` Tokens (scaled). */
export type IconSize = "sm" | "md" | "lg";

export type IconProps = Omit<ViewProps, "children"> & {
  /** A Lucide icon component, e.g. `import { Camera } from "lucide-react-native"`. */
  icon: LucideIcon;
  /** sm 16 · md 20 · lg 24, before Scale (default `md`). */
  size?: IconSize;
  /** A Colour Role (default `foreground`). */
  color?: ColorRole;
  /** Stroke width of the glyph (default `2`). */
  strokeWidth?: number;
  /** Makes the icon meaningful to screen readers. Without it the icon is decorative and hidden. */
  "aria-label"?: string;
  ref?: Ref<View>;
};

const useStyles = createStyles((t) => ({
  sm: { width: t.iconSize.sm, height: t.iconSize.sm },
  md: { width: t.iconSize.md, height: t.iconSize.md },
  lg: { width: t.iconSize.lg, height: t.iconSize.lg },
}));

/**
 * Every glyph in the app: draws a Lucide icon at a Token size in a Colour Role. Decorative by
 * default (hidden from screen readers); pass `aria-label` when the icon carries meaning on its
 * own. `style` is merged last.
 */
export function Icon({
  icon: Glyph,
  size = "md",
  color = "foreground",
  strokeWidth = 2,
  "aria-label": label,
  style,
  ...props
}: IconProps) {
  const { colors, iconSize } = useTheme();
  const styles = useStyles();
  const decorative = !label;

  return (
    <View
      role={decorative ? undefined : "img"}
      aria-label={label}
      aria-hidden={decorative}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
      style={[styles[size], style]}
      {...props}
    >
      <Glyph size={iconSize[size]} color={colors[color]} strokeWidth={strokeWidth} />
    </View>
  );
}
