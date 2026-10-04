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
    "keyboard",
    "KeyboardProvider setup, a scroll view that keeps the focused field above the keyboard, and a footer that keeps a form's main button above it.",
    [
      "react-native-keyboard-controller",
      "react-native-reanimated",
      "react-native-worklets",
      "react-native-safe-area-context",
    ],
    ["theme"],
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
  primitive(
    "pressable",
    "Pressed look from a Style Slot, tap area extended to 48, no handlers while disabled or loading, optional haptics, role and aria-* states.",
    ["expo-haptics"],
    ["theme"],
  ),
] satisfies RegistryItem[];
