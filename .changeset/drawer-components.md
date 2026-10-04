---
"ui": patch
---

Add the `drawer` Component for Expo Router's drawer (`expo-router/drawer`, no extra dependency): `DrawerContent` (spread the `drawerContent` props in; header pinned on top, footer pinned at the bottom, safe-area aware scrolling body), `DrawerHeader`, `DrawerSection` (`title`), `DrawerItem` (`label`, `icon`, `href`, `badge`, active state and `aria-selected` derived from `usePathname()`, `variant` default/text, `tone` default/accent; tapping navigates and closes the drawer) and `DrawerFooter`. Adds the `drawer.label`, `drawer.pressed` and `drawer.tint` Style Slots, Registry `meta`, a `drawer-demo` example (an `app/(drawer)/_layout.tsx`), and `expo-router` (~57.0.24) as a dev dependency for types and tests.
