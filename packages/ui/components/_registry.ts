import type { RegistryItem } from "shadcn/schema";

// Components: one file each, Style Slots inlined per Style by the Registry build.
const component = (
  name: string,
  description: string,
  dependencies: string[],
  registryDependencies: string[],
  extra: Pick<RegistryItem, "title" | "categories" | "meta"> = {},
): RegistryItem => ({
  name,
  type: "registry:ui",
  description,
  ...extra,
  ...(dependencies.length ? { dependencies } : {}),
  registryDependencies,
  files: [
    {
      path: `components/${name}.tsx`,
      type: "registry:ui",
      target: `{components}/${name}.tsx`,
    },
  ],
});

// Usage examples (`<item>-demo`), read by the MCP server's get_item_examples. Their source lives
// in the repo-only examples/ folder.
const example = (
  name: string,
  title: string,
  description: string,
  registryDependencies: string[],
): RegistryItem => ({
  name,
  type: "registry:example",
  title,
  description,
  registryDependencies,
  files: [
    {
      path: `examples/${name}.tsx`,
      type: "registry:example",
      target: `{components}/examples/${name}.tsx`,
    },
  ],
});

/** lucide-react-native is the recorded ADR 0007 exception (Lucide decision); react-native-svg is SDK-pinned. */
const LUCIDE = ["lucide-react-native@^1.51.0", "react-native-svg"];

