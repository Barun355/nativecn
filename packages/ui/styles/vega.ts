import { defineStyle } from "./define";

// Vega: clean and balanced. Values from "Vega and Nova values for each 0.1 Component" (#23).
// This file defines the canonical Slot names; every other Style must fill exactly the same Slots.
export const vega = defineStyle({
  "button.root": (t) => ({
    height: t.controlHeight.md,
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing[4],
    gap: t.spacing[2],
  }),
  "button.label": (t) => ({ ...t.type.button }),
  // Sizes: `button.root` is the md size; sm and lg override its dimensions.
  "button.sm": (t) => ({
    height: t.controlHeight.sm,
    paddingHorizontal: t.spacing[3],
    gap: t.scaleValue(6),
  }),
  "button.lg": (t) => ({
    height: t.controlHeight.lg,
    paddingHorizontal: t.spacing[6],
    gap: t.spacing[2],
  }),
  "button.pressed": () => ({ filter: [{ brightness: 0.88 }] }),
  "input.root": (t) => ({
    height: t.controlHeight.md,
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing[3],
    borderWidth: t.borderWidth.default,
    ...t.type.body,
  }),
  // Sizes: `input.root` is the md size; sm and lg override its dimensions.
  "input.sm": (t) => ({ height: t.controlHeight.sm, paddingHorizontal: t.scaleValue(10) }),
  "input.lg": (t) => ({ height: t.controlHeight.lg, paddingHorizontal: t.spacing[4] }),
  "search-field.root": (t) => ({
    height: t.controlHeight.md,
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing[3],
  }),
  "form-field.root": (t) => ({ gap: t.spacing[2] }),
  "checkbox.box": (t) => ({
    width: t.scaleValue(20),
    height: t.scaleValue(20),
    borderRadius: t.radius.sm,
  }),
  "radio.dot": (t) => ({ width: t.scaleValue(20), height: t.scaleValue(20) }),
  "switch.track": (t) => ({ width: t.scaleValue(52), height: t.scaleValue(32) }),
  // Pressed look of the Checkbox, RadioGroupItem and Switch rows (the whole row, label included).
  "checkbox.pressed": () => ({ opacity: 0.7 }),
  "radio.pressed": () => ({ opacity: 0.7 }),
  "switch.pressed": () => ({ opacity: 0.7 }),
  "slider.track": (t) => ({ height: t.scaleValue(6) }),
  "slider.thumb": (t) => ({ width: t.scaleValue(24), height: t.scaleValue(24) }),
  "chip.root": (t) => ({
    height: t.scaleValue(32),
    borderRadius: t.radius.full,
    paddingHorizontal: t.spacing[3],
    ...t.type.label,
  }),
  "chip.pressed": () => ({ filter: [{ brightness: 0.88 }] }),
  "input-otp.cell": (t) => ({
    width: t.scaleValue(48),
    height: t.scaleValue(56),
    borderRadius: t.radius.md,
  }),
  "input-otp.root": (t) => ({ gap: t.spacing[2] }),
  "card.root": (t) => ({
    borderRadius: t.radius.xl,
    padding: t.spacing[6],
    gap: t.spacing[4],
    borderWidth: t.borderWidth.default,
    boxShadow: t.elevation.sm,
  }),
  "card.header": (t) => ({ gap: t.scaleValue(6) }),
  "card.title": (t) => ({ ...t.type.h4 }),
  "card.pressed": () => ({ filter: [{ brightness: 0.96 }] }),
  "badge.root": (t) => ({
    height: t.scaleValue(22),
    borderRadius: t.radius.sm,
    paddingHorizontal: t.spacing[2],
  }),
  "badge.label": (t) => ({ ...t.type.caption, fontFamily: t.type.label.fontFamily }),
  // Sizes: `avatar.root` is the md size; sm and lg override it.
  "avatar.root": (t) => ({ width: t.scaleValue(40), height: t.scaleValue(40) }),
  "avatar.sm": (t) => ({ width: t.scaleValue(32), height: t.scaleValue(32) }),
  "avatar.lg": (t) => ({ width: t.scaleValue(64), height: t.scaleValue(64) }),
  "list.section": (t) => ({ borderRadius: t.radius.xl, marginHorizontal: t.spacing[4] }),
  "list.item": (t) => ({
    minHeight: t.scaleValue(52),
    paddingHorizontal: t.spacing[4],
    gap: t.spacing[3],
  }),
  "list.title": (t) => ({ ...t.type.body }),
  "list.pressed": (t) => ({ backgroundColor: t.colors.muted }),
  "skeleton.root": (t) => ({ borderRadius: t.radius.md }),
  "progress.track": (t) => ({ height: t.scaleValue(8), borderRadius: t.radius.full }),
  "alert.root": (t) => ({
    borderRadius: t.radius.lg,
    padding: t.spacing[4],
    gap: t.spacing[3],
    borderWidth: t.borderWidth.default,
  }),
  "toast.root": (t) => ({
    borderRadius: t.radius.xl,
    padding: t.spacing[4],
    boxShadow: t.elevation.lg,
  }),
  "empty-state.root": (t) => ({ padding: t.spacing[8], gap: t.spacing[3] }),
  "empty-state.icon": (t) => ({ width: t.scaleValue(48), height: t.scaleValue(48) }),
  "segmented-tabs.list": (t) => ({
    height: t.scaleValue(40),
    borderRadius: t.radius.lg,
    padding: t.scaleValue(3),
  }),
  "segmented-tabs.trigger": (t) => ({ borderRadius: t.radius.md }),
  "segmented-tabs.pressed": () => ({ opacity: 0.7 }),
  "tab-navigation.bar": (t) => ({ height: t.scaleValue(64) }),
  "tab-navigation.icon": (t) => ({ width: t.iconSize.lg, height: t.iconSize.lg }),
  "tab-navigation.label": (t) => ({
    ...t.type.caption,
    fontSize: t.scaleValue(11),
    lineHeight: t.scaleValue(14),
  }),
  "tab-navigation.floating": (t) => ({ borderRadius: t.radius["2xl"] }),
  "tab-navigation.pressed": () => ({ filter: [{ brightness: 0.88 }] }),
  "drawer.item": (t) => ({
    height: t.scaleValue(48),
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing[3],
    gap: t.spacing[3],
  }),
  "drawer.label": (t) => ({ ...t.type.label }),
  "drawer.pressed": (t) => ({ backgroundColor: t.colors.muted }),
  // The Accent Colour (primary) tint behind an accent-tone item, drawn as an overlay layer.
  "drawer.tint": (t) => ({ backgroundColor: t.colors.primary, opacity: 0.12 }),
});

export type SlotName = keyof typeof vega;
