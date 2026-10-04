import { defineStyle } from "./define";

export const vega = defineStyle({
  "sample.root": (t) => ({ height: t.controlHeight.md, borderRadius: t.radius.md, ...t.type.body }),
  "sample.pressed": () => ({ opacity: 0.9 }),
});
