import { defineStyle, type SlotFill } from "./define";
import type { SlotName } from "./vega";

// Nova: compact. Values from "Vega and Nova values for each 0.1 Component" (#23).
// Controls under 48 high reach the touch target through hitSlop (Component contract).
export const nova = defineStyle({
  "button.root": (t) => ({
    height: t.controlHeight.sm,
    borderRadius: t.radius.sm,
    paddingHorizontal: t.spacing[3],
    gap: t.scaleValue(6),
  }),
  "button.label": (t) => ({
    ...t.type.button,
    fontSize: t.scaleValue(14),
    lineHeight: t.scaleValue(20),
  }),
  // Sizes: `button.root` is the md size; sm and lg override its dimensions.
  "button.sm": (t) => ({
    height: t.scaleValue(32),
    paddingHorizontal: t.scaleValue(10),
    gap: t.spacing[1],
  }),
  "button.lg": (t) => ({
    height: t.controlHeight.md,
    paddingHorizontal: t.spacing[4],
    gap: t.spacing[2],
  }),
  "button.pressed": () => ({ filter: [{ brightness: 0.88 }], transform: [{ scale: 0.98 }] }),
  "input.root": (t) => ({
    height: t.controlHeight.sm,
    borderRadius: t.radius.sm,
    paddingHorizontal: t.scaleValue(10),
    borderWidth: t.borderWidth.default,
    ...t.type.body,
    fontSize: t.scaleValue(15),
    lineHeight: t.scaleValue(20),
  }),
  // Sizes: `input.root` is the md size; sm and lg override its dimensions.
  "input.sm": (t) => ({ height: t.scaleValue(32), paddingHorizontal: t.spacing[2] }),
  "input.lg": (t) => ({ height: t.controlHeight.md, paddingHorizontal: t.spacing[3] }),
  "search-field.root": (t) => ({
    height: t.controlHeight.sm,
    borderRadius: t.radius.sm,
    paddingHorizontal: t.scaleValue(10),
  }),
  "form-field.root": (t) => ({ gap: t.scaleValue(6) }),
  "checkbox.box": (t) => ({
    width: t.scaleValue(18),
    height: t.scaleValue(18),
    borderRadius: t.scaleValue(4),
  }),
  "radio.dot": (t) => ({ width: t.scaleValue(18), height: t.scaleValue(18) }),
  "switch.track": (t) => ({ width: t.scaleValue(44), height: t.scaleValue(26) }),
  "slider.track": (t) => ({ height: t.scaleValue(4) }),
  "slider.thumb": (t) => ({ width: t.scaleValue(20), height: t.scaleValue(20) }),
  "chip.root": (t) => ({
    height: t.scaleValue(28),
    borderRadius: t.radius.sm,
    paddingHorizontal: t.scaleValue(10),
    ...t.type.label,
    fontSize: t.scaleValue(13),
    lineHeight: t.scaleValue(18),
  }),
  "input-otp.cell": (t) => ({
    width: t.scaleValue(40),
    height: t.scaleValue(48),
    borderRadius: t.radius.sm,
  }),
  "input-otp.root": (t) => ({ gap: t.scaleValue(6) }),
  "card.root": (t) => ({
    borderRadius: t.radius.lg,
    padding: t.spacing[4],
    gap: t.spacing[3],
    borderWidth: t.borderWidth.default,
  }),
  "badge.root": (t) => ({
    height: t.scaleValue(20),
    borderRadius: t.scaleValue(4),
    paddingHorizontal: t.scaleValue(6),
  }),
  "badge.label": (t) => ({
    ...t.type.caption,
    fontFamily: t.type.label.fontFamily,
    fontSize: t.scaleValue(11),
    lineHeight: t.scaleValue(14),
  }),
  "avatar.root": (t) => ({ width: t.scaleValue(32), height: t.scaleValue(32) }),
  "list.section": (t) => ({ borderRadius: t.radius.lg, marginHorizontal: t.spacing[3] }),
  "list.item": (t) => ({
    minHeight: t.scaleValue(44),
    paddingHorizontal: t.spacing[3],
    gap: t.scaleValue(10),
  }),
  "skeleton.root": (t) => ({ borderRadius: t.radius.sm }),
  "progress.track": (t) => ({ height: t.scaleValue(4), borderRadius: t.radius.full }),
  "alert.root": (t) => ({
    borderRadius: t.radius.md,
    padding: t.spacing[3],
    gap: t.scaleValue(10),
    borderWidth: t.borderWidth.default,
  }),
  "toast.root": (t) => ({
    borderRadius: t.radius.lg,
    padding: t.spacing[3],
    boxShadow: t.elevation.md,
  }),
  "empty-state.root": (t) => ({ padding: t.spacing[6], gap: t.spacing[2] }),
  "empty-state.icon": (t) => ({ width: t.scaleValue(36), height: t.scaleValue(36) }),
  "segmented-tabs.list": (t) => ({
    height: t.scaleValue(32),
    borderRadius: t.radius.md,
    padding: t.scaleValue(2),
  }),
  "segmented-tabs.trigger": (t) => ({ borderRadius: t.radius.sm }),
  "tab-navigation.bar": (t) => ({ height: t.scaleValue(52) }),
  "tab-navigation.icon": (t) => ({ width: t.iconSize.md, height: t.iconSize.md }),
  "tab-navigation.label": (t) => ({
    ...t.type.caption,
    fontSize: t.scaleValue(10),
    lineHeight: t.scaleValue(12),
  }),
  "tab-navigation.floating": (t) => ({ borderRadius: t.radius.xl }),
  "drawer.item": (t) => ({
    height: t.scaleValue(40),
    borderRadius: t.radius.sm,
    paddingHorizontal: t.scaleValue(10),
    gap: t.scaleValue(10),
  }),
} satisfies Record<SlotName, SlotFill>);
