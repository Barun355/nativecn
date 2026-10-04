import type { RegistryItem } from "shadcn/schema";

// Components: one file each, Style Slots inlined per Style by the Registry build.
const component = (
  name: string,
  description: string,
  dependencies: string[],
  registryDependencies: string[],
): RegistryItem => ({
  name,
  type: "registry:ui",
  description,
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
] satisfies RegistryItem[];
