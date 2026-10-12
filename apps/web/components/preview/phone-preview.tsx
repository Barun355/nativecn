"use client";

// The shared live preview renderer (decision #28): a phone frame showing nativecn's own
// Components and Screens with react-native-web, themed by a Preset. The builder at /create uses
// it; it is built to be reused on the docs pages. Loaded only in the browser (see preset-preview).

import { useMemo, type ReactNode } from "react";
import { View } from "react-native";
import type { Preset } from "preset";

import { KeyboardProvider } from "@/registry/components/primitives/keyboard";
import { PortalHost } from "@/registry/components/primitives/portal";
import { Toaster } from "@/registry/components/toast";
import { ThemeContext, createStyles, type SchemePreference } from "@/registry/theme";

import { ComponentsScreen, SignInScreen } from "./screens";
import { previewTheme, type PreviewScheme } from "./theme";

export type PreviewTab = "components" | "sign-in";

export type PhonePreviewProps = {
  preset: Preset;
  scheme: PreviewScheme;
  /** Called when a Component in the phone (the SchemeSwitcher) changes the Scheme. */
  onSchemeChange?: (scheme: PreviewScheme) => void;
  tab: PreviewTab;
};

const SCREENS: Record<PreviewTab, () => ReactNode> = {
  components: ComponentsScreen,
  "sign-in": SignInScreen,
};

const systemScheme = (): PreviewScheme =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export default function PhonePreview({ preset, scheme, onSchemeChange, tab }: PhonePreviewProps) {
  const theme = useMemo(
    () =>
      previewTheme(preset, scheme, (next: SchemePreference) =>
        onSchemeChange?.(next === "system" ? systemScheme() : next),
      ),
    [preset, scheme, onSchemeChange],
  );
  const Screen = SCREENS[tab];
  // The root providers `create` wires into an app's Root Layout, inside the phone.
  return (
    <ThemeContext value={theme}>
      <KeyboardProvider>
        <PhoneScreen>
          <Screen key={tab} />
          <PortalHost />
          <Toaster />
        </PhoneScreen>
      </KeyboardProvider>
    </ThemeContext>
  );
}

/** The phone's screen: the Scheme's background behind the content. */
function PhoneScreen({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.screen}>{children}</View>;
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
}));
