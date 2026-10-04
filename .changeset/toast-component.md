---
"ui": patch
---

Add the Toast Component: `<Toaster position="top" | "bottom" />` and a Sonner-style `toast(title, { description, duration, action, id })` with `.success/.error/.info/.warning/.dismiss`, backed by a zustand queue. At most 3 show at once, stacked newest-nearest-the-edge; each auto-dismisses after 4s (paused while touched), can be swiped sideways or towards its edge (react-native-gesture-handler + Reanimated), is announced with its Variant, and offers screen readers a Dismiss action. It draws through the Portal into the root PortalHost, so it sits above native modals on iOS and clear of the safe area; animations come from `useMotion` and follow Reduce Motion live. Adds the `toast` and `toast-demo` Registry Items, a `use-motion` Registry Item, and react-native-gesture-handler (~2.32.0) to the Jest setup.
