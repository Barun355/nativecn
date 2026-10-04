import type { RegistryItem } from "shadcn/schema";

// Primitives: behaviour and accessibility foundations, no visuals (identical in every Style).
const primitive = (
  name: string,
  description: string,
  dependencies: string[] | undefined,
  registryDependencies: string[] | undefined,
  extra: Pick<RegistryItem, "title" | "categories" | "meta">,
): RegistryItem => ({
  name,
  type: "registry:ui",
  description,
  ...extra,
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
    undefined,
    undefined,
    {
      title: "FormField context",
      categories: ["forms"],
      meta: {
        kind: "Primitive",
        props: {
          FormFieldProvider: {
            label: "string: the visible label and the control's accessible name",
            description: "string: helper text, read as the control's hint while there is no error",
            error: "string: read as the hint instead, and announced once when it appears",
            status: "'error' | 'success' (defaults to 'error' while error is set)",
            disabled: "boolean (default false)",
            required: 'boolean: adds "required" to the spoken name (default false)',
            children: "the field's control",
          },
          useFormField: {
            "useFormField()":
              "FormFieldState | null: label, description, error, status, disabled, required and accessibilityProps to spread onto the control; null outside a field",
          },
          FormFieldContext: { value: "FormFieldState | null: the raw context" },
        },
        docs: "FormField renders FormFieldProvider; a custom control calls useFormField() and spreads accessibilityProps onto its focusable element, so it reads as one element (name, then hint or error). Controls take status and disabled from the field unless set on the control itself.",
        keywords: ["form field", "context", "accessibility", "label", "error", "hint", "a11y"],
      },
    },
  ),
  primitive(
    "focus-chain",
    "Automatic Next/Done between fields in on-screen order; Done submits the form.",
    undefined,
    undefined,
    {
      title: "FocusChain",
      categories: ["forms"],
      meta: {
        kind: "Primitive",
        props: {
          FocusChain: {
            children: "the form's fields",
            onSubmit: '() => void: called when "Done" is pressed on the last field',
          },
          useFocusChainField: {
            "useFocusChainField(ref, options?)":
              "registers a field and returns { returnKeyType, onSubmitEditing, submitBehavior } to spread onto its TextInput",
            "options.disabled / options.hidden": "boolean: the chain skips the field",
            "options.multiline": "boolean: skipped so Enter keeps adding new lines (Textarea)",
            "options.returnKeyType / options.onSubmitEditing / options.submitBehavior":
              "the field's own values win over the chain's",
          },
        },
        docs: "Wrap a form's fields in FocusChain: each field's return key reads Next and moves focus to the next field in on-screen order; the last reads Done and calls onSubmit. Input joins automatically; Textarea is skipped. Custom fields join with useFocusChainField.",
        keywords: ["focus", "next field", "return key", "keyboard", "form", "done", "submit"],
      },
    },
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
    {
      title: "Keyboard",
      categories: ["layout"],
      meta: {
        kind: "Primitive",
        props: {
          KeyboardProvider: {
            children:
              "the whole app, once, in the root Layout (re-exported from react-native-keyboard-controller)",
          },
          KeyboardAwareScroll: {
            "...KeyboardAwareScrollViewProps":
              "react-native-keyboard-controller's KeyboardAwareScrollView props (enabled, extraKeyboardSpace, ...)",
            ref: "Ref<KeyboardAwareScrollViewRef>",
          },
          KeyboardStickyFooter: {
            "...ViewProps": "View props pass through",
            gap: "number: space above and below the content (default the spacing[3] Token)",
            safeArea:
              "boolean (default true): keep clear of the home indicator while the keyboard is closed; off when a parent already pads it",
            enabled: "boolean (default true): follow the keyboard",
          },
        },
        docs: "react-native-keyboard-controller is SDK-pinned (`npx expo install`). init and create wrap the root Layout in KeyboardProvider, inside ThemeProvider. Container already scrolls with KeyboardAwareScroll; put a form's main Button in KeyboardStickyFooter below the Container so it stays above the keyboard.",
        keywords: [
          "keyboard",
          "keyboard avoiding",
          "sticky footer",
          "scroll",
          "keyboard controller",
        ],
      },
    },
  ),
  primitive(
    "portal",
    "Renders content above every Screen (above native modals on iOS), layered and safe-area aware.",
    ["react-native-safe-area-context", "react-native-screens"],
    undefined,
    {
      title: "Portal",
      categories: ["overlay"],
      meta: {
        kind: "Primitive",
        props: {
          Portal: {
            children: "ReactNode: drawn in the host, above every Screen",
            hostName: 'string: the PortalHost to render into (default "root")',
            layer: "number (default 0): stacking within the host; higher draws on top",
          },
          PortalHost: {
            name: 'string (default "root"): which Portals this host renders; one default host goes in the root Layout',
          },
          usePortalInsets: {
            "usePortalInsets()": "EdgeInsets: the safe-area insets of the window the host covers",
          },
        },
        docs: "init and create add <PortalHost /> to the root Layout. On iOS the host draws inside FullWindowOverlay, so Portals (Toasts, sheets, menus) sit above native modals too. A host never blocks touches outside its content.",
        keywords: ["portal", "overlay", "layer", "modal", "z-index", "above"],
      },
    },
  ),
  primitive(
    "selection-group",
    "Single or multiple choice within a group, with radio, tab or checkbox roles and selected states.",
    undefined,
    ["use-controllable-state"],
    {
      title: "SelectionGroup",
      categories: ["forms"],
      meta: {
        kind: "Primitive",
        props: {
          SelectionGroup: {
            type: '"single" (default) | "multiple"',
            value: "string (single) | string[] (multiple): controlled",
            defaultValue: "string | string[]: uncontrolled",
            onValueChange: "(value) => void",
            itemRole:
              '"radio" | "tab" | "checkbox" (default radio for single, checkbox for multiple)',
            disabled: "boolean: disables every item",
            ref: "Ref<View>",
          },
          useSelectionItem: {
            "useSelectionItem({ value, disabled? })":
              "{ selected, disabled, select, itemProps }: spread itemProps onto the item's Pressable (role, aria-checked/selected, tabIndex, onPress)",
          },
          useSelectionGroup: {
            "useSelectionGroup()":
              "the group's context: selected values, items, select, move (single only: arrow keys, swipes) and the roving tab stop",
          },
        },
        docs: "The behaviour under RadioGroup, SegmentedTabs and ChipGroup: one implementation of single and multiple choice, roles and selected states, controlled or uncontrolled. Build a custom group by rendering SelectionGroup and calling useSelectionItem in each item.",
        keywords: [
          "selection",
          "radio group",
          "tabs",
          "toggle group",
          "single choice",
          "multiple choice",
        ],
      },
    },
  ),
  primitive(
    "pressable",
    "Pressed look from a Style Slot, tap area extended to 48, no handlers while disabled or loading, optional haptics, role and aria-* states.",
    ["expo-haptics"],
    ["theme"],
    {
      title: "Pressable",
      categories: ["interaction"],
      meta: {
        kind: "Primitive",
        props: {
          Pressable: {
            "...PressableProps":
              "React Native Pressable props pass through (onPress, role, aria-*, ...)",
            pressedStyle:
              "ViewStyle: the pressed look, usually a Style Slot such as button.pressed",
            disabled: "boolean: blocks every press handler, announced disabled",
            loading: "boolean: blocks every press handler, announced busy",
            haptic: '"selection" | "light": fires only when config.haptics is on',
            size: "{ width?, height? }: the visual size used to extend the tap area to 48; missing sides are measured",
            hitSlop: "Insets | number: an explicit tap-area extension; overrides the computed one",
            style: "ViewStyle or (state) => ViewStyle, merged last",
            ref: "Ref<View>",
          },
          touchTargetHitSlop: {
            "touchTargetHitSlop(width, height, min)":
              "Insets | undefined: the extra area on each side so the element reaches min on both axes",
          },
        },
        docs: "The press foundation of every pressable Component. Press feedback is a Style Slot applied instantly on press, identical on iOS and Android (no ripple). The tap area reaches theme.minTouchTarget (48) through hitSlop. Use the role / aria-* props, not accessibility*.",
        keywords: ["pressable", "touchable", "press", "tap target", "hit slop", "haptics", "48"],
      },
    },
  ),
] satisfies RegistryItem[];
