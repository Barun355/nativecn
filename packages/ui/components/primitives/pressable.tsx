import * as Haptics from "expo-haptics";
import { useCallback, useState, type ReactNode, type Ref } from "react";
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
  type Insets,
  type LayoutChangeEvent,
  type PressableProps as RNPressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/registry/theme";

/** Haptic feedback on press: `selection` is the light tick for selection controls. */
export type PressableHaptic = "selection" | "light";

/** A declared size; any dimension left out is measured with onLayout. */
export type PressableSize = { width?: number; height?: number };

export type PressableProps = Omit<
  RNPressableProps,
  "disabled" | "hitSlop" | "style" | "children"
> & {
  /** Root style, or a function of the press state. */
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  /**
   * The pressed look, applied instantly while pressed and merged after `style`. Pass the
   * Component's Style Slot result, e.g. `styles.pressed` from its `button.pressed` Style Slot.
   */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Blocks every press handler and is announced as disabled. */
  disabled?: boolean;
  /** Blocks every press handler and is announced as busy (not disabled). */
  loading?: boolean;
  /** Haptic feedback on press. Fires only when `config.haptics` is on in the Theme. */
  haptic?: PressableHaptic;
  /**
   * The visual size used to extend the tap area to the 48 minimum (`theme.minTouchTarget`).
   * Dimensions given here are used as-is (no layout pass needed, e.g. a Variant's fixed
   * height); missing dimensions are measured with onLayout. Ignored when `hitSlop` is set.
   */
  size?: PressableSize;
  /** Explicit tap-area extension. Overrides the computed one. */
  hitSlop?: Insets | number;
  ref?: Ref<View>;
  children?: ReactNode | ((state: PressableStateCallbackType) => ReactNode);
};

/** Extra tap area on each side so a `width` × `height` element reaches `min` on both axes. */
export function touchTargetHitSlop(
  width: number | undefined,
  height: number | undefined,
  min: number,
): Insets | undefined {
  const x = width == null ? 0 : Math.max(0, (min - width) / 2);
  const y = height == null ? 0 : Math.max(0, (min - height) / 2);
  if (x === 0 && y === 0) return undefined;
  return { top: y, bottom: y, left: x, right: x };
}

// Haptics are best effort: an unsupported device must never break a press.
function fireHaptic(haptic: PressableHaptic) {
  try {
    const done =
      haptic === "selection"
        ? Haptics.selectionAsync()
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    done.catch(() => {});
  } catch {
    // Ignored, see above.
  }
}

/**
 * The press foundation of every pressable Component: pressed look from a Style Slot, a tap
 * area of at least 48, no handlers while disabled or loading, optional haptics and
 * `role`/`aria-*`. It draws nothing of its own beyond the styles it is given.
 */
export function Pressable({
  style,
  pressedStyle,
  disabled = false,
  loading = false,
  haptic,
  size,
  hitSlop,
  role = "button",
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  onLayout,
  ref,
  ...props
}: PressableProps) {
  const theme = useTheme();
  const blocked = disabled || loading;
  const [measured, setMeasured] = useState<{ width: number; height: number }>();

  const needsLayout = hitSlop == null && (size?.width == null || size?.height == null);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout?.(event);
      if (!needsLayout) return;
      const { width, height } = event.nativeEvent.layout;
      setMeasured((prev) =>
        prev && prev.width === width && prev.height === height ? prev : { width, height },
      );
    },
    [onLayout, needsLayout],
  );

  const computedHitSlop =
    hitSlop ??
    touchTargetHitSlop(
      size?.width ?? measured?.width,
      size?.height ?? measured?.height,
      theme.minTouchTarget,
    );

  const handlePress = (event: GestureResponderEvent) => {
    if (blocked) return;
    if (haptic && theme.config.haptics) fireHaptic(haptic);
    onPress?.(event);
  };
  const guard =
    (handler: ((event: GestureResponderEvent) => void) | null | undefined) =>
    (event: GestureResponderEvent) => {
      if (!blocked) handler?.(event);
    };

  return (
    <RNPressable
      ref={ref}
      role={role}
      aria-disabled={disabled}
      aria-busy={loading}
      disabled={disabled}
      hitSlop={computedHitSlop}
      onPress={handlePress}
      onLongPress={onLongPress ? guard(onLongPress) : undefined}
      onPressIn={guard(onPressIn)}
      onPressOut={guard(onPressOut)}
      onLayout={onLayout || needsLayout ? handleLayout : undefined}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        state.pressed && !blocked ? pressedStyle : null,
      ]}
      {...props}
    />
  );
}
