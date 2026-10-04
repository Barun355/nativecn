import type { RegistryItem } from "shadcn/schema";

// Helpers: plain functions, identical in every Style.
export default [
  {
    name: "announce",
    type: "registry:lib",
    title: "announce",
    description:
      "Reliable screen-reader announcements on iOS and Android (Button and Input status, Toast).",
    categories: ["accessibility"],
    meta: {
      kind: "Helper",
      props: {
        announce: {
          "announce(message, options?)":
            "void: speaks message with VoiceOver or TalkBack; a no-op for empty text or without a screen reader",
          "options.queue":
            "boolean (default true): wait for the current speech instead of cutting it off (VoiceOver only; TalkBack always queues)",
        },
      },
      docs: "Use it for changes that appear without moving focus: a form error, a Button's status, a Toast. On iOS it waits briefly so VoiceOver does not drop announcements made during a press or layout change. Components already announce their own status; call it only for custom feedback.",
      keywords: ["announce", "screen reader", "voiceover", "talkback", "accessibility", "a11y"],
    },
    files: [
      {
        path: "utils/announce.ts",
        type: "registry:lib",
        target: "{utils}/announce.ts",
      },
    ],
  },
] satisfies RegistryItem[];
