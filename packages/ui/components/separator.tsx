import type { Ref } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { createStyles } from "@/registry/theme";

export type SeparatorOrientation = "horizontal" | "vertical";

export type SeparatorProps = Omit<ViewProps, "children"> & {
  /** Default `horizontal`. A vertical Separator stretches to its row's height. */
  orientation?: SeparatorOrientation;
  /**
   * Purely visual (default `true`): hidden from screen readers. Set `false` when the line
   * separates content in a way that matters, so it is exposed with role `separator`.
   */
  decorative?: boolean;
  ref?: Ref<View>;
};

// The `borderWidth.hairline` Token: the thinnest line the screen can draw.
const hairline = StyleSheet.hairlineWidth;

const useStyles = createStyles((t) => ({
  root: { backgroundColor: t.colors.border, flexShrink: 0 },
  horizontal: { height: hairline, alignSelf: "stretch" },
  vertical: { width: hairline, alignSelf: "stretch" },
}));

/**
 * A hairline that divides content, horizontally or vertically, in the `border` Colour Role.
 * Decorative by default. `style` is merged last.
 */
export function Separator({
  orientation = "horizontal",
  decorative = true,
  style,
  ...props
}: SeparatorProps) {
  const styles = useStyles();
  return (
    <View
      role={decorative ? undefined : "separator"}
      aria-hidden={decorative}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : undefined}
      style={[styles.root, styles[orientation], style]}
      {...props}
    />
  );
}
