import { LoaderCircle } from "lucide-react-native";
import { useEffect, type Ref } from "react";
import type { View, ViewProps } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "@/registry/components/icon";
import { useMotion } from "@/registry/hooks/use-motion";
import { createStyles, useTheme, type ColorRole } from "@/registry/theme";

/** Spinner sizes, from the `iconSize` Tokens (scaled): sm 16 · md 20 · lg 24. */
export type SpinnerSize = "sm" | "md" | "lg";

/** One full turn lasts this many `slow` motion Tokens (2 × 400 = 800ms). */
const TURN_IN_SLOW_STEPS = 2;

export type SpinnerProps = Omit<ViewProps, "children"> & {
  /** sm 16 · md 20 · lg 24, before Scale (default `md`). */
  size?: SpinnerSize;
  /** A Colour Role (default `foreground`). */
  color?: ColorRole;
  /** What is loading, for screen readers (default `"Loading"`). */
  "aria-label"?: string;
  ref?: Ref<View>;
};

const useStyles = createStyles((t) => ({
  sm: { width: t.iconSize.sm, height: t.iconSize.sm },
  md: { width: t.iconSize.md, height: t.iconSize.md },
  lg: { width: t.iconSize.lg, height: t.iconSize.lg },
}));

/**
 * An indeterminate loading indicator: a Lucide `LoaderCircle` turning at a steady pace. It is
 * announced as a busy progress bar named "Loading" (override with `aria-label`). Under Reduce
 * Motion it stays still. Inside a busy parent (e.g. a loading Button) pass `aria-hidden` so it
 * is not read twice. `style` is merged last.
 */
export function Spinner({
  size = "md",
  color = "foreground",
  "aria-label": label = "Loading",
  "aria-hidden": hidden,
  style,
  ...props
}: SpinnerProps) {
  const { motion } = useTheme();
  const { reduced } = useMotion();
  const styles = useStyles();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(rotation);
      rotation.set(0);
      return;
    }
    rotation.set(
      withRepeat(
        withTiming(360, {
          duration: motion.duration.slow * TURN_IN_SLOW_STEPS,
          easing: Easing.linear,
        }),
        -1,
      ),
    );
    return () => cancelAnimation(rotation);
  }, [reduced, motion, rotation]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));

  return (
    <Animated.View
      role={hidden ? undefined : "progressbar"}
      aria-label={hidden ? undefined : label}
      aria-busy={!hidden}
      aria-hidden={hidden}
      accessible={!hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "yes"}
      style={[styles[size], spin, style]}
      {...props}
    >
      <Icon icon={LoaderCircle} size={size} color={color} />
    </Animated.View>
  );
}
