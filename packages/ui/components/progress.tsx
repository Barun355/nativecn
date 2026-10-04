import { useEffect, type Ref } from "react";
import { View, type ViewProps } from "react-native";
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

/** The indeterminate bar's length, as a percentage of the track. */
const INDETERMINATE_WIDTH = 40;
/** One indeterminate sweep lasts this many `slow` motion Tokens (3 × 400 = 1200ms). */
const SWEEP_IN_SLOW_STEPS = 3;

export type ProgressProps = Omit<ViewProps, "children"> & {
  /** Percent complete, 0–100 (clamped). Ignored while `indeterminate`. Default `0`. */
  value?: number;
  /** The amount of work is unknown: a bar sweeps along the track and it is announced busy. */
  indeterminate?: boolean;
  ref?: Ref<View>;
};

const useStyles = createStyles((t) => ({
  track: { ...slot("progress.track", t), overflow: "hidden", backgroundColor: t.colors.muted },
  indicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.primary,
  },
}));

const clamp = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

/**
 * A horizontal progress bar. Determinate by default (`value` 0–100), announced as a progress
 * bar with its value; changes animate with the `base` motion Token. `indeterminate` sweeps a
 * bar along the track instead, and is still under Reduce Motion. `style` (e.g. a width) is
 * merged last onto the track.
 */
export function Progress({ value = 0, indeterminate = false, style, ...props }: ProgressProps) {
  const styles = useStyles();
  const motion = useMotion();
  const now = clamp(value);

  // Determinate: the indicator's width in percent. Indeterminate: its left edge in percent.
  const width = useSharedValue(indeterminate ? INDETERMINATE_WIDTH : now);
  const left = useSharedValue(0);

  useEffect(() => {
    if (indeterminate) {
      width.set(INDETERMINATE_WIDTH);
      if (motion.reduced) {
        cancelAnimation(left);
        left.set(0);
        return;
      }
      left.set(-INDETERMINATE_WIDTH);
      left.set(
        withRepeat(
          withTiming(100, {
            ...motion.timing("slow"),
            duration: motion.duration("slow") * SWEEP_IN_SLOW_STEPS,
          }),
          -1,
        ),
      );
      return () => cancelAnimation(left);
    }
    cancelAnimation(left);
    left.set(0);
    width.set(withTiming(now, motion.timing("base")));
  }, [indeterminate, now, motion, width, left]);

  const indicator = useAnimatedStyle(() => ({
    width: `${width.get()}%`,
    left: `${left.get()}%`,
  }));

  return (
    <View
      role="progressbar"
      accessible
      aria-busy={indeterminate}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(now)}
      style={[styles.track, style]}
      {...props}
    >
      <Animated.View style={[styles.indicator, indicator]} />
    </View>
  );
}
