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
] satisfies RegistryItem[];
