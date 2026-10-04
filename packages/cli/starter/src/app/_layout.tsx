import { Stack } from "expo-router";

// nativecn root Layout.
//
// `nativecn-cli create` wires the Theme and app-wide providers here once their
// Registry Items exist. Do not add Expo's default theming (constants/theme.ts,
// themed-text/view, use-color-scheme): nativecn's Theme replaces it.
//
// Target shape:
//   <ThemeProvider>            [nativecn] from @/theme, wraps everything
//     <KeyboardProvider>       [nativecn] react-native-keyboard-controller
//       <Stack />
//       <Toaster />            [nativecn] after <Stack /> so Toasts render above every Screen
//     </KeyboardProvider>
//   </ThemeProvider>
export default function RootLayout() {
  return <Stack />;
}
