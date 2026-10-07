import { useFonts, type FontSource } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { createContext, use, useEffect, useMemo, type ReactNode } from "react";
import { Appearance, StyleSheet, useColorScheme, useWindowDimensions } from "react-native";

import { colors, type Colors } from "./colors";
import { config } from "./config";
import { computeScale, scaleTokens, scaleValue, type ScaledTokens } from "./scale";
import { useSchemeStore, type SchemePreference } from "./scheme-store";
import { borderWidth, elevation, minTouchTarget, motion, opacity, radiusBase } from "./tokens";

// Keep the splash screen up until fonts and the persisted Scheme are ready, so the
// first frame is never the wrong font or the wrong Scheme.
SplashScreen.preventAutoHideAsync().catch(() => {});

export type Scheme = "light" | "dark";

export type Theme = ScaledTokens & {
  scheme: Scheme;
  schemePreference: SchemePreference;
  setScheme: (scheme: SchemePreference) => void;
  scale: number;
  /** Scale a one-off literal the same way Tokens are scaled. */
  scaleValue: (value: number) => number;
  colors: Colors;
  elevation: Record<"sm" | "md" | "lg", string>;
  borderWidth: typeof borderWidth;
  motion: typeof motion;
  opacity: typeof opacity;
  minTouchTarget: number;
  config: typeof config;
};

/**
 * The Theme that useTheme() reads. Apps never need it: ThemeProvider provides it. It is exported
 * for previews that layer a Theme over the app's (the Showcase App's live Preset).
 */
export const ThemeContext = createContext<Theme | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  /** Force a Scheme for this subtree (e.g. previews). Normally omitted: the user's persisted choice applies. */
  scheme?: SchemePreference;
  /** Font faces to load (PostScript name → asset). A no-op for faces already embedded by the expo-font plugin. */
  fonts?: Record<string, FontSource>;
};

export function ThemeProvider({ children, scheme: forced, fonts = {} }: ThemeProviderProps) {
  const preference = useSchemeStore((s) => s.scheme);
  const hydrated = useSchemeStore((s) => s.hydrated);
  const setPreference = useSchemeStore((s) => s.setScheme);
  const system = useColorScheme();
  const { width, height } = useWindowDimensions();
  const [fontsLoaded, fontError] = useFonts(fonts);

  const schemePreference = forced ?? preference;
  const resolved: Scheme =
    schemePreference === "system" ? (system === "dark" ? "dark" : "light") : schemePreference;
  const scale = computeScale(width, height);
  const noFonts = Object.keys(fonts).length === 0;
  const ready = hydrated && (noFonts || fontsLoaded || fontError != null);

  useEffect(() => {
    // Native chrome (keyboard, status bar, Switch) follows the app's Scheme, not just our Components.
    Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
  }, [preference]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  const theme = useMemo<Theme>(
    () => ({
      ...scaleTokens(scale, { radiusBase }),
      scheme: resolved,
      schemePreference,
      setScheme: setPreference,
      scale,
      scaleValue: (v) => scaleValue(v, scale),
      colors: colors[resolved],
      elevation: elevation[resolved],
      borderWidth,
      motion,
      opacity,
      minTouchTarget,
      config,
    }),
    [scale, resolved, schemePreference, setPreference],
  );

  if (!ready) return null;
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) {
    throw new Error(
      "useTheme() must be used inside <ThemeProvider> from @/theme. Wrap your app with it in app/_layout.tsx.",
    );
  }
  return theme;
}

/**
 * Build a Component's styles from the Theme. StyleSheet.create runs once per (Scale, Scheme)
 * and is cached, never per render.
 */
const styleCaches = new Set<Map<string, unknown>>();

/** Drop every cached Component style, so the next render rebuilds them (e.g. after switching Style in the Showcase App). */
export function resetStyles(): void {
  for (const cache of styleCaches) cache.clear();
}

export function createStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) {
  const cache = new Map<string, T>();
  styleCaches.add(cache);
  return function useStyles(): T {
    const theme = useTheme();
    const key = `${theme.scale}|${theme.scheme}`;
    let styles = cache.get(key);
    if (!styles) {
      styles = StyleSheet.create(factory(theme));
      cache.set(key, styles);
    }
    return styles;
  };
}
