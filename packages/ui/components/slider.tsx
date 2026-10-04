import * as Haptics from "expo-haptics";
import { useEffect, useState, type Ref } from "react";
import {
  Platform,
  View,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useFormField } from "@/registry/components/primitives/form-field-context";
import { useControllableState } from "@/registry/hooks/use-controllable-state";
import { useMotion } from "@/registry/hooks/use-motion";
import { slot } from "@/registry/styles";
import { createStyles, useTheme } from "@/registry/theme";

export type SliderProps = Omit<
  ViewProps,
  | "style"
  | "children"
  | "role"
  | "accessibilityRole"
  | "accessibilityActions"
  | "onAccessibilityAction"
> & {
  /** The controlled value. */
  value?: number;
  /** The starting value while uncontrolled (default `min`). */
  defaultValue?: number;
  /** Called with each new stepped value while dragging, and on increment/decrement. */
  onValueChange?: (value: number) => void;
  /** Called with the final value when a drag or tap ends, and after increment/decrement. */
  onSlidingComplete?: (value: number) => void;
  /** Default `0`. */
  min?: number;
  /** Default `100`. */
  max?: number;
  /** The distance between allowed values (default `1`). Values always snap to a step. */
  step?: number;
  /** Blocks dragging and the accessibility actions, and is announced as disabled. */
  disabled?: boolean;
  /** Layout only (e.g. width), merged last onto the root. */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
};

/** Clamp to [min, max] and snap to the nearest step from `min`. Runs on the UI thread too. */
export function snapToStep(value: number, min: number, max: number, step: number): number {
  "worklet";
  if (max <= min) return min;
  const clamped = Math.min(max, Math.max(min, value));
  if (!(step > 0)) return clamped;
  const snapped = min + Math.round((clamped - min) / step) * step;
  // Round away float noise (0.1 + 0.2), then keep the last step inside the range.
  const decimals = (String(step).split(".")[1] ?? "").length;
  const rounded = Number(snapped.toFixed(Math.min(decimals, 20)));
  return Math.min(max, rounded);
}

/**
 * The adjustable role. React Native maps `role="slider"` to Android's adjustable role, but on iOS
 * (Fabric) it sets no trait, so VoiceOver would not offer swipe up/down. iOS therefore gets
 * `accessibilityRole="adjustable"` (UIAccessibilityTraitAdjustable), the one `accessibility*`
 * spelling here because the `role` spelling does not work for it.
 */
const adjustableRole =
  Platform.OS === "ios"
    ? ({ accessibilityRole: "adjustable" } as const)
    : ({ role: "slider" } as const);

// Haptics are best effort: an unsupported device must never break a drag.
function tick() {
  try {
    Haptics.selectionAsync().catch(() => {});
  } catch {
    // Ignored, see above.
  }
}

const useStyles = createStyles((t) => {
  const thumb = slot("slider.thumb", t);
  const track = slot("slider.track", t);
  return {
    // At least the 48 touch target tall, so the whole row is easy to grab.
    root: {
      height: Math.max(Number(thumb.height), t.minTouchTarget),
      justifyContent: "center",
    },
    track: {
      ...track,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.secondary,
      overflow: "hidden",
      marginHorizontal: Number(thumb.width) / 2,
    },
    range: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      backgroundColor: t.colors.primary,
    },
    thumb: {
      ...thumb,
      position: "absolute",
      left: 0,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.background,
      borderWidth: t.borderWidth.default,
      borderColor: t.colors.primary,
      boxShadow: t.elevation.sm,
    },
    disabled: { opacity: t.opacity.disabled },
  };
});

/**
 * A Slider: drag or tap the track (Gesture Handler + Reanimated, on the UI thread) to pick a
 * value between `min` and `max`, snapped to `step`, with a light haptic tick per step when
 * `config.haptics` is on. Screen readers get an adjustable control with
 * `aria-valuemin`/`max`/`now` and increment/decrement actions (swipe up/down). Moves are instant
 * under Reduce Motion. Inside FormField it takes its label and disabled state.
 */
