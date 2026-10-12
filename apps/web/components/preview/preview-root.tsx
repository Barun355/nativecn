"use client";

// The inside of the preview's phone: the root providers `create` wires into an app's Root Layout,
// themed by a Preset. Shared by the builder's renderer (phone-preview) and the docs pages'
// (docs-phone). Browser-only (react-native-web), so it is reached only through a lazy import.

import { useMemo, type ReactNode } from "react";
import { View } from "react-native";
import type { Preset } from "preset";

import { KeyboardProvider } from "@/registry/components/primitives/keyboard";
import { PortalHost } from "@/registry/components/primitives/portal";
import { Toaster } from "@/registry/components/toast";
import { ThemeContext, createStyles, type SchemePreference } from "@/registry/theme";

import { PreviewPresetContext } from "./preset-context";
import { previewTheme, type PreviewScheme } from "./theme";

export type PreviewRootProps = {
  preset: Preset;
  scheme: PreviewScheme;
  /** Called when a Component in the phone (the SchemeSwitcher) changes the Scheme. */
  onSchemeChange?: (scheme: PreviewScheme) => void;
  children: ReactNode;
};

const systemScheme = (): PreviewScheme =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function PreviewRoot({ preset, scheme, onSchemeChange, children }: PreviewRootProps) {
  const theme = useMemo(
    () =>
      previewTheme(preset, scheme, (next: SchemePreference) =>
        onSchemeChange?.(next === "system" ? systemScheme() : next),
      ),
    [preset, scheme, onSchemeChange],
  );
  return (
    <PreviewPresetContext value={preset}>
      <ThemeContext value={theme}>
        <KeyboardProvider>
          <PhoneScreen>
            {children}
            <PortalHost />
            <Toaster />
          </PhoneScreen>
        </KeyboardProvider>
      </ThemeContext>
    </PreviewPresetContext>
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
