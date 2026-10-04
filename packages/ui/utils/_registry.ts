import type { RegistryItem } from "shadcn/schema";

// Helpers: plain functions, identical in every Style.
export default [
  {
    name: "announce",
    type: "registry:lib",
    description:
      "Reliable screen-reader announcements on iOS and Android (Button and Input status, Toast).",
    files: [
      {
        path: "utils/announce.ts",
        type: "registry:lib",
        target: "{utils}/announce.ts",
      },
    ],
  },
] satisfies RegistryItem[];
