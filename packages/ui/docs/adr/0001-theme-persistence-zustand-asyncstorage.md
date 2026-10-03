# The Theme persists the light/dark choice with zustand and AsyncStorage

nativecn otherwise allows only Expo modules, Reanimated and Gesture Handler as dependencies. The Theme is the exception: it holds the user's light/dark choice (`'system' | 'light' | 'dark'`) in a zustand store, persisted to `@react-native-async-storage/async-storage` under the `nativecn-theme` key. Both libraries therefore become dependencies of every nativecn app.

We accepted that cost because an in-app appearance setting that resets on every launch is a broken experience, and zustand's `persist` middleware does this in a few lines that users and agents already recognise.

Only the scheme is persisted. The Preset is a file in the app and Scale is derived from the screen, so neither is runtime state.

## Consequences
- `ThemeProvider` is required, and `useTheme()` throws a clear development error outside it. The provider keeps the splash screen up until the persisted scheme and the fonts are loaded, so the first frame is never the wrong scheme.
- What may go into AsyncStorage at all is governed by the storage rule in [ADR 0005](../../../../docs/adr/0005-storage-by-sensitivity.md).
