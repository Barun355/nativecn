import type { FontSource } from "expo-font";

// All 8 Preset fonts, four faces each, keyed by PostScript name (the `fontFamily` the Theme uses).
// Bundled so the Theme tab can switch Body and Heading Font live, in Expo Go too (decision #29);
// user apps still download only their chosen fonts. Checked by scripts/fonts.test.ts.
export const fonts: Record<string, FontSource> = {
  "Inter-Regular": require("../../web/public/fonts/inter/Inter-Regular.ttf"),
  "Inter-Medium": require("../../web/public/fonts/inter/Inter-Medium.ttf"),
  "Inter-SemiBold": require("../../web/public/fonts/inter/Inter-SemiBold.ttf"),
  "Inter-Bold": require("../../web/public/fonts/inter/Inter-Bold.ttf"),
  "Geist-Regular": require("../../web/public/fonts/geist/Geist-Regular.ttf"),
  "Geist-Medium": require("../../web/public/fonts/geist/Geist-Medium.ttf"),
  "Geist-SemiBold": require("../../web/public/fonts/geist/Geist-SemiBold.ttf"),
  "Geist-Bold": require("../../web/public/fonts/geist/Geist-Bold.ttf"),
  "DMSans-Regular": require("../../web/public/fonts/dm-sans/DMSans-Regular.ttf"),
  "DMSans-Medium": require("../../web/public/fonts/dm-sans/DMSans-Medium.ttf"),
  "DMSans-SemiBold": require("../../web/public/fonts/dm-sans/DMSans-SemiBold.ttf"),
  "DMSans-Bold": require("../../web/public/fonts/dm-sans/DMSans-Bold.ttf"),
  "Figtree-Regular": require("../../web/public/fonts/figtree/Figtree-Regular.ttf"),
  "Figtree-Medium": require("../../web/public/fonts/figtree/Figtree-Medium.ttf"),
  "Figtree-SemiBold": require("../../web/public/fonts/figtree/Figtree-SemiBold.ttf"),
  "Figtree-Bold": require("../../web/public/fonts/figtree/Figtree-Bold.ttf"),
  "Lora-Regular": require("../../web/public/fonts/lora/Lora-Regular.ttf"),
  "Lora-Medium": require("../../web/public/fonts/lora/Lora-Medium.ttf"),
  "Lora-SemiBold": require("../../web/public/fonts/lora/Lora-SemiBold.ttf"),
  "Lora-Bold": require("../../web/public/fonts/lora/Lora-Bold.ttf"),
  "SourceSerif4-Regular": require("../../web/public/fonts/source-serif-4/SourceSerif4-Regular.ttf"),
  "SourceSerif4-Medium": require("../../web/public/fonts/source-serif-4/SourceSerif4-Medium.ttf"),
  "SourceSerif4-SemiBold": require("../../web/public/fonts/source-serif-4/SourceSerif4-SemiBold.ttf"),
  "SourceSerif4-Bold": require("../../web/public/fonts/source-serif-4/SourceSerif4-Bold.ttf"),
  "GeistMono-Regular": require("../../web/public/fonts/geist-mono/GeistMono-Regular.ttf"),
  "GeistMono-Medium": require("../../web/public/fonts/geist-mono/GeistMono-Medium.ttf"),
  "GeistMono-SemiBold": require("../../web/public/fonts/geist-mono/GeistMono-SemiBold.ttf"),
  "GeistMono-Bold": require("../../web/public/fonts/geist-mono/GeistMono-Bold.ttf"),
  "JetBrainsMono-Regular": require("../../web/public/fonts/jetbrains-mono/JetBrainsMono-Regular.ttf"),
  "JetBrainsMono-Medium": require("../../web/public/fonts/jetbrains-mono/JetBrainsMono-Medium.ttf"),
  "JetBrainsMono-SemiBold": require("../../web/public/fonts/jetbrains-mono/JetBrainsMono-SemiBold.ttf"),
  "JetBrainsMono-Bold": require("../../web/public/fonts/jetbrains-mono/JetBrainsMono-Bold.ttf"),
};
