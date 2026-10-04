import { ThemeProvider as NavigationThemeProvider, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { fonts } from "@/fonts";
import { ThemeProvider, useNavigationTheme, useTheme } from "@/registry/theme";

// Root Layout: nativecn's Theme wraps everything. The Showcase App imports the Registry source
// directly through `@/registry/*` (packages/ui), so it always shows the current Components.
export default function RootLayout() {
  return (
    <ThemeProvider fonts={fonts}>
      <Navigation />
    </ThemeProvider>
  );
}

function Navigation() {
  const theme = useTheme();
  const navigationTheme = useNavigationTheme();
  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </NavigationThemeProvider>
  );
}
