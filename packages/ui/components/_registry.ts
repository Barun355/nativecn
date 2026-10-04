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
/** Reanimated and its Worklets runtime are SDK-pinned. */
const REANIMATED = ["react-native-reanimated", "react-native-worklets"];

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
    [...LUCIDE, ...REANIMATED],
    ["theme", "pressable", "text", "icon", "spinner", "announce"],
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
        docs: 'Use it only as the tabBar of Expo Router\'s JavaScript Tabs (`import { Tabs } from "expo-router/js-tabs"`), never with NativeTabs and never for in-screen tabs (that is SegmentedTabs): `<Tabs tabBar={(props) => <TabNavigation {...props} variant="floating" />}>`. Each Tabs.Screen gives its title, tabBarIcon and optional tabBarBadge; Screens with `href: null` are skipped. A press emits tabPress (call e.preventDefault() in a listener to stop it), then navigates; a long press emits tabLongPress. The active tab is drawn in primary, the others in mutedForeground; the bar uses the card and border Colour Roles. The row is a tablist of tabs with aria-selected; each tab is at least 48 high. Sizes come from the tab-navigation.bar, .icon, .label, .floating and .pressed Style Slots.',
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
        docs: 'One hidden TextInput drives the cells, so typing, deleting, one-time-code autofill (iOS Keychain/SMS, Android SMS) and paste behave like one field. Non-digits are dropped, so a pasted "123 456" fills every cell. Screen readers read one field: "Code, 6 digits" (or the FormField label). Inside FormField it takes the label, error and disabled; inside FocusChain it joins as one field. Cell size, radius and gap come from the input-otp.cell and input-otp.root Style Slots. Precedence: disabled > status.',
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
        docs: "Needs GestureHandlerRootView at the app root (Expo Router provides it). The drag runs on the UI thread; horizontal drags only, so a vertical scroll still works. Screen readers get an adjustable control with aria-valuemin/max/now and increment/decrement (swipe up/down). A light haptic tick per step when config.haptics is on. Moves are instant under Reduce Motion. Track and thumb sizes come from the slider.track and slider.thumb Style Slots.",
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
        docs: "Always hidden from screen readers: put aria-busy and an aria-label on the loading container instead. Pulses with the slow motion Token and is still under Reduce Motion. The corner radius comes from the skeleton.root Style Slot.",
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
        docs: "A Lucide LoaderCircle turning once every 800ms (2 × the slow motion Token); role progressbar with aria-busy. Button uses it for `loading`, with aria-hidden since the Button itself is busy. Use it instead of ActivityIndicator.",
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
        docs: "role progressbar with aria-valuemin 0, aria-valuemax 100 and aria-valuenow (left out while indeterminate). Value changes animate with the base motion Token; the sweep is still under Reduce Motion. The track height comes from the progress.track Style Slot; set its width with style.",
        keywords: ["progress bar", "loading", "upload", "download", "percent", "meter"],
        examples: ["progress-demo"],
      },
    },
  ),
  component(
    "alert",
    "Alert, AlertTitle and AlertDescription: an inline message with Variants (default, destructive, success, warning, info), each with a default icon.",
    LUCIDE,
    ["theme", "text", "icon"],
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
        docs: "role alert, read as one element. Never use Alert.alert or any platform dialog: use this inline Alert, or toast() for transient and server feedback. The border, icon and title take the Variant's Colour Role on a card background.",
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
        docs: "Compose shadcn-style from named exports (no dot syntax): <Card><CardHeader><CardTitle>…</CardTitle><CardDescription>…</CardDescription></CardHeader><CardContent>…</CardContent><CardFooter>…</CardFooter></Card>. With onPress the whole card is a single button whose accessible name is its text, so don't nest other pressables inside a pressable Card. Padding, gap, radius, border and shadow come from the card.root Style Slot; the pressed look from card.pressed.",
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
        docs: "expo-image is SDK-pinned (`npx expo install expo-image`). The fallback sits behind the image, so it shows while the image loads and stays when it fails. Pass alt unless the person's name is already next to the avatar.",
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
        docs: "Role checkbox with aria-checked true, false or mixed. The whole row (box and label) is the tap target, at least 48. A light haptic tick on toggle when config.haptics is on. Without a label, pass aria-label. Inside a FormField it takes the field's label and error as its name and hint, its disabled, and an error outlines the box in destructive. The box uses the checkbox.box Style Slot and the pressed look checkbox.pressed.",
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
        docs: "Named exports RadioGroup and RadioGroupItem. Announced as a radiogroup of radio items with aria-checked. Each row is the tap target, at least 48. A light haptic tick on selection when config.haptics is on. The dot uses the radio.dot Style Slot and the pressed look radio.pressed.",
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
        docs: "Not the OS Switch: drawn by nativecn so both platforms look the same. Role switch with aria-checked. The thumb slides with the fast motion Token and jumps instantly under Reduce Motion. A light haptic tick on toggle when config.haptics is on. Without a label, pass aria-label. Inside a FormField it takes the field's label and error as its name and hint, and its disabled. The track uses the switch.track Style Slot and the pressed look switch.pressed.",
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
        docs: "Named exports Chip and ChipGroup. A standalone Chip is a button, or a checkbox when it is a toggle. In a single ChipGroup the Chips are radios in a radiogroup; in a multiple ChipGroup they are checkboxes in a group. Inside a ChipGroup, a Chip's own selection props are ignored. The remove button is touch-only; screen readers use the Chip's Remove action. A light haptic tick on selection when config.haptics is on. The surface uses the chip.root Style Slot and the pressed look chip.pressed.",
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
        docs: "For switching views inside one Screen (Account / Notifications, Day / Week / Month). It is not navigation: never use it in place of Expo Router's Tabs; the bottom tab bar is TabNavigation. Put SegmentedTabsTriggers in a SegmentedTabsList, then one SegmentedTabsContent per tab after it; only the selected Content renders. Works controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`). Tabs are announced as tab with aria-selected inside a tablist, give a light haptic tick when chosen, and reach the 48 tap target. The indicator slides with the `fast` motion Token and jumps instantly under Reduce Motion. Styles come from the segmented-tabs.list, segmented-tabs.trigger and segmented-tabs.pressed Style Slots.",
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
        docs: "Lets the user choose the light/dark Scheme. Both Variants read `schemePreference` and call `setScheme` from useTheme(), which persists the choice (AsyncStorage, `nativecn-theme`) and makes native chrome follow; ThemeProvider must wrap the root Layout. `segmented` is SegmentedTabs with System (smartphone), Light (sun) and Dark (moon). `icon` is an icon-only ghost Button showing the current Scheme's icon, labelled \"Theme: <Scheme>\" for screen readers; each press moves to the next Scheme. To switch from code instead, call setScheme('system' | 'light' | 'dark') from useTheme().",
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
        docs: "Built only on expo-router/drawer, which ships inside Expo Router (react-native-drawer-layout): never install @react-navigation/drawer or the npm package expo-drawer. In app/(drawer)/_layout.tsx render <Drawer drawerContent={(props) => <DrawerContent {...props}>…</DrawerContent>} />. Each DrawerItem with href has role link and aria-selected, derived from usePathname() (route groups such as (drawer) and index are ignored); tapping it calls router.navigate(href) and closes the drawer. Items are sized by the drawer.item Style Slot (Vega 48, Nova 40) with the tap area extended to 48; the label, pressed look and accent tint come from drawer.label, drawer.pressed and drawer.tint. The panel keeps clear of the status bar and home indicator.",
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
] satisfies RegistryItem[];
