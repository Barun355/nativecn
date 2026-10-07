// Open-source licences shown on the Built for AI tab: every package the app ships and every
// bundled font. scripts/licenses.test.ts keeps this in step with package.json and the fonts.

export type Licence = { name: string; licence: string; url: string };

const npm = (name: string, licence = "MIT"): Licence => ({
  name,
  licence,
  url: `https://www.npmjs.com/package/${name}`,
});

export const PACKAGE_LICENCES: Licence[] = [
  npm("@hookform/resolvers"),
  npm("@react-native-async-storage/async-storage"),
  npm("expo"),
  npm("expo-clipboard"),
  npm("expo-constants"),
  npm("expo-font"),
  npm("expo-haptics"),
  npm("expo-image"),
  npm("expo-linking"),
  npm("expo-router"),
  npm("expo-splash-screen"),
  npm("expo-status-bar"),
  npm("expo-system-ui"),
  npm("lucide-react-native", "ISC"),
  npm("react"),
  npm("react-hook-form"),
  npm("react-native"),
  npm("react-native-gesture-handler"),
  npm("react-native-keyboard-controller"),
  npm("react-native-reanimated"),
  npm("react-native-safe-area-context"),
  npm("react-native-screens"),
  npm("react-native-svg"),
  npm("react-native-worklets"),
  npm("zod"),
  npm("zustand"),
];

/** The 8 Preset fonts, each under the SIL Open Font License 1.1 (its OFL.txt ships beside it). */
export const FONT_LICENCES: Licence[] = [
  { name: "Inter", licence: "OFL-1.1", url: "https://github.com/rsms/inter" },
  { name: "Geist", licence: "OFL-1.1", url: "https://github.com/vercel/geist-font" },
  { name: "DM Sans", licence: "OFL-1.1", url: "https://github.com/googlefonts/dm-fonts" },
  { name: "Figtree", licence: "OFL-1.1", url: "https://github.com/erikdkennedy/figtree" },
  { name: "Lora", licence: "OFL-1.1", url: "https://github.com/cyrealtype/Lora-Cyrillic" },
  {
    name: "Source Serif 4",
    licence: "OFL-1.1",
    url: "https://github.com/adobe-fonts/source-serif",
  },
  { name: "Geist Mono", licence: "OFL-1.1", url: "https://github.com/vercel/geist-font" },
  { name: "JetBrains Mono", licence: "OFL-1.1", url: "https://github.com/JetBrains/JetBrainsMono" },
];
