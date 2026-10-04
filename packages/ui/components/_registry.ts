import type { RegistryItem } from "shadcn/schema";

import type { DocumentedMeta } from "../scripts/registry/meta.ts";

// Components: one file each, Style Slots inlined per Style by the Registry build.
const component = (
  name: string,
  description: string,
  dependencies: string[],
  registryDependencies: string[],
  extra: Pick<RegistryItem, "title" | "categories"> & { meta?: DocumentedMeta } = {},
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

/** Accessibility facts every Drawer Block shares: they all come from the drawer Component. */
const DRAWER_BLOCK_A11Y = [
  "Each item is a DrawerItem: role link with aria-selected while its route is active, or role button for an action without href.",
  "An item's visible label is its accessible name.",
  "Items are 48 high in Vega and 40 in Nova, with the tap area extended to 48.",
];

// Drawer Blocks: the panel of a drawer Layout (a Block that is navigation, not a Screen). One
// `index.tsx` in `components/<block>/`, installed into `{components}/<block>/` as a
// registry:component file (Registry layout, #13; ADR 0008). Style Slots are inlined as in a
// Component.
const drawerBlock = (
  name: string,
  component: string,
  title: string,
  description: string,
  difference: string,
  a11y: string[],
  dependencies: string[],
  registryDependencies: string[],
): RegistryItem => ({
  name,
  type: "registry:block",
  title,
  description,
  categories: ["navigation"],
  meta: {
    kind: "Block",
    component,
    difference,
    docs: `In app/(drawer)/_layout.tsx, with Expo Router's drawer from expo-router/drawer (never @react-navigation/drawer or the npm package expo-drawer): <Drawer drawerContent={(props) => <${component} {...props} />} />. Spread every drawerContent prop in, so items can close the drawer. Tapping an item navigates and closes the drawer; the backdrop and the system back gesture also close it. Names, avatars, counts, items and routes are placeholders: rename them and point each href at a route in your drawer Layout. Item heights follow the drawer.item Style Slot (Vega 48, Nova 40), and the panel keeps clear of the status bar and home indicator.`,
    a11y: [...DRAWER_BLOCK_A11Y, ...a11y],
    keywords: ["drawer", "side menu", "sidebar", "navigation drawer", "hamburger menu", "nav menu"],
  },
  dependencies,
  registryDependencies,
  files: [
    {
      path: `components/${name}/index.tsx`,
      type: "registry:component",
      target: `{components}/${name}/index.tsx`,
    },
  ],
});

/** lucide-react-native is the recorded ADR 0007 exception (Lucide decision); react-native-svg is SDK-pinned. */
const LUCIDE = ["lucide-react-native@^1.51.0", "react-native-svg"];
/** Reanimated and its Worklets runtime are SDK-pinned. */
const REANIMATED = ["react-native-reanimated", "react-native-worklets"];

export default [
  component(
    "text",
    "All text: the type ramp as Variants, text Colour Roles, alignment and the font-scaling switch.",
    [],
    ["theme"],
    {
      title: "Text",
      categories: ["core"],
      meta: {
        kind: "Component",
        props: {
          Text: {
            "...TextProps": "React Native Text props pass through (numberOfLines, onPress, ...)",
            variant:
              '"display" | "h1" | "h2" | "h3" | "h4" | "lead" | "body" (default) | "label" | "small" | "caption" | "button"',
            color:
              'a text Colour Role: "foreground" (default), any "…Foreground" role, "primary", "destructive", "success", "warning", "info"',
            align: '"auto" | "left" | "right" | "center" | "justify"',
            selectable: "boolean (default true for body and small, false otherwise)",
            allowFontScaling: "boolean (default: config.fontScaling in theme/config.ts)",
            ref: "Ref<Text>",
            style: "TextStyle, merged last",
          },
        },
        variants: [
          "display",
          "h1",
          "h2",
          "h3",
          "h4",
          "lead",
          "body",
          "label",
          "small",
          "caption",
          "button",
        ],
        docs: "The single typographic Component: use it for all text, never React Native's Text or a separate Heading. display and h1–h4 use the Heading Font; the rest use the Body Font.",
        a11y: [
          "display and h1–h4 have role heading, so screen readers can jump between headings.",
          "Font scaling follows the switch in theme/config.ts (off by default); allowFontScaling overrides it for one Text.",
          "When font scaling is on, the chrome Variants (label, caption, button) cap the OS font scale at 1.5×.",
        ],
        keywords: [
          "text",
          "typography",
          "heading",
          "title",
          "paragraph",
          "label",
          "caption",
          "font",
        ],
        examples: ["text-demo"],
      },
    },
  ),
  component(
    "icon",
    "Every glyph: a Lucide icon at a Token size in a Colour Role, decorative unless labelled.",
    LUCIDE,
    ["theme"],
    {
      title: "Icon",
      categories: ["core"],
      meta: {
        kind: "Component",
        props: {
          Icon: {
            icon: 'LucideIcon (required), e.g. import { Camera } from "lucide-react-native"',
            size: '"sm" | "md" (default) | "lg": 16 · 20 · 24 from the iconSize Tokens, scaled',
            color: "a Colour Role (default foreground)",
            strokeWidth: "number (default 2)",
            "aria-label":
              "string: makes the icon meaningful (role img); without it the icon is decorative and hidden",
            style: "ViewStyle, merged last",
          },
        },
        variants: { size: ["sm", "md", "lg"] },
        docs: "Every glyph goes through Icon, so iOS and Android draw the same Lucide glyphs; never use @expo/vector-icons or SF Symbols directly. lucide-react-native is a recorded dependency exception and react-native-svg is SDK-pinned.",
        a11y: [
          "Decorative by default: hidden from screen readers.",
          "With aria-label it has role img and is read with that name.",
          "Inside a labelled control (a Button, a ListItem) leave it decorative: the control carries the name.",
        ],
        keywords: ["icon", "glyph", "lucide", "symbol", "svg", "pictogram"],
        examples: ["icon-demo"],
      },
    },
  ),
  component(
    "button",
    "Button with Variants (primary, secondary, outline, ghost, destructive, link), Sizes, an icon slot, loading and status; icon-only requires aria-label.",
    [...LUCIDE, ...REANIMATED],
    ["theme", "pressable", "text", "icon", "spinner", "announce"],
    {
      title: "Button",
      categories: ["core"],
      meta: {
        kind: "Component",
        props: {
          Button: {
            "...PressableProps":
              "Pressable Primitive props pass through (onPress, onLongPress, haptic, testID, ...)",
            label: "string: the visible text and accessible name (required unless icon-only)",
            icon: "LucideIcon: shown in the icon slot",
            iconPosition: '"start" (default) | "end": where the icon slot sits',
            variant:
              '"primary" (default) | "secondary" | "outline" | "ghost" | "destructive" | "link"',
            size: '"sm" | "md" (default) | "lg"',
            loading:
              "boolean: a Spinner takes the icon slot, the label stays, presses are blocked, announced busy",
            status:
              '"error" | "success": a status icon in the icon slot, announced once; the screen clears it',
            disabled: "boolean: dimmed, presses blocked, announced disabled",
            "aria-label": "string: required for icon-only Buttons (icon and no label)",
            style: "ViewStyle, layout only (e.g. full width), merged last",
          },
        },
        variants: {
          variant: ["primary", "secondary", "outline", "ghost", "destructive", "link"],
          size: ["sm", "md", "lg"],
          status: ["error", "success"],
        },
        docs: "Built on the Pressable Primitive: the pressed look comes from the button.pressed Style Slot. Precedence: disabled > loading > status. Make a Button full width with style={{ alignSelf: 'stretch' }}; there is no fullWidth prop. Buttons give no haptic tick by default.",
        a11y: [
          "role button; the label is the accessible name.",
          "Icon-only Buttons are typed to require aria-label.",
          "The tap area is extended to 48 high, and to 48 wide for icon-only Buttons.",
          "disabled is announced as disabled and loading as busy; no press handler runs in either state.",
          'A new status is announced once ("Save: error"); the loading Spinner stays silent because the Button is already busy.',
          "The label uses the button text Variant, which caps the OS font scale at 1.5× when font scaling is on.",
        ],
        keywords: [
          "button",
          "cta",
          "action",
          "submit",
          "icon button",
          "link button",
          "loading button",
        ],
        examples: ["button-demo"],
      },
    },
  ),
  component(
    "container",
    "Wraps a Screen: safe-area edges, scrolling, keyboard avoidance, Token padding and a max content width.",
    ["react-native-safe-area-context"],
    ["theme", "keyboard"],
    {
      title: "Container",
      categories: ["core"],
      meta: {
        kind: "Component",
        props: {
          Container: {
            "...ViewProps": "React Native View props pass through onto the root",
            children: "the Screen's content",
            scroll: "boolean (default true): scroll the content",
            keyboard:
              "boolean (default true): keep the focused field above the keyboard; needs scroll",
            padded: "boolean (default true): pad the content by the spacing Tokens",
            edges:
              "('top' | 'bottom' | 'left' | 'right')[] (default ['top', 'bottom']): safe-area edges to keep clear of",
            maxWidth: "number (default 640): caps the content width and centres it",
            extraKeyboardSpace: "number: extra room below the content while the keyboard is open",
            contentContainerStyle: "ViewStyle: merged after the content's own padding and gap",
            ref: "Ref<View>",
            style: "ViewStyle, merged last onto the root",
          },
        },
        docs: "Wrap every Screen's content in Container. Scrolling uses the keyboard Primitive's KeyboardAwareScroll, so KeyboardProvider must wrap the root Layout. With a KeyboardStickyFooter below the Container, drop 'bottom' from edges (the footer pads the bottom safe area) and pass its height as extraKeyboardSpace.",
        a11y: [
          "No role of its own: it only lays out the Screen.",
          "Keeps content clear of the safe-area edges (top and bottom by default), so nothing sits under the status bar or home indicator.",
          "With keyboard on (the default), the focused field stays above the keyboard.",
          "Scrolls by default, so content taller than the screen stays reachable.",
        ],
        keywords: [
          "container",
          "screen",
          "page",
          "layout",
          "safe area",
          "scroll view",
          "keyboard avoiding",
          "wrapper",
        ],
        examples: ["container-demo"],
      },
    },
  ),
  example("text-demo", "Text demo", "Headings, body, small and caption text in Colour Roles.", [
    "text",
    "theme",
  ]),
  example(
    "icon-demo",
    "Icon demo",
    "Icons in each size, a Colour Role, a stroke width and a labelled icon.",
    ["icon", "theme"],
  ),
  example(
    "button-demo",
    "Button demo",
    "Every Variant and Size, an icon, icon-only, loading, status and disabled.",
    ["button", "theme"],
  ),
  example("container-demo", "Container demo", "A Screen wrapped in Container.", [
    "container",
    "text",
    "button",
  ]),
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
      docs: "Render one <Toaster /> in the root Layout next to <PortalHost /> (inside ThemeProvider); `init` and `create` already do. Call toast() from anywhere, including outside React. Server errors and success messages go through toast(), never Alert.alert. At most 3 are visible, stacked, newest nearest the edge; more wait in the queue. Each auto-dismisses after 4s (paused while touched) and can be swiped sideways or towards its edge. Animations follow the motion Tokens. The surface uses the toast.root Style Slot.",
      a11y: [
        'Each Toast is announced when it appears and again when updated in place; success, error, info and warning Toasts start with "Success:", "Error:", "Info:" or "Warning:".',
        "The title and description are read as one element with a Dismiss action; VoiceOver's escape gesture also dismisses it.",
        "Enter, exit and reflow animations are off under Reduce Motion, which is followed live.",
        "The action is a Button: role button, with a 48 tap area.",
      ],
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
        a11y: [
          'With required and string children it is read as "<text>, required"; the * marker is hidden from screen readers.',
          "Inside a FormField the visible label is hidden from screen readers; the control reads it as its name instead.",
          "It uses the label text Variant, which caps the OS font scale at 1.5× when font scaling is on.",
        ],
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
        docs: "Wrap each field of a form in FormField, and the fields in FocusChain. FormField is library-neutral: with react-hook-form, render it inside a Controller and pass fieldState.error?.message as error.",
        a11y: [
          'The label is the control\'s accessible name, with ", required" added when required.',
          "The error, or else the description, is the control's hint.",
          "The visible label, description and error are hidden from screen readers, so nothing is read twice.",
          "An error is announced once when it appears or its text changes.",
          "disabled passes down to the control, which is announced as disabled.",
        ],
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
        docs: "Inside FormField, status and disabled come from the field. Inside FocusChain the return key reads Next/Done automatically; a field's own returnKeyType/onSubmitEditing wins. Precedence: disabled > status.",
        a11y: [
          "The accessible name is aria-label, else the FormField label; inside a FormField the error, or else the description, is the hint.",
          'A new status is announced once ("Email: error"), unless a FormField is already announcing its error.',
          "disabled sets aria-disabled and makes the field read-only.",
          "The frame extends the tap area to 48 above and below, and a tap there focuses the field; screen readers skip the frame and reach the TextInput directly.",
          'With secureTextEntry, the toggle is a button named "Show password" or "Hide password", with its tap area extended to 48.',
        ],
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
        a11y: [
          "Named and hinted like Input: aria-label or the FormField label is the name, and the error or description the hint.",
          "A new status is announced once, unless a FormField is already announcing its error.",
          "disabled sets aria-disabled and makes the field read-only.",
          'The counter is read as "n of max characters".',
        ],
        keywords: ["textarea", "multiline", "notes", "comment", "message", "bio", "counter"],
        examples: ["textarea-demo"],
      },
    },
  ),
  component(
    "search-field",
    "Search box with a search icon, an automatic clear (×) button, a loading spinner and onSubmit from the keyboard's Search key.",
    LUCIDE,
    ["theme", "pressable", "icon", "spinner", "use-controllable-state"],
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
          loading: "boolean: the Spinner replaces the search icon; the field is announced busy",
          disabled: "boolean",
          ref: "Ref<TextInput>",
          style: "ViewStyle, layout only, merged last",
        },
        docs: 'The clear button appears while there is text; it clears it (calling onChangeText("")) and keeps focus. TextInput props pass through.',
        a11y: [
          'The field has role searchbox; its name is aria-label, else the placeholder ("Search" by default).',
          "While loading, the field is announced busy and the Spinner stays silent.",
          'The clear button is named "Clear search", with its tap area extended to 48.',
          "The frame extends the tap area to 48 above and below, and a tap there focuses the field; screen readers skip the frame.",
          "disabled sets aria-disabled, makes the field read-only and hides the clear button.",
        ],
        keywords: ["search", "search bar", "filter", "query", "find"],
        examples: ["search-field-demo"],
      },
    },
  ),
  component(
    "tab-navigation",
    "The bottom tab bar: the custom tabBar of an Expo Router JS Tabs Layout, with classic and floating Variants, per-tab icons and badges from Tabs.Screen options.",
    [...LUCIDE, "react-native-safe-area-context"],
    ["theme", "pressable", "text", "icon", "badge"],
    {
      title: "TabNavigation",
      categories: ["navigation"],
      meta: {
        kind: "Component",
        props: {
          "...BottomTabBarProps":
            "state, descriptors, navigation, insets: what Expo Router's JS Tabs pass to tabBar; spread them in",
          variant:
            '"classic" (default): full-width bar with a top border | "floating": inset pill with the Style\'s radius and a large shadow, above the bottom safe area',
          "options.title / options.tabBarLabel":
            "Tabs.Screen option: the tab's label and accessible name (a string, or a render function)",
          "options.tabBarIcon":
            "Tabs.Screen option: ({ focused, color, size }) => ReactNode; use tabIcon(LucideIcon) to draw it with Icon",
          "options.tabBarBadge":
            'Tabs.Screen option: number | string shown as a destructive Badge on the icon and spoken ("Inbox, 3 new")',
          "options.tabBarAccessibilityLabel": "Tabs.Screen option: replaces the spoken name",
          "options.tabBarButtonTestID": "Tabs.Screen option: the tab's testID",
          "options.tabBarShowLabel": "Tabs.Screen option: false hides the label (default true)",
          "options.tabBarStyle":
            "{ display: 'none' } on a Screen hides the bar while it is focused",
          "tabIcon(icon)": "turns a Lucide icon into a tabBarIcon option, drawn with Icon",
          style: "ViewStyle, layout only, merged last onto the root",
        },
        variants: { variant: ["classic", "floating"] },
        docs: 'Use it only as the tabBar of Expo Router\'s JavaScript Tabs (`import { Tabs } from "expo-router/js-tabs"`), never with NativeTabs and never for in-screen tabs (that is SegmentedTabs): `<Tabs tabBar={(props) => <TabNavigation {...props} variant="floating" />}>`. Each Tabs.Screen gives its title, tabBarIcon and optional tabBarBadge; Screens with `href: null` are skipped. A press emits tabPress (call e.preventDefault() in a listener to stop it), then navigates; a long press emits tabLongPress. The active tab is drawn in primary, the others in mutedForeground; the bar uses the card and border Colour Roles. Sizes come from the tab-navigation.bar, .icon, .label, .floating and .pressed Style Slots.',
        a11y: [
          "The bar is a tablist; each tab has role tab, with aria-selected on the active one.",
          'A tab\'s name is its label plus its badge ("Inbox, 3 new" for a count); tabBarAccessibilityLabel replaces it.',
          "Each tab's tap area is at least 48 × 48.",
          "String labels use the caption text Variant, which caps the OS font scale at 1.5× when font scaling is on.",
        ],
        keywords: [
          "tab bar",
          "bottom tabs",
          "bottom navigation",
          "tab navigation",
          "navigation bar",
          "floating tab bar",
          "expo router tabs",
          "badge",
        ],
        examples: ["tab-navigation-demo"],
      },
    },
  ),
  component(
    "input-otp",
    "One-time code field: one hidden input drives N cells; numeric keyboard, SMS/Keychain autofill, paste, onComplete, error/success status and secure.",
    [],
    ["theme", "text", "form-field-context", "focus-chain", "use-controllable-state", "announce"],
    {
      title: "InputOTP",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          length: "number of digits (default 6)",
          value: "string (controlled)",
          defaultValue: 'string (uncontrolled, default "")',
          onChangeText: "(code: string) => void: digits only, on every change including a paste",
          onComplete: "(code: string) => void: once each time the last cell is filled",
          status: "'error' | 'success': colours every cell, announced once; the screen clears it",
          secure: "boolean: dots instead of digits, hidden from screen readers (default false)",
          disabled: "boolean: not editable, dimmed, skipped by FocusChain",
          ref: "Ref<TextInput>: the hidden input (focus, blur, clear)",
          style: "ViewStyle, layout only, merged last onto the root",
          "...TextInputProps":
            "other TextInput props pass through to the hidden input (autoFocus, onFocus, aria-label, accessibilityHint, ...)",
        },
        variants: { status: ["error", "success"] },
        docs: 'One hidden TextInput drives the cells, so typing, deleting, one-time-code autofill (iOS Keychain/SMS, Android SMS) and paste behave like one field. Non-digits are dropped, so a pasted "123 456" fills every cell. Inside FormField it takes the label, error and disabled; inside FocusChain it joins as one field. Cell size, radius and gap come from the input-otp.cell and input-otp.root Style Slots. Precedence: disabled > status.',
        a11y: [
          'Screen readers read one field, "Code, 6 digits": the name is aria-label, else the FormField label, else "Code", plus the digit count. The cells are hidden.',
          "Inside a FormField the error, or else the description, is its hint.",
          'A new status is announced once ("Code: error"), unless a FormField is already announcing its error.',
          "With secure, the cells show dots and the hidden input is a secure text entry.",
          "When the row of cells is under 48, the root extends the tap area to 48 and a tap there focuses the field.",
          "disabled sets aria-disabled and blocks typing.",
        ],
        keywords: [
          "otp",
          "one-time code",
          "verification code",
          "pin",
          "2fa",
          "sms code",
          "passcode",
          "code input",
        ],
        examples: ["input-otp-demo"],
      },
    },
  ),
  component(
    "slider",
    "Pick a number in a range by dragging or tapping (Gesture Handler + Reanimated), snapped to steps with a haptic tick; adjustable for screen readers.",
    ["expo-haptics", "react-native-gesture-handler", ...REANIMATED],
    ["theme", "form-field-context", "use-controllable-state", "use-motion"],
    {
      title: "Slider",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          value: "number (controlled)",
          defaultValue: "number (uncontrolled, default min)",
          onValueChange:
            "(value: number) => void: each new stepped value while dragging, and on increment/decrement",
          onSlidingComplete:
            "(value: number) => void: when a drag or tap ends, and after increment/decrement",
          min: "number (default 0)",
          max: "number (default 100)",
          step: "number (default 1): values always snap to a step",
          disabled: "boolean: no dragging or actions, dimmed",
          "aria-label": "string: the accessible name (a FormField label provides it)",
          "aria-valuetext": 'string: a spoken value with units, e.g. "40 percent"',
          style: "ViewStyle, layout only (e.g. width), merged last",
        },
        docs: "Needs GestureHandlerRootView at the app root (Expo Router provides it). The drag runs on the UI thread; horizontal drags only, so a vertical scroll still works. A light haptic tick per step when config.haptics is on. Track and thumb sizes come from the slider.track and slider.thumb Style Slots.",
        a11y: [
          "An adjustable control: role slider on Android and web, and accessibilityRole adjustable on iOS (a recorded exception, so VoiceOver users can swipe up and down).",
          "It exposes aria-valuemin, aria-valuemax and aria-valuenow; the increment and decrement actions move it one step.",
          "Name it with aria-label (a FormField label provides it); aria-valuetext gives a spoken value with units.",
          "The row is at least 48 high.",
          "disabled blocks dragging and the actions, and is announced as disabled.",
          "The thumb moves instantly under Reduce Motion.",
        ],
        keywords: ["slider", "range", "volume", "brightness", "seek", "adjustable", "scrubber"],
        examples: ["slider-demo"],
      },
    },
  ),
  example(
    "tab-navigation-demo",
    "TabNavigation demo",
    "A tabs Layout using TabNavigation (floating) as the tabBar of Expo Router's JS Tabs, with icons and a badge.",
    ["tab-navigation"],
  ),
  example(
    "input-otp-demo",
    "InputOTP demo",
    "A 6-digit verification code, checked when complete, with error and success.",
    ["input-otp", "text", "theme"],
  ),
  example(
    "slider-demo",
    "Slider demo",
    "A controlled volume Slider with its value shown, and a stepped rating.",
    ["slider", "text", "theme"],
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

  // Feedback
  component(
    "skeleton",
    "A placeholder shape shown while content loads; pulses unless Reduce Motion is on, hidden from screen readers.",
    REANIMATED,
    ["theme", "use-motion"],
    {
      title: "Skeleton",
      categories: ["feedback"],
      meta: {
        kind: "Component",
        props: {
          width: "number | percentage string",
          height: "number | percentage string; with circle and no width, also the width",
          circle: "boolean (default false): fully rounded",
        },
        docs: "Pulses with the slow motion Token. The corner radius comes from the skeleton.root Style Slot.",
        a11y: [
          "Always hidden from screen readers: put aria-busy and an aria-label on the loading container instead.",
          "Still under Reduce Motion: it does not pulse.",
        ],
        keywords: ["loading", "placeholder", "shimmer", "pulse", "content loader"],
        examples: ["skeleton-demo"],
      },
    },
  ),
  component(
    "spinner",
    "An indeterminate loading indicator in a Colour Role, announced as busy; still under Reduce Motion.",
    [...LUCIDE, ...REANIMATED],
    ["theme", "icon", "use-motion"],
    {
      title: "Spinner",
      categories: ["feedback"],
      meta: {
        kind: "Component",
        props: {
          size: "sm | md | lg (default md): 16 · 20 · 24 from the iconSize Tokens",
          color: "Colour Role (default foreground)",
          "aria-label": 'string (default "Loading")',
          "aria-hidden": "boolean: silences it inside a parent that is already busy",
        },
        variants: ["sm", "md", "lg"],
        docs: "A Lucide LoaderCircle turning once every 800ms (2 × the slow motion Token). Button uses it for `loading`. Use it instead of ActivityIndicator.",
        a11y: [
          'role progressbar with aria-busy, named "Loading" by default; aria-label renames it.',
          "aria-hidden silences it inside a parent that is already busy; Button does this while loading.",
          "Still under Reduce Motion: it does not turn.",
        ],
        keywords: ["loading", "loader", "activity indicator", "busy", "spinning"],
        examples: ["spinner-demo"],
      },
    },
  ),
  component(
    "progress",
    "A horizontal progress bar: a value 0–100 that animates, or indeterminate; role progressbar with its value.",
    REANIMATED,
    ["theme", "use-motion"],
    {
      title: "Progress",
      categories: ["feedback"],
      meta: {
        kind: "Component",
        props: {
          value: "number 0–100, clamped (default 0)",
          indeterminate: "boolean (default false): a bar sweeps along the track; announced busy",
        },
        docs: "Value changes animate with the base motion Token. The track height comes from the progress.track Style Slot; set its width with style.",
        a11y: [
          "role progressbar with aria-valuemin 0, aria-valuemax 100 and aria-valuenow (left out while indeterminate).",
          "An indeterminate bar is announced busy.",
          'Name it with aria-label, e.g. "Step 2 of 4".',
          "Under Reduce Motion value changes are instant and the indeterminate sweep is still.",
        ],
        keywords: ["progress bar", "loading", "upload", "download", "percent", "meter"],
        examples: ["progress-demo"],
      },
    },
  ),
  component(
    "alert",
    "Alert, AlertTitle and AlertDescription: an inline message with Variants (default, destructive, success, warning, info), each with a default icon.",
    LUCIDE,
    ["theme", "text", "icon", "form-field-context", "announce"],
    {
      title: "Alert",
      categories: ["feedback"],
      meta: {
        kind: "Component",
        props: {
          variant: "default | destructive | success | warning | info (default default)",
          icon: "Lucide icon component; each Variant has a default (Info, CircleAlert, CircleCheck, TriangleAlert, Info); null hides it",
          "AlertTitle, AlertDescription": "Text props (children); the colour follows the Variant",
        },
        variants: ["default", "destructive", "success", "warning", "info"],
        docs: "Never use Alert.alert or any platform dialog: use this inline Alert, or toast() for transient and server feedback. The border, icon and title take the Variant's Colour Role on a card background.",
        a11y: [
          "role alert, read as one element: the title and description together.",
          'A destructive or success Alert is announced once when it appears and again when its text changes ("Error: Wrong password. Check it and try again.", "Success: Saved"); unrelated re-renders stay silent.',
          "default, warning and info Alerts are not announced; screen readers read them when the user reaches them.",
          "aria-label, if given, replaces the announced text; without it the announcement is built from the text written inside the Alert.",
          "Not announced when it sits inside another Alert (the outer one speaks) or inside a FormField that is announcing its error.",
          "The Variant's icon is decorative.",
        ],
        keywords: ["callout", "banner", "notice", "message", "error", "warning", "info", "success"],
        examples: ["alert-demo"],
      },
    },
  ),
  component(
    "empty-state",
    "What a Screen or list shows when there is nothing to show yet: an icon, a title, a description and an action.",
    LUCIDE,
    ["theme", "text", "icon"],
    {
      title: "Empty State",
      categories: ["feedback"],
      meta: {
        kind: "Component",
        props: {
          icon: "Lucide icon component, drawn in a muted circle",
          title: "string (required), read as a heading",
          description: "string",
          children: "the action, usually a Button",
        },
        docs: "Centre it in the free space (style={{ flex: 1 }}, or a list's ListEmptyComponent). Padding, gap and icon size come from the empty-state.root and empty-state.icon Style Slots.",
        a11y: [
          "The title has role heading (the h4 text Variant).",
          "The icon is decorative and hidden from screen readers.",
          "The action (usually a Button) brings its own role and name.",
        ],
        keywords: ["empty", "no results", "no data", "zero state", "blank slate"],
        examples: ["empty-state-demo"],
      },
    },
  ),

  // Examples
  example(
    "skeleton-demo",
    "Skeleton demo",
    "A list row while it loads: an avatar circle and two lines.",
    ["skeleton", "theme"],
  ),
  example(
    "spinner-demo",
    "Spinner demo",
    "Spinners in each size, a Colour Role and a specific name.",
    ["spinner", "theme"],
  ),
  example(
    "progress-demo",
    "Progress demo",
    "A determinate bar that fills up, and an indeterminate one.",
    ["progress", "theme"],
  ),
  example("alert-demo", "Alert demo", "Alerts in every Variant, and one with a custom icon.", [
    "alert",
    "theme",
  ]),
  example("empty-state-demo", "Empty State demo", "An empty inbox with a New message action.", [
    "empty-state",
    "button",
  ]),

  // Display
  component(
    "card",
    "Card surface with CardHeader, CardTitle, CardDescription, CardContent and CardFooter; onPress makes the whole card pressable.",
    [],
    ["theme", "pressable", "text"],
    {
      title: "Card",
      categories: ["display"],
      meta: {
        kind: "Component",
        props: {
          Card: {
            children: "CardHeader, CardContent, CardFooter or anything else",
            onPress: "(event) => void: makes the whole card one pressable target (role button)",
            onLongPress: "(event) => void",
            disabled: "boolean (default false): pressable cards only; dims and blocks presses",
            haptic: '"selection" | "light": pressable cards only',
            style: "layout only, merged last onto the root",
          },
          CardHeader: { children: "CardTitle and CardDescription" },
          CardTitle: { children: "the title text (role heading); Text props except variant" },
          CardDescription: { children: "muted supporting text; Text props except variant" },
          CardContent: { children: "the main content" },
          CardFooter: { children: "actions, laid out in a row" },
        },
        docs: "Compose shadcn-style from named exports (no dot syntax): <Card><CardHeader><CardTitle>…</CardTitle><CardDescription>…</CardDescription></CardHeader><CardContent>…</CardContent><CardFooter>…</CardFooter></Card>. With onPress the whole card is a single pressable, so don't nest other pressables inside a pressable Card. Padding, gap, radius, border and shadow come from the card.root Style Slot; the pressed look from card.pressed.",
        a11y: [
          "With onPress or onLongPress the whole card is one button, named by its text.",
          "A pressable card is taller than the 48 touch target, so its tap area is not extended.",
          "disabled is announced as disabled and blocks presses.",
          "CardTitle has role heading (the h4 text Variant).",
        ],
        keywords: ["card", "panel", "surface", "tile", "box", "pressable card", "tappable card"],
        examples: ["card-demo"],
      },
    },
  ),
  component(
    "separator",
    "A hairline divider, horizontal or vertical, decorative by default.",
    [],
    ["theme"],
    {
      title: "Separator",
      categories: ["display"],
      meta: {
        kind: "Component",
        props: {
          Separator: {
            orientation: '"horizontal" (default) | "vertical"',
            decorative:
              "boolean (default true): hidden from screen readers; false exposes it with role separator",
            style: "merged last",
          },
        },
        docs: "A vertical Separator stretches to its row's height, so put it in a row with alignItems center. Between virtualized ListItems, pass it as FlashList's ItemSeparatorComponent.",
        a11y: [
          "Decorative by default: hidden from screen readers.",
          "decorative={false} exposes it with role separator.",
        ],
        keywords: ["separator", "divider", "line", "rule", "hr", "hairline"],
        examples: ["separator-demo"],
      },
    },
  ),
  component(
    "badge",
    "Small status label with Variants default, secondary, outline, destructive, success and warning.",
    [],
    ["theme", "text"],
    {
      title: "Badge",
      categories: ["display"],
      meta: {
        kind: "Component",
        props: {
          Badge: {
            label: "string (required): the visible text and accessible name",
            variant:
              '"default" (default) | "secondary" | "outline" | "destructive" | "success" | "warning"',
            style: "merged last",
          },
        },
        variants: ["default", "secondary", "outline", "destructive", "success", "warning"],
        docs: "Not pressable: for a selectable or removable pill use Chip. A Badge sizes to its label (alignSelf flex-start). Its size comes from the badge.root and badge.label Style Slots.",
        a11y: [
          "Not interactive: its label is read as plain text.",
          "The label uses the caption text Variant, which caps the OS font scale at 1.5× when font scaling is on.",
        ],
        keywords: ["badge", "tag", "label", "pill", "status", "count", "counter"],
        examples: ["badge-demo"],
      },
    },
  ),
  component(
    "avatar",
    "Round user image (expo-image) with fallback initials, in sizes sm, md and lg.",
    ["expo-image"],
    ["theme", "text"],
    {
      title: "Avatar",
      categories: ["display"],
      meta: {
        kind: "Component",
        props: {
          Avatar: {
            src: "string: the image URI",
            fallback: 'string: initials shown while loading, on error or without src (e.g. "JD")',
            size: '"sm" | "md" (default) | "lg": Vega 32 / 40 / 64, Nova 24 / 32 / 48',
            alt: "string: who it shows; without it the avatar is decorative (hidden from screen readers)",
            style: "merged last",
          },
        },
        docs: "expo-image is SDK-pinned (`npx expo install expo-image`). The fallback sits behind the image, so it shows while the image loads and stays when it fails.",
        a11y: [
          "With alt it has role img and is read with that name; without alt it is decorative and hidden.",
          "Pass alt unless the person's name is already next to the avatar.",
          "The fallback initials never follow the OS font size, so they stay inside the circle.",
        ],
        keywords: ["avatar", "profile picture", "profile photo", "user image", "initials"],
        examples: ["avatar-demo"],
      },
    },
  ),
  component(
    "list",
    "Settings-style rows: ListSection, ListSectionHeader, ListSectionFooter and ListItem (title, description, icon, trailing, chevron, destructive, onPress); FlashList-safe.",
    LUCIDE,
    ["theme", "pressable", "text", "icon", "separator"],
    {
      title: "List",
      categories: ["display"],
      meta: {
        kind: "Component",
        props: {
          ListSection: {
            children:
              "ListSectionHeader, rows and ListSectionFooter; header and footer are drawn outside the rounded group",
          },
          ListSectionHeader: { children: "the section title (role heading)" },
          ListSectionFooter: { children: "a note under the rows" },
          ListItem: {
            title: "string (required unless children)",
            description: "string: muted text under the title",
            icon: "a Lucide icon component, at the start of the row",
            trailing:
              "ReactNode at the end of the row (strings render as muted text): a value, Badge, Switch…",
            chevron: "boolean (default false): a trailing chevron for rows that navigate",
            destructive: "boolean (default false): title and icon in the destructive colour",
            onPress: "(event) => void: makes the row pressable (role button)",
            disabled: "boolean (default false): pressable rows only",
            children: "escape hatch replacing the title and description column",
            style: "layout only, merged last onto the root",
          },
        },
        docs: "Props-based rows are a deliberate exception to 'children over content props'; use children only for custom rows. ListSection draws an inset, rounded group with hairline Separators between rows. For long lists, render ListItem directly as a FlashList/FlatList row (no ListSection) with Separator as ItemSeparatorComponent: ListItem has no state, no layout measuring and no parent context, so recycling is safe.",
        a11y: [
          "ListSection has role list and ListSectionHeader role heading.",
          "A row with onPress or onLongPress has role button, named by its text, with its tap area extended to 48; other rows have role listitem.",
          "disabled is announced as disabled on a pressable row and blocks presses.",
          "Row icons, the chevron and the Separators between rows are decorative.",
        ],
        keywords: [
          "list",
          "list item",
          "row",
          "settings",
          "table view",
          "cell",
          "menu",
          "flashlist",
        ],
        examples: ["list-demo"],
      },
    },
  ),
  example(
    "card-demo",
    "Card demo",
    "A Card with header, content and footer, and a pressable Card.",
    ["card", "badge", "button", "text", "theme"],
  ),
  example("separator-demo", "Separator demo", "Horizontal and vertical Separators.", [
    "separator",
    "text",
    "theme",
  ]),
  example("badge-demo", "Badge demo", "A Badge in every Variant.", ["badge", "theme"]),
  example(
    "avatar-demo",
    "Avatar demo",
    "Avatars in every size, with an image and with initials only.",
    ["avatar", "theme"],
  ),
  example(
    "list-demo",
    "List demo",
    "A settings list: header, footer, icons, trailing values, chevrons and a destructive row.",
    ["list", "badge", "theme"],
  ),
  component(
    "checkbox",
    "Checkbox with an optional label, controlled or uncontrolled, an indeterminate (mixed) state and a haptic tick.",
    LUCIDE,
    ["theme", "pressable", "form-field-context", "text", "icon", "use-controllable-state"],
    {
      title: "Checkbox",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          checked: "boolean: the controlled checked state",
          defaultChecked: "boolean: the starting state while uncontrolled (default false)",
          onCheckedChange: "(checked: boolean) => void: called when the user toggles it",
          label: "string: visible text next to the box, also the accessible name",
          indeterminate:
            "boolean: shows a dash and is announced as mixed; pressing it checks the box",
          disabled: "boolean: dimmed, announced as disabled, no handler runs",
          style: "layout only, merged last onto the root",
        },
        docs: "A light haptic tick on toggle when config.haptics is on. Inside a FormField it takes the field's disabled, and an error outlines the box in destructive. The box uses the checkbox.box Style Slot and the pressed look checkbox.pressed.",
        a11y: [
          "role checkbox with aria-checked true, false or mixed.",
          "The label is the accessible name; without a label, pass aria-label.",
          "The whole row (box and label) is the tap target, at least 48.",
          "disabled is announced as disabled and no handler runs.",
          "Inside a FormField the field's label and error become its name and hint.",
        ],
        keywords: ["checkbox", "check", "tick", "agree", "terms", "select all", "form"],
        examples: ["checkbox-demo"],
      },
    },
  ),
  example(
    "checkbox-demo",
    "Checkbox demo",
    "A labelled Checkbox, a 'select all' with an indeterminate state, and a disabled one.",
    ["checkbox"],
  ),
  component(
    "radio-group",
    "RadioGroup and RadioGroupItem: a single choice from a list on the SelectionGroup Primitive, vertical or horizontal, with a haptic tick.",
    [],
    ["theme", "pressable", "selection-group", "text"],
    {
      title: "RadioGroup",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          RadioGroup: {
            value: "string: the controlled selected value",
            defaultValue: "string: the starting value while uncontrolled",
            onValueChange: "(value: string) => void: called with the newly selected value",
            orientation: '"vertical" (default) | "horizontal"',
            disabled: "boolean: disables every item",
            style: "layout only, merged last onto the root",
          },
          RadioGroupItem: {
            value: "string (required): the value this item selects",
            label: "string: visible text next to the dot, also the accessible name",
            disabled: "boolean: this item only",
            style: "layout only, merged last onto the root",
          },
        },
        docs: "Named exports RadioGroup and RadioGroupItem. A light haptic tick on selection when config.haptics is on. The dot uses the radio.dot Style Slot and the pressed look radio.pressed.",
        a11y: [
          "Announced as a radiogroup of radio items with aria-checked.",
          "An item's label is its accessible name.",
          "Each row is the tap target, at least 48.",
          "disabled, on the group or an item, is announced as disabled and blocks selection.",
        ],
        keywords: ["radio", "radio button", "option", "single choice", "choose one", "form"],
        examples: ["radio-group-demo"],
      },
    },
  ),
  example(
    "radio-group-demo",
    "RadioGroup demo",
    "A vertical and a horizontal RadioGroup, with a disabled item.",
    ["radio-group"],
  ),
  component(
    "switch",
    "A themed on/off Switch, identical on iOS and Android, with an optional label, a thumb that slides (instant under Reduce Motion) and a haptic tick.",
    ["react-native-reanimated", "react-native-worklets"],
    ["theme", "pressable", "form-field-context", "text", "use-controllable-state", "use-motion"],
    {
      title: "Switch",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          checked: "boolean: the controlled on/off state",
          defaultChecked: "boolean: the starting state while uncontrolled (default false)",
          onCheckedChange: "(checked: boolean) => void: called when the user toggles it",
          label: "string: visible text next to the switch, also the accessible name",
          disabled: "boolean: dimmed, announced as disabled, no handler runs",
          style: "layout only, merged last onto the root",
        },
        docs: "Not the OS Switch: drawn by nativecn so both platforms look the same. The thumb slides with the fast motion Token. A light haptic tick on toggle when config.haptics is on. Inside a FormField it takes the field's disabled. The track uses the switch.track Style Slot and the pressed look switch.pressed.",
        a11y: [
          "role switch with aria-checked.",
          "The label is the accessible name; without a label, pass aria-label.",
          "The tap area is at least 48.",
          "disabled is announced as disabled and no handler runs.",
          "Inside a FormField the field's label and error become its name and hint.",
          "The thumb jumps instantly under Reduce Motion.",
        ],
        keywords: ["switch", "toggle", "on off", "setting", "preference", "enable"],
        examples: ["switch-demo"],
      },
    },
  ),
  example(
    "switch-demo",
    "Switch demo",
    "A controlled Switch with a label, an uncontrolled one and a disabled one.",
    ["switch"],
  ),
  component(
    "chip",
    "Chip (plain, toggle or removable, with an optional icon) and ChipGroup (single or multiple choice on the SelectionGroup Primitive), with a haptic tick.",
    LUCIDE,
    ["theme", "pressable", "selection-group", "use-controllable-state", "text", "icon"],
    {
      title: "Chip",
      categories: ["forms"],
      meta: {
        kind: "Component",
        props: {
          Chip: {
            label: "string (required): the visible text, also the accessible name",
            icon: "a Lucide component shown before the label",
            value: "string: the value it stands for inside a ChipGroup (required there)",
            selected: "boolean: controlled selected state; makes the Chip a toggle",
            defaultSelected: "boolean: starting state while uncontrolled; makes the Chip a toggle",
            onSelectedChange: "(selected: boolean) => void; makes the Chip a toggle",
            onRemove: "() => void: shows a remove (×) button and a Remove screen-reader action",
            disabled: "boolean",
            style: "layout only, merged last onto the root",
          },
          ChipGroup: {
            type: '"single" (default) | "multiple"',
            value: "string (single) or string[] (multiple): the controlled selection",
            defaultValue: "string or string[]: the starting selection while uncontrolled",
            onValueChange: "(value) => void: called with the new selection",
            disabled: "boolean: disables every Chip",
            style: "layout only, merged last onto the root",
          },
        },
        docs: "Named exports Chip and ChipGroup. Inside a ChipGroup, a Chip's own selection props are ignored. The remove button is touch-only. A light haptic tick on selection when config.haptics is on. The surface uses the chip.root Style Slot and the pressed look chip.pressed.",
        a11y: [
          "A standalone Chip is a button, or a checkbox with aria-checked when it is a toggle.",
          "In a single ChipGroup the Chips are radios in a radiogroup; in a multiple ChipGroup they are checkboxes in a group.",
          "The label is the accessible name.",
          "With onRemove, screen readers get a Remove action; the × button is hidden from them.",
          "The tap area is extended to 48 high.",
        ],
        keywords: ["chip", "tag", "pill", "filter", "choice", "multi select", "categories"],
        examples: ["chip-demo"],
      },
    },
  ),
  example(
    "chip-demo",
    "Chip demo",
    "Single and multiple ChipGroups, a toggle Chip with an icon and removable Chips.",
    ["chip"],
  ),
  component(
    "segmented-tabs",
    "In-screen tabs (not navigation): segmented or underline Variants, an animated indicator, and only the selected tab's content rendered.",
    [...REANIMATED, ...LUCIDE],
    [
      "theme",
      "selection-group",
      "pressable",
      "text",
      "icon",
      "use-controllable-state",
      "use-motion",
    ],
    {
      title: "SegmentedTabs",
      categories: ["navigation"],
      meta: {
        kind: "Component",
        props: {
          SegmentedTabs: {
            value: "string: the selected tab's value (controlled)",
            defaultValue: "string: the tab selected first (uncontrolled)",
            onValueChange: "(value: string) => void: called when the user picks a tab",
            variant: '"segmented" (default) | "underline"',
            disabled: "boolean: disables every tab (default false)",
            style: "ViewStyle, layout only, merged last",
          },
          SegmentedTabsList: {
            children: "SegmentedTabsTrigger elements; announced as a tablist",
            style: "ViewStyle, layout only, merged last",
          },
          SegmentedTabsTrigger: {
            value: "string: identifies the tab (required)",
            label: "string: the visible text and accessible name (required)",
            icon: "LucideIcon: shown before the label",
            disabled: "boolean: disables this tab (default false)",
            style: "ViewStyle, layout only, merged last",
          },
          SegmentedTabsContent: {
            value: "string: the tab this panel belongs to; rendered only while it is selected",
            style: "ViewStyle, merged last",
          },
        },
        variants: ["segmented", "underline"],
        docs: "For switching views inside one Screen (Account / Notifications, Day / Week / Month). It is not navigation: never use it in place of Expo Router's Tabs; the bottom tab bar is TabNavigation. Put SegmentedTabsTriggers in a SegmentedTabsList, then one SegmentedTabsContent per tab after it; only the selected Content renders. Works controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`). Tabs give a light haptic tick when chosen. The indicator slides with the `fast` motion Token. Styles come from the segmented-tabs.list, segmented-tabs.trigger and segmented-tabs.pressed Style Slots.",
        a11y: [
          "SegmentedTabsList is a tablist; each SegmentedTabsTrigger has role tab with aria-selected.",
          "SegmentedTabsContent has role tabpanel.",
          "A trigger's label is its accessible name, and its tap area is at least 48.",
          "disabled tabs are announced as disabled.",
          "The sliding indicator is hidden from screen readers and jumps instantly under Reduce Motion.",
        ],
        keywords: [
          "tabs",
          "segmented control",
          "segmented tabs",
          "underline tabs",
          "in-screen tabs",
          "switcher",
          "toggle group",
        ],
        examples: ["segmented-tabs-demo"],
      },
    },
  ),
  component(
    "scheme-switcher",
    "Theme switcher / dark mode toggle: System, Light and Dark as SegmentedTabs, or one icon button cycling through them. Calls setScheme, which persists the choice.",
    LUCIDE,
    ["theme", "segmented-tabs", "button"],
    {
      title: "SchemeSwitcher",
      categories: ["utility"],
      meta: {
        kind: "Component",
        props: {
          variant:
            '"segmented" (default): System / Light / Dark tabs | "icon": one icon-only Button cycling System → Light → Dark',
          disabled: "boolean: blocks changes (default false)",
          style: "ViewStyle, layout only, merged last",
        },
        variants: ["segmented", "icon"],
        docs: "Lets the user choose the light/dark Scheme. Both Variants read `schemePreference` and call `setScheme` from useTheme(), which persists the choice (AsyncStorage, `nativecn-theme`) and makes native chrome follow; ThemeProvider must wrap the root Layout. `segmented` is SegmentedTabs with System (smartphone), Light (sun) and Dark (moon). `icon` is an icon-only ghost Button showing the current Scheme's icon; each press moves to the next Scheme. To switch from code instead, call setScheme('system' | 'light' | 'dark') from useTheme().",
        a11y: [
          'segmented: a tablist named "Theme" with System, Light and Dark tabs, aria-selected on the current one.',
          'icon: an icon-only Button named "Theme: <Scheme>" (e.g. "Theme: Dark"), with a 48 tap area.',
          "disabled is announced as disabled and blocks changes.",
        ],
        keywords: [
          "theme switcher",
          "dark mode toggle",
          "light mode",
          "dark mode",
          "color scheme",
          "appearance",
          "scheme",
        ],
        examples: ["scheme-switcher-demo"],
      },
    },
  ),
  example(
    "segmented-tabs-demo",
    "SegmentedTabs demo",
    "Uncontrolled segmented tabs with icons, and controlled underline tabs.",
    ["segmented-tabs", "text", "theme"],
  ),
  example(
    "scheme-switcher-demo",
    "SchemeSwitcher demo",
    "The segmented and icon Variants, sharing the persisted Scheme.",
    ["scheme-switcher", "theme"],
  ),
  // Navigation
  component(
    "drawer",
    "Drawer panel content for Expo Router's drawer (expo-router/drawer): DrawerContent, DrawerHeader, DrawerSection, DrawerItem (label, icon, href, badge; active from the current route) and DrawerFooter.",
    ["expo-router", "react-native-safe-area-context"],
    ["theme", "pressable", "text", "icon", "badge"],
    {
      title: "Drawer",
      categories: ["navigation"],
      meta: {
        kind: "Component",
        props: {
          DrawerContent: {
            "...DrawerContentComponentProps":
              "Expo Router's drawer props (state, navigation, descriptors): spread the drawerContent props in",
            children:
              "DrawerHeader (pinned on top), DrawerSections and DrawerItems (scrolling) and DrawerFooter (pinned at the bottom), in any order",
            contentContainerStyle: "the scrolling area's content, merged last",
            style: "merged last onto the panel",
          },
          DrawerHeader: {
            children: "a profile, a logo and name, or a cover",
            style: "merged last; the top padding includes the status bar inset",
          },
          DrawerSection: {
            title: "string: a small muted heading (role heading)",
            children: "DrawerItems",
            style: 'merged last; { marginTop: "auto" } pushes the group to the bottom',
          },
          DrawerItem: {
            label: "string (required): the visible text and accessible name",
            icon: "a Lucide icon component; leave it out for text-only items",
            href: "Href: pressing navigates there and closes the drawer; active while the pathname is this route or below it",
            badge: "string | number (a secondary Badge) | ReactElement (rendered as-is)",
            active: "boolean: overrides the active state derived from the route",
            variant:
              '"default" (default): active on a muted background | "text": active in the Accent Colour, no background',
            tone: '"default" (default) | "accent": an Accent Colour tint with Accent Colour text and icon',
            onPress:
              "(event) => void: runs before navigating; without href the item is an action (role button) and the drawer stays open",
            disabled: "boolean (default false)",
            style: "layout only, merged last onto the root",
          },
          DrawerFooter: {
            children: "Log out, a team switcher, the user",
            style: "merged last; the bottom padding includes the home indicator inset",
          },
        },
        variants: { variant: ["default", "text"], tone: ["default", "accent"] },
        docs: "Built only on expo-router/drawer, which ships inside Expo Router (react-native-drawer-layout): never install @react-navigation/drawer or the npm package expo-drawer. In app/(drawer)/_layout.tsx render <Drawer drawerContent={(props) => <DrawerContent {...props}>…</DrawerContent>} />. A DrawerItem with href is active while usePathname() is its route or below it (route groups such as (drawer) and index are ignored); tapping it calls router.navigate(href) and closes the drawer. Items are sized by the drawer.item Style Slot (Vega 48, Nova 40); the label, pressed look and accent tint come from drawer.label, drawer.pressed and drawer.tint. The panel keeps clear of the status bar and home indicator.",
        a11y: [
          "A DrawerItem with href has role link, with aria-selected while its route is active; without href it has role button.",
          "An item's visible label is its accessible name.",
          "Items are 48 high in Vega and 40 in Nova, with the tap area extended to 48.",
          "DrawerSection titles have role heading.",
          "disabled items are announced as disabled and block presses.",
          "Item labels use the label text Variant, which caps the OS font scale at 1.5× when font scaling is on.",
        ],
        keywords: [
          "drawer",
          "side menu",
          "sidebar",
          "navigation drawer",
          "hamburger menu",
          "nav menu",
          "expo-router drawer",
        ],
        examples: ["drawer-demo"],
      },
    },
  ),
  example(
    "drawer-demo",
    "Drawer demo",
    "An app/(drawer)/_layout.tsx: a profile header, titled sections, an accent item, a bottom group and a Log out footer.",
    ["drawer", "avatar", "badge", "separator", "text", "theme"],
  ),
  // Drawer Blocks (designs: #24)
  drawerBlock(
    "drawer-01",
    "Drawer01",
    "Profile header + grouped sections",
    "Drawer panel with a profile header (avatar, name, email, plan Badge), labelled sections (Main, Workspace, Support) and Log out pinned in the footer.",
    "The familiar Gmail/Slack drawer: who is signed in on top, items grouped under small headings, Log out at the bottom; the active item sits on a muted background.",
    [
      "The section titles (Main, Workspace, Support) have role heading.",
      "The name in the header is a heading (h4); the initials Avatar is decorative.",
      "Log out is an action item: role button.",
    ],
    LUCIDE,
    ["drawer", "avatar", "badge", "separator", "text", "theme"],
  ),
  drawerBlock(
    "drawer-02",
    "Drawer02",
    "SaaS workspace",
    "Drawer panel for a SaaS workspace: logo and name with a close button, an Accent Colour onboarding item with a 5 Steps Badge, main items, a bottom group (Notifications with a count, Settings, Docs, Help) and a footer with a team switcher and the user's avatar.",
    "A product workspace: an Accent-tinted onboarding Checklist on top, a second group pushed to the bottom, and a team switcher and account button in the footer instead of a profile header.",
    [
      'The close button is an icon-only Button named "Close menu"; the logo icon is decorative.',
      'The footer buttons are named "Switch team, current team Acme Inc" and "Account menu", with their tap areas extended to 48.',
    ],
    LUCIDE,
    ["drawer", "avatar", "badge", "button", "icon", "pressable", "text", "theme"],
  ),
  drawerBlock(
    "drawer-03",
    "Drawer03",
    "Cover header",
    "Drawer panel with a dark cover (large avatar, name, View profile, a bell with a count, an overflow button and a round + action), icon items active in Accent Colour text, a divider and text-only secondary items.",
    "A consumer or commerce app drawer: a dark profile cover that stays dark in both Schemes, and items that show the current route by Accent Colour text and icon, with no background.",
    [
      'The bell is an icon-only Button named "Notifications, <count> unread"; its count Badge is hidden from screen readers.',
      'The overflow and + buttons are icon-only Buttons named "More" and "Create".',
      "View profile has role link; the initials Avatar is decorative.",
    ],
    ["expo-router", ...LUCIDE],
    ["drawer", "avatar", "badge", "button", "pressable", "separator", "text", "theme"],
  ),
] satisfies RegistryItem[];
