---
"ui": patch
---

Fix the Toaster blocking every touch on Android (#153). The Toast viewport is now a plain `pointerEvents="box-none"` View instead of a full-screen `GestureHandlerRootView` (Android ignores `pointerEvents` on a gesture root, so it took every tap). Each Toast gets its own gesture root, only as big as the Toast, so swipe-to-dismiss still works in apps whose root Layout has none. A test guards against full-screen or `pointerEvents` gesture roots in Registry code.
