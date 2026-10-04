import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

import type { Theme } from "@/registry/theme";

/** One Style Slot fill: a function of the Theme returning a style object. */
export type SlotFill = (t: Theme) => ViewStyle | TextStyle | ImageStyle;

/** Declare a Style's Slot fills. Never copied into apps: the Registry build inlines the values. */
export function defineStyle<T extends Record<string, SlotFill>>(fills: T): T {
  return fills;
}
