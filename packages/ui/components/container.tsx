import { use, type ReactNode, type Ref } from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import {
  SafeAreaInsetsContext,
  initialWindowMetrics,
  type Edge,
} from "react-native-safe-area-context";

import { KeyboardAwareScroll } from "@/registry/components/primitives/keyboard";
import { createStyles } from "@/registry/theme";

export type ContainerEdge = Edge;

export type ContainerProps = ViewProps & {
  children?: ReactNode;
  /** Scroll the content (default `true`). */
  scroll?: boolean;
  /**
   * Keep the focused field above the keyboard (default `true`). Needs `scroll`; it maps to
   * KeyboardAwareScroll's `enabled`.
   */
  keyboard?: boolean;
  /** Pad the content by the Theme's spacing Tokens (default `true`). */
  padded?: boolean;
  /**
   * Safe-area edges to keep clear of (default `['top', 'bottom']`). Drop `'bottom'` when a
   * KeyboardStickyFooter below the Container already pads the bottom safe area.
   */
  edges?: readonly ContainerEdge[];
  /** Caps the content width and centres it, e.g. on tablets (default `640`). */
  maxWidth?: number;
  /**
   * Extra room below the content when the keyboard is open, e.g. the height of a
   * KeyboardStickyFooter rendered after the Container.
   */
  extraKeyboardSpace?: number;
  /** Style for the content wrapper, merged after the Container's own padding and gap. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
};

const DEFAULT_EDGES: readonly ContainerEdge[] = ["top", "bottom"];

const useStyles = createStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  scroll: { flex: 1 },
  content: { flexGrow: 1, width: "100%", alignSelf: "center", gap: t.spacing[4] },
  static: { flex: 1 },
  padded: { paddingHorizontal: t.spacing[4], paddingVertical: t.spacing[4] },
}));

/**
 * Wraps a Screen's content: keeps it clear of the safe area, scrolls it, keeps the focused field
 * above the keyboard, pads it and caps its width. Wrap every Screen in it. `style` is merged
 * last onto the root.
 */
export function Container({
  children,
  scroll = true,
  keyboard = true,
  padded = true,
  edges = DEFAULT_EDGES,
  maxWidth = 640,
  extraKeyboardSpace,
  contentContainerStyle,
  style,
  ...props
}: ContainerProps) {
  const styles = useStyles();
  const insets = use(SafeAreaInsetsContext) ?? initialWindowMetrics?.insets;

  const safeArea: ViewStyle = {
    paddingTop: edges.includes("top") ? (insets?.top ?? 0) : 0,
    paddingBottom: edges.includes("bottom") ? (insets?.bottom ?? 0) : 0,
    paddingLeft: edges.includes("left") ? (insets?.left ?? 0) : 0,
    paddingRight: edges.includes("right") ? (insets?.right ?? 0) : 0,
  };
  const content = [
    styles.content,
    { maxWidth },
    padded ? styles.padded : null,
    contentContainerStyle,
  ];

  return (
    <View style={[styles.root, safeArea, style]} {...props}>
      {scroll ? (
        <KeyboardAwareScroll
          enabled={keyboard}
          extraKeyboardSpace={extraKeyboardSpace}
          style={styles.scroll}
          contentContainerStyle={content}
        >
          {children}
        </KeyboardAwareScroll>
      ) : (
        <View style={[styles.static, ...content]}>{children}</View>
      )}
    </View>
  );
}
