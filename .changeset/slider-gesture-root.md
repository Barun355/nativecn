---
"ui": patch
---

Fix the Slider crashing in apps made by `create` or `init` (#153). Their root Layout has no `GestureHandlerRootView` (Expo Router does not add one), so the Slider's `GestureDetector` threw "must be used as a descendant of GestureHandlerRootView" and the Screen showed a Render Error. The Slider now brings its own gesture root, only as big as the Slider, the same way each Toast does, so it works with or without one at the app root. `style` now lays out that outermost View, so layout styles such as `flex: 1` in a row still work.
