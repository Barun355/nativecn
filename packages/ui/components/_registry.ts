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
] satisfies RegistryItem[];
