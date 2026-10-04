import { useMemo } from "react";
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  ReduceMotion,
  useReducedMotion,
  type WithSpringConfig,
  type WithTimingConfig,
} from "react-native-reanimated";

import { useTheme } from "@/registry/theme";
import type { motion as motionTokens } from "@/registry/theme/tokens";

export type MotionDuration = keyof typeof motionTokens.duration;
export type MotionEasing = keyof typeof motionTokens.easing;
export type MotionSpring = keyof typeof motionTokens.spring;

/**
 * Enter/exit presets for the `entering` / `exiting` props of an Animated component:
 * - `fade`: opacity only.
 * - `from-top`: fades in moving down into place, and leaves the same way (Toast at the top).
 * - `from-bottom`: fades in moving up into place, and leaves the same way (Toast at the bottom).
 */
export type MotionTransition = "fade" | "from-top" | "from-bottom";

/** A Reanimated layout-animation builder, ready for `entering` / `exiting`. */
export type MotionEntering = InstanceType<(typeof enterPresets)[MotionTransition]>;
export type MotionExiting = InstanceType<(typeof exitPresets)[MotionTransition]>;

export type Motion = {
  /** Reduce Motion is on: every helper below returns an instant (no-animation) value. */
  reduced: boolean;
  /** A duration Token in ms; `0` under Reduce Motion. */
  duration: (name: MotionDuration) => number;
  /** Config for `withTiming`, from a duration and an easing Token. Defaults: `base`, `standard`. */
  timing: (duration?: MotionDuration, easing?: MotionEasing) => WithTimingConfig;
  /** Config for `withSpring`, from a spring Token. Default: `snappy`. */
  spring: (name?: MotionSpring) => WithSpringConfig;
  /**
   * For `entering`: `base` duration with the `enter` (decelerate) easing.
   * `undefined` under Reduce Motion, so the view appears in place.
   */
  entering: (kind?: MotionTransition) => MotionEntering | undefined;
  /**
   * For `exiting`: `fast` duration with the `exit` (accelerate) easing; leaving is quicker
   * than arriving so dismissals feel responsive. `undefined` under Reduce Motion.
   */
  exiting: (kind?: MotionTransition) => MotionExiting | undefined;
};

const enterPresets = { fade: FadeIn, "from-top": FadeInUp, "from-bottom": FadeInDown };
const exitPresets = { fade: FadeOut, "from-top": FadeOutUp, "from-bottom": FadeOutDown };

/**
 * Animation configs built from the Theme's motion Tokens, honouring Reduce Motion.
 *
 * ```tsx
 * const motion = useMotion();
 * <Animated.View entering={motion.entering("from-top")} exiting={motion.exiting("from-top")} />
 * progress.value = withTiming(1, motion.timing("slow"));
 * offset.value = withSpring(on ? 20 : 0, motion.spring("snappy"));
 * ```
 *
 * Under Reduce Motion, timing and spring configs carry `ReduceMotion.Always` (the value jumps
 * to its end) and enter/exit presets are `undefined`. Otherwise configs carry
 * `ReduceMotion.System`, so Reanimated still skips them if the setting changes later.
 */
export function useMotion(): Motion {
  const { motion } = useTheme();
  const reduced = useReducedMotion();

  return useMemo<Motion>(() => {
    const bezier = (name: MotionEasing) => {
      const [x1, y1, x2, y2] = motion.easing[name];
      return Easing.bezier(x1, y1, x2, y2);
    };

    return {
      reduced,
      duration: (name) => (reduced ? 0 : motion.duration[name]),
      timing: (duration = "base", easing = "standard") =>
        reduced
          ? { duration: 0, reduceMotion: ReduceMotion.Always }
          : {
              duration: motion.duration[duration],
              easing: bezier(easing),
              reduceMotion: ReduceMotion.System,
            },
      spring: (name = "snappy") => ({
        ...motion.spring[name],
        reduceMotion: reduced ? ReduceMotion.Always : ReduceMotion.System,
      }),
      entering: (kind = "fade") =>
        reduced
          ? undefined
          : enterPresets[kind]
              .duration(motion.duration.base)
              .easing(bezier("enter"))
              .reduceMotion(ReduceMotion.System),
      exiting: (kind = "fade") =>
        reduced
          ? undefined
          : exitPresets[kind]
              .duration(motion.duration.fast)
              .easing(bezier("exit"))
              .reduceMotion(ReduceMotion.System),
    };
  }, [motion, reduced]);
}
