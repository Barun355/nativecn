---
"ui": patch
---

The app's `ThemeProvider` now sets the native window background to the Scheme's `background` with `expo-system-ui` (SDK-pinned, ADR 0007), and follows Scheme changes, so the strips behind the status bar and the Android navigation bar are no longer white in dark mode (#153). A nested ThemeProvider (a dark hero, a preview) leaves it alone. The `theme` Registry Item adds the `expo-system-ui` dependency.