export function Slider({
  value,
  defaultValue,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  style,
  onLayout,
  testID,
  "aria-label": ariaLabel,
  accessibilityHint,
  ...props
}: SliderProps) {
  const field = useFormField();
  const { config } = useTheme();
  const motion = useMotion();
  const styles = useStyles();
  const isDisabled = disabled ?? field?.disabled ?? false;

  const [raw, setValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? min,
    onChange: onValueChange,
  });
  const current = snapToStep(raw, min, max, step);
  const fraction = max > min ? (current - min) / (max - min) : 0;

  const thumbSize = Number(styles.thumb.width);
  const width = useSharedValue(0);
  const progress = useSharedValue(fraction);
  const dragging = useSharedValue(false);
  /** The last stepped value reported during the current drag. */
  const lastValue = useSharedValue(current);

  // Bumped when a drag or tap ends, so the thumb settles on the value the parent kept.
  const [settles, setSettles] = useState(0);

  // Follow the value (controlled updates, accessibility actions, the end of a drag).
  useEffect(() => {
    if (dragging.get()) return;
    progress.set(withTiming(fraction, motion.timing("fast")));
    lastValue.set(current);
  }, [fraction, current, settles, motion, progress, dragging, lastValue]);

  // A step reached while dragging: update the value and tick.
  const onStep = (next: number) => {
    setValue(next);
    if (config.haptics) tick();
  };
  const onEnd = (final: number) => {
    onSlidingComplete?.(final);
    setSettles((n) => n + 1);
  };

  const moveTo = (x: number) => {
    "worklet";
    const usable = width.get() - thumbSize;
    if (usable <= 0) return;
    const ratio = Math.min(1, Math.max(0, (x - thumbSize / 2) / usable));
    const next = snapToStep(min + ratio * (max - min), min, max, step);
    progress.set(max > min ? (next - min) / (max - min) : 0);
    if (next !== lastValue.get()) {
      lastValue.set(next);
      scheduleOnRN(onStep, next);
    }
  };
  const end = () => {
    "worklet";
    dragging.set(false);
    scheduleOnRN(onEnd, lastValue.get());
  };

  const pan = Gesture.Pan()
    .enabled(!isDisabled)
    // Horizontal drags only, so a vertical scroll in the Screen still works.
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onStart((e) => {
      dragging.set(true);
      moveTo(e.x);
    })
    .onUpdate((e) => moveTo(e.x))
    .onEnd(end);
  const tap = Gesture.Tap()
    .enabled(!isDisabled)
    .onEnd((e, success) => {
      if (!success) return;
      dragging.set(true);
      moveTo(e.x);
      end();
    });
  // Test ids let tests fire the gestures (react-native-gesture-handler/jest-utils).
  if (testID) {
    pan.withTestId(`${testID}-pan`);
    tap.withTestId(`${testID}-tap`);
  }
  const gesture = Gesture.Race(pan, tap);

  const handleLayout = (event: LayoutChangeEvent) => {
    width.set(event.nativeEvent.layout.width);
    onLayout?.(event);
  };

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * Math.max(0, width.get() - thumbSize) }],
  }));
  const rangeStyle = useAnimatedStyle(() => ({
    width: progress.get() * Math.max(0, width.get() - thumbSize),
  }));

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (isDisabled) return;
    const action = event.nativeEvent.actionName;
    if (action !== "increment" && action !== "decrement") return;
    const delta = step > 0 ? step : (max - min) / 10;
    const direction = action === "increment" ? 1 : -1;
    const next = snapToStep(current + direction * delta, min, max, step);
    if (next === current) return;
    setValue(next);
    onSlidingComplete?.(next);
  };

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        {...adjustableRole}
        aria-label={ariaLabel ?? field?.accessibilityProps["aria-label"]}
        accessibilityHint={accessibilityHint ?? field?.accessibilityProps.accessibilityHint}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-disabled={isDisabled}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={handleAccessibilityAction}
        onLayout={handleLayout}
        testID={testID}
        style={[styles.root, isDisabled ? styles.disabled : null, style]}
        {...props}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.range, rangeStyle]} />
        </View>
        <Animated.View
          testID={testID ? `${testID}-thumb` : undefined}
          style={[styles.thumb, thumbStyle]}
        />
      </View>
    </GestureDetector>
  );
}
