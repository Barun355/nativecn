import { defineStyle } from "./define";

export const nova = defineStyle({
  "sample.root": (theme) => ({
    height: theme.controlHeight.sm,
    borderRadius: theme.radius.sm,
    ...theme.type.body,
  }),
  "sample.pressed": () => ({ opacity: 0.8, transform: [{ scale: 0.98 }] }),
});
