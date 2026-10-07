import { ThemeProvider as NavigationThemeProvider, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { fonts } from "@/fonts";
import { LivePreset } from "@/preset/live-preset";
import { KeyboardProvider } from "@/registry/components/primitives/keyboard";
import { PortalHost } from "@/registry/components/primitives/portal";
import { Toaster } from "@/registry/components/toast";
import { ThemeProvider, useNavigationTheme, useTheme } from "@/registry/theme";

// The Drawer Component's example is a whole drawer Layout with an `index` screen; the Showcase
// runs it over its catch-all drawer route instead (see (drawer)/_layout.tsx).
LogBox.ignoreLogs(['[Layout children]: No route named "index" exists']);

// Deep links into a pushed Screen (`nativecn://block/sign-in-01`, `nativecn://preset/<code>`) keep
// the tabs underneath, so Back always leads into the app.
export const unstable_settings = { initialRouteName: "(tabs)" };

// Root Layout, as `create` wires it (ThemeProvider › KeyboardProvider › Stack, PortalHost and
// Toaster), plus the Showcase's live Preset. The Showcase App imports the Registry source directly
// through `@/registry/*` (packages/ui), so it always shows the current Components.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider fonts={fonts}>
        <LivePreset>
          <KeyboardProvider>
            <Navigation />
            <PortalHost />
            <Toaster />
          </KeyboardProvider>
        </LivePreset>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function Navigation() {
  const theme = useTheme();
  const navigationTheme = useNavigationTheme();
  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="tabs-demo" options={{ headerShown: false }} />
        <Stack.Screen name="block/[name]" options={{ headerShown: false }} />
        <Stack.Screen name="starter" options={{ headerShown: false }} />
        <Stack.Screen name="preset/[code]" options={{ headerShown: false }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