export default [
  component(
    "text",
    "All text: the type ramp as Variants, text Colour Roles, alignment and the font-scaling switch.",
    [],
    ["theme"],
  ),
  component(
    "icon",
    "Every glyph: a Lucide icon at a Token size in a Colour Role, decorative unless labelled.",
    LUCIDE,
    ["theme"],
  ),
  component(
    "button",
    "Button with Variants (primary, secondary, outline, ghost, destructive, link), Sizes, an icon slot, loading and status; icon-only requires aria-label.",
    LUCIDE,
    ["theme", "pressable", "text", "icon", "announce"],
  ),
  component(
    "container",
    "Wraps a Screen: safe-area edges, scrolling, keyboard avoidance, Token padding and a max content width.",
    ["react-native-safe-area-context"],
    ["theme", "keyboard"],
  ),
  {
    // `init`/`create` write `<Toaster />` from `{components}/toast` into the root Layout: keep the name.
    ...component(
      "toast",
      "Sonner-style Toasts: a <Toaster /> in the root Layout and toast(), toast.success/error/info/warning/dismiss. At most 3 stacked, 4s auto-dismiss, swipe away, announced, above native modals.",
      [
        // zustand holds the queue (Design System ADR 0001); the rest are SDK-pinned.
        "zustand@^5.0.15",
        "react-native-gesture-handler",
        "react-native-reanimated",
        "react-native-worklets",
        ...LUCIDE,
      ],
      ["theme", "portal", "text", "icon", "button", "use-motion", "announce"],
    ),
    title: "Toast",
    categories: ["feedback"],
    meta: {
      kind: "Component",
      props: {
        Toaster: {
          position:
            '"top" (default) | "bottom": the edge Toasts appear at; the newest is nearest it',
          hostName: "the PortalHost to render into (default: the root host)",
        },
        toast: {
          "toast(title, options?)": "shows a default Toast and returns its id",
          "toast.success / .error / .info / .warning": "same signature, with the Variant's icon",
          "toast.dismiss(id?)": "dismisses one Toast, or all of them without an id",
          "options.description": "a second, quieter line",
          "options.duration": "ms before it dismisses itself (default 4000; Infinity to keep it)",
          "options.action": "{ label, onPress }: one button; pressing it also dismisses",
          "options.id": "reuse an id to update a Toast in place",
        },
      },
      variants: ["default", "success", "error", "info", "warning"],
      docs: "Render one <Toaster /> in the root Layout next to <PortalHost /> (inside ThemeProvider); `init` and `create` already do. Call toast() from anywhere, including outside React. Server errors and success messages go through toast(), never Alert.alert. At most 3 are visible, stacked, newest nearest the edge; more wait in the queue. Each auto-dismisses after 4s (paused while touched), can be swiped sideways or towards its edge, and is announced to screen readers, which can also dismiss it with the Dismiss action or the escape gesture. Animations follow the motion Tokens and are instant under Reduce Motion. The surface uses the toast.root Style Slot.",
      keywords: [
        "toast",
        "toaster",
        "sonner",
        "snackbar",
        "notification",
        "feedback",
        "success message",
        "error message",
      ],
      examples: ["toast-demo"],
    },
  },
  {
    name: "toast-demo",
    type: "registry:example",
    title: "Toast demo",
    description: "Each Toast Variant, a description and an action.",
    registryDependencies: ["toast", "button"],
    files: [
      {
        path: "examples/toast-demo.tsx",
        type: "registry:example",
        target: "{components}/examples/toast-demo.tsx",
      },
    ],
  },
  component(
    "label",
    'A field\'s visible label in the label type Variant, with a required marker read as "required".',
    [],
    ["theme", "text"],
    {
      title: "Label",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          children: "ReactNode: the label text",
          required: 'boolean: shows * and adds "required" to the spoken name (default false)',
          style: "TextStyle, merged last",
        },
        docs: "Inside a FormField the label is drawn by FormField and read as the control's name; use Label on its own only next to custom controls. Text props pass through.",
        keywords: ["label", "field label", "required", "form"],
        examples: ["label-demo"],
      },
    },
  ),
  component(
    "form-field",
    'Lays out a control with its Label, description and error, and links them for screen readers ("Email, text field, Enter a valid email").',
    [],
    ["theme", "form-field-context", "label", "text"],
    {
      title: "FormField",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          label: "string: the visible label and the control's accessible name",
          description: "string: helper text under the control, read as its hint",
          error: "string: replaces the description, sets status error, announced once",
          required: 'boolean: * marker and "required" in the spoken name (default false)',
          status: "'error' | 'success' (defaults to 'error' while error is set)",
          disabled: "boolean: passed down to the control (default false)",
          children: "the control: Input, Textarea, InputOTP, Checkbox, Switch, Slider",
          style: "ViewStyle, layout only, merged last",
        },
        docs: "Wrap each field of a form in FormField, and the fields in FocusChain. FormField is library-neutral: with react-hook-form, render it inside a Controller and pass fieldState.error?.message as error. The visible label, description and error are hidden from screen readers because the control reads them as its name and hint.",
        keywords: ["form", "field", "label", "error", "validation", "helper text", "description"],
        examples: ["form-field-demo"],
      },
    },
  ),
  component(
    "input",
    "Single-line text field with Sizes, a leading icon, error/success status, a focus ring and an automatic Show/Hide password toggle.",
    LUCIDE,
    ["theme", "form-field-context", "focus-chain", "pressable", "icon", "announce"],
    {
      title: "Input",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          "...TextInputProps":
            "React Native TextInput props pass through (value, defaultValue, onChangeText, keyboardType, ...)",
          size: "'sm' | 'md' | 'lg' (default 'md')",
          icon: "LucideIcon: leading, decorative",
          status: "'error' | 'success': colours and a screen-reader announcement",
          disabled: "boolean: not editable, dimmed, skipped by FocusChain",
          secureTextEntry: "boolean: hides the text and adds a Show/Hide password toggle",
          ref: "Ref<TextInput>",
          style: "ViewStyle, layout only, merged last onto the frame",
        },
        variants: { size: ["sm", "md", "lg"], status: ["error", "success"] },
        docs: "Inside FormField the label becomes the name and the error the hint; status and disabled come from the field. Inside FocusChain the return key reads Next/Done automatically; a field's own returnKeyType/onSubmitEditing wins. Precedence: disabled > status.",
        keywords: ["input", "text field", "text input", "password", "email", "textbox"],
        examples: ["input-demo"],
      },
    },
  ),
  component(
    "textarea",
    "Multi-line text field that grows from minRows to maxRows, with a character counter when maxLength is set.",
    [],
    ["theme", "input", "text", "use-controllable-state"],
    {
      title: "Textarea",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          "...InputProps": "Input's props except icon and secureTextEntry",
          minRows: "number: rows shown when empty (default 3)",
          maxRows: "number: grows up to this many rows, then scrolls (default 8)",
          maxLength: "number: limits the text and shows an n/max counter",
          style: "ViewStyle, layout only, merged last onto the root",
        },
        variants: { size: ["sm", "md", "lg"], status: ["error", "success"] },
        docs: "FocusChain skips Textarea so Enter keeps adding new lines. Works controlled (value + onChangeText) or uncontrolled (defaultValue).",
        keywords: ["textarea", "multiline", "notes", "comment", "message", "bio", "counter"],
        examples: ["textarea-demo"],
      },
    },
  ),
  component(
    "search-field",
    "Search box with a search icon, an automatic clear (×) button, a loading spinner and onSubmit from the keyboard's Search key.",
    LUCIDE,
    ["theme", "pressable", "icon", "use-controllable-state"],
    {
      title: "SearchField",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          value: "string (controlled)",
          defaultValue: "string (uncontrolled)",
          onChangeText: "(text: string) => void",
          onSubmit: "(value: string) => void: the keyboard's Search key",
          placeholder: 'string (default "Search"); also the accessible name',
          loading: "boolean: a spinner replaces the search icon; announced busy",
          disabled: "boolean",
          ref: "Ref<TextInput>",
          style: "ViewStyle, layout only, merged last",
        },
        docs: 'The clear button appears while there is text; it clears it (calling onChangeText("")) and keeps focus. TextInput props pass through.',
        keywords: ["search", "search bar", "filter", "query", "find"],
        examples: ["search-field-demo"],
      },
    },
  ),
  example("label-demo", "Label demo", "A Label and a required Label.", ["label"]),
  example(
    "form-field-demo",
    "FormField demo",
    "Email and password fields in a FocusChain, with a description and an error.",
    ["form-field", "input", "focus-chain"],
  ),
  example(
    "input-demo",
    "Input demo",
    "Inputs with an icon, Sizes, a status and a password toggle.",
    ["input"],
  ),
  example(
    "textarea-demo",
    "Textarea demo",
    "A Textarea with a character counter inside a FormField.",
    ["form-field", "textarea"],
  ),
  example(
    "search-field-demo",
    "SearchField demo",
    "A controlled SearchField with loading and onSubmit.",
    ["search-field"],
  ),
] satisfies RegistryItem[];
