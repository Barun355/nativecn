import type { RegistryItem } from "shadcn/schema";

// Primitives: behaviour and accessibility foundations, no visuals (identical in every Style).
const primitive = (
  name: string,
  description: string,
  dependencies?: string[],
  registryDependencies?: string[],
): RegistryItem => ({
  name,
  type: "registry:ui",
  description,
  ...(dependencies ? { dependencies } : {}),
  ...(registryDependencies ? { registryDependencies } : {}),
  files: [
    {
      path: `components/primitives/${name}.tsx`,
      type: "registry:ui",
      target: `{components}/primitives/${name}.tsx`,
    },
  ],
});

export default [
  primitive(
    "form-field-context",
    "Links a field to its label, description and error for screen readers; passes status, disabled and required down.",
  ),
  primitive(
    "focus-chain",
    "Automatic Next/Done between fields in on-screen order; Done submits the form.",
  ),
  primitive(
    "portal",
    "Renders content above every Screen (above native modals on iOS), layered and safe-area aware.",
    ["react-native-safe-area-context", "react-native-screens"],
  ),
  primitive(
    "selection-group",
    "Single or multiple choice within a group, with radio, tab or checkbox roles and selected states.",
    undefined,
    ["use-controllable-state"],
  ),
] satisfies RegistryItem[];
