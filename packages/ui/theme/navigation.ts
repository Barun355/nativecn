import { useTheme } from "./provider";

/**
 * Expo Router / React Navigation theme derived from the Theme, so headers, tab bars and
 * drawers match the Preset. Pass it to Expo Router's ThemeProvider in the root Layout.
 */
export function useNavigationTheme() {
  const t = useTheme();
  const font = (fontFamily: string) => ({ fontFamily, fontWeight: "normal" as const });
  return {
    dark: t.scheme === "dark",
    colors: {
      primary: t.colors.primary,
      background: t.colors.background,
      card: t.colors.card,
      text: t.colors.foreground,
      border: t.colors.border,
      notification: t.colors.destructive,
    },
    fonts: {
      regular: font(t.type.body.fontFamily ?? "System"),
      medium: font(t.type.label.fontFamily ?? "System"),
      bold: font(t.type.button.fontFamily ?? "System"),
      heavy: font(t.type.h1.fontFamily ?? "System"),
    },
  };
}
