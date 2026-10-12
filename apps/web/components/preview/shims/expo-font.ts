// Web stand-in for expo-font in the preview: the fonts are loaded by @font-face rules (see
// preview-fonts.ts), so the Theme never waits on them.
export type FontSource = string | number | { uri: string };

export function useFonts(): [boolean, Error | null] {
  return [true, null];
}
