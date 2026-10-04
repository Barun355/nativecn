import { useEffect, type Ref } from "react";
import type { DimensionValue, View, ViewProps } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useMotion } from "@/registry/hooks/use-motion";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

/** The lowest opacity of the pulse; it eases back to 1 and repeats. */
const PULSE_MIN_OPACITY = 0.5;

export type SkeletonProps = Omit<ViewProps, "children"> & {
  /** A number or a percentage, e.g. `120` or `"60%"`. */
  width?: DimensionValue;
  /** A number or a percentage. With `circle` and no `width`, it is also the width. */
  height?: DimensionValue;
  /** A round placeholder (an avatar): fully rounded, square unless both sides are given. */
  circle?: boolean;
  ref?: Ref<View>;
};

const useStyles = createStyles((t) => ({
  root: { ...slot("skeleton.root", t), backgroundColor: t.colors.muted },
  circle: { borderRadius: t.radius.full },
}));

/**
 * A placeholder shape shown while content loads. It pulses gently, and stays still under Reduce
 * Motion. Always hidden from screen readers: announce loading on the container (e.g.
 * `aria-busy`) instead. `style` is merged last.
 */
export function Skeleton({ width, height, circle = false, style, ...props }: SkeletonProps) {
  const styles = useStyles();
  const motion = useMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (motion.reduced) {
      cancelAnimation(opacity);
      opacity.set(1);
      return;
    }
    opacity.set(withRepeat(withTiming(PULSE_MIN_OPACITY, motion.timing("slow")), -1, true));
    return () => cancelAnimation(opacity);
  }, [motion, opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  // Only the given sides, so an unset one never overrides `style`.
  const w = circle ? (width ?? height) : width;
  const h = circle ? (height ?? width) : height;
  const size = { ...(w != null ? { width: w } : {}), ...(h != null ? { height: h } : {}) };

  return (
    <Animated.View
      aria-hidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, circle ? styles.circle : null, size, pulse, style]}
      {...props}
    />
  );
}
