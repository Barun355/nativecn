import type { FontSource } from "expo-font";

// The default Preset's Body/Heading Font (Inter), loaded from the repo's font files so Text
// renders in the right face in Expo Go too. All 8 Preset fonts arrive with the live Preset
// controls (#29).
export const fonts: Record<string, FontSource> = {
  "Inter-Regular": require("../../web/public/fonts/inter/Inter-Regular.ttf"),
  "Inter-Medium": require("../../web/public/fonts/inter/Inter-Medium.ttf"),
  "Inter-SemiBold": require("../../web/public/fonts/inter/Inter-SemiBold.ttf"),
  "Inter-Bold": require("../../web/public/fonts/inter/Inter-Bold.ttf"),
};
