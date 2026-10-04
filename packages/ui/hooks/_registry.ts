import type { RegistryItem } from "shadcn/schema";

// Primitive hooks: behaviour only, identical in every Style.
export default [
  {
    name: "use-controllable-state",
    type: "registry:hook",
    title: "useControllableState",
    description: "One implementation of controlled and uncontrolled values for form controls.",
    categories: ["state"],
    meta: {
      kind: "Primitive",
      props: {
        useControllableState: {
          "useControllableState({ value, defaultValue, onChange })":
            "[value, setValue]: the current value and a stable setter that accepts a value or an updater",
          value: "T | undefined: anything but undefined makes the state controlled",
          defaultValue: "T: the starting value while uncontrolled",
          onChange:
            "(value: T) => void: called whenever the setter changes the value, in both modes",
        },
      },
      docs: "Controlled: the returned value is always `value` and the setter only calls onChange. Uncontrolled: the hook holds the value from defaultValue and still calls onChange. Setting the same value (Object.is) does nothing. Warns in development when a component switches between controlled and uncontrolled. Every nativecn form control uses it, so each works with value + change handler or defaultValue.",
      keywords: ["controlled", "uncontrolled", "state", "value", "defaultValue", "form control"],
    },
    files: [
      {
        path: "hooks/use-controllable-state.ts",
        type: "registry:hook",
        target: "{hooks}/use-controllable-state.ts",
      },
    ],
  },
  {
    name: "use-motion",
    type: "registry:hook",
    title: "useMotion",
    description:
      "Enter/exit animations and timing/spring configs from the motion Tokens; instant when Reduce Motion is on.",
    categories: ["motion"],
    meta: {
      kind: "Primitive",
      props: {
        useMotion: {
          "useMotion()": "Motion: the helpers below, all instant under Reduce Motion",
          reduced: "boolean: Reduce Motion is on",
          "duration(name)": "number: a duration Token in ms (0 under Reduce Motion)",
          "timing(duration?, easing?)": "withTiming config from Tokens (defaults base, standard)",
          "spring(name?)": "withSpring config from a spring Token (default snappy)",
          "entering(kind?) / exiting(kind?)":
            '"fade" | "from-top" | "from-bottom": a Reanimated layout animation, or undefined under Reduce Motion',
        },
      },
      docs: "Every animation in nativecn goes through useMotion so Reduce Motion is honoured in one place. Pass entering/exiting to an Animated.View's entering/exiting props; pass timing()/spring() to withTiming/withSpring. Reanimated and Worklets are SDK-pinned.",
      keywords: ["animation", "motion", "reduce motion", "reanimated", "transition", "spring"],
    },
    dependencies: ["react-native-reanimated", "react-native-worklets"],
    registryDependencies: ["theme"],
    files: [
      {
        path: "hooks/use-motion.ts",
        type: "registry:hook",
        target: "{hooks}/use-motion.ts",
      },
    ],
  },
] satisfies RegistryItem[];
