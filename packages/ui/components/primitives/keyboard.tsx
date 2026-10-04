import { use, type ReactNode, type Ref } from "react";
import type { ViewProps } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
  type KeyboardAwareScrollViewProps,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { SafeAreaInsetsContext, initialWindowMetrics } from "react-native-safe-area-context";

import { useTheme } from "@/registry/theme";

// Keyboard handling, built on react-native-keyboard-controller (SDK-pinned).
//
// Setup: wrap the app once in the root Layout, inside ThemeProvider:
//
//   <ThemeProvider>
//     <KeyboardProvider>
//       <Stack />
//     </KeyboardProvider>
//   </ThemeProvider>
//
// Container scrolls with KeyboardAwareScroll, so the focused field is never hidden by the
// keyboard. A form's main button goes in KeyboardStickyFooter so it stays above the keyboard.

/**
 * Must wrap the whole app once, in the root Layout. Every other keyboard helper needs it.
 * Re-exported from react-native-keyboard-controller unchanged.
 */
export { KeyboardProvider, type KeyboardProviderProps } from "react-native-keyboard-controller";

export type KeyboardAwareScrollProps = KeyboardAwareScrollViewProps & {
  ref?: Ref<KeyboardAwareScrollViewRef>;
  children?: ReactNode;
};

/**
 * A ScrollView that scrolls the focused field into view when the keyboard opens, keeping
 * `bottomOffset` (default: the `spacing[6]` Token) between the field and the keyboard.
 *
 * - `enabled={false}` turns keyboard avoidance off (a plain ScrollView).
 * - `extraKeyboardSpace` adds room at the bottom, e.g. the height of a KeyboardStickyFooter
 *   rendered below this scroll view, so the last field is not hidden behind the footer.
 * - Taps on buttons work while the keyboard is open (`keyboardShouldPersistTaps="handled"`).
 *
 * Every other ScrollView prop passes through.
 */
export function KeyboardAwareScroll({
  bottomOffset,
  keyboardShouldPersistTaps = "handled",
  ...props
}: KeyboardAwareScrollProps) {
  const { spacing } = useTheme();
  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset ?? spacing[6]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    />
  );
}

export type KeyboardStickyFooterProps = ViewProps & {
  children?: ReactNode;
  /** Space above and below the footer's content (default: the `spacing[3]` Token). */
  gap?: number;
  /**
   * Keep clear of the home indicator while the keyboard is closed (default `true`). Turn it
   * off when a parent already pads the bottom safe area.
   */
  safeArea?: boolean;
  /** Turn the keyboard tracking off; the footer then stays put (default `true`). */
  enabled?: boolean;
};

/**
 * Keeps a form's main button above the keyboard: it sits at the bottom of the Screen and
 * moves up with the keyboard, `gap` above it. Render it below the scrolling content (as the
 * last child of a full-height column), not inside the ScrollView.
 */
export function KeyboardStickyFooter({
  gap,
  safeArea = true,
  enabled = true,
  style,
  ...props
}: KeyboardStickyFooterProps) {
  const { spacing } = useTheme();
  const insets = use(SafeAreaInsetsContext) ?? initialWindowMetrics?.insets;
  const space = gap ?? spacing[3];
  const bottomInset = safeArea ? (insets?.bottom ?? 0) : 0;

  return (
    <KeyboardStickyView
      enabled={enabled}
      // The keyboard covers the home-indicator area, so drop that inset when it is open.
      offset={{ closed: 0, opened: bottomInset }}
      style={[{ paddingTop: space, paddingBottom: space + bottomInset }, style]}
      {...props}
    />
  );
}
