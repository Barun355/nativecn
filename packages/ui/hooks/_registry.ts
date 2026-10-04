import type { RegistryItem } from "shadcn/schema";

// Primitive hooks: behaviour only, identical in every Style.
export default [
  {
    name: "use-controllable-state",
    type: "registry:hook",
    description: "One implementation of controlled and uncontrolled values for form controls.",
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
    description:
      "Enter/exit animations and timing/spring configs from the motion Tokens; instant when Reduce Motion is on.",
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
