---
"ui": patch
---

Fix the white band above sign-in-02's dark hero and drawer-03's dark cover in light mode (#159). Where the app is not drawn under the status bar (Expo Go on Android insets the app below it), that strip is the window background, which the app's `ThemeProvider` sets to the Scheme's `background`. sign-in-02, while it is shown, and drawer-03, while the drawer is open, now set the window background to the hero's or cover's colour with `expo-system-ui` (SDK-pinned, ADR 0007) and put a light status bar over it; both go back to the app's Scheme when the Block unmounts or the drawer closes. drawer-03 previously kept the app's dark status-bar icons over its dark cover in light mode. Both Registry Items add the `expo-system-ui` dependency.
