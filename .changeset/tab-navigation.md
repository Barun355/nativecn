---
"ui": patch
---

Add the `TabNavigation` Component: the custom `tabBar` of an Expo Router JS Tabs Layout (`expo-router/js-tabs`, never NativeTabs) with `classic` (full-width bar, top border) and `floating` (inset pill, Slot radius, shadow `lg`, above the bottom safe area) Variants. Per-tab title/label, icon, badge, accessibility label and test ID come from `Tabs.Screen` options; `href: null` routes are skipped and `tabBarStyle: { display: "none" }` hides the bar. Presses emit `tabPress` (honouring `preventDefault`) then navigate; long presses emit `tabLongPress`. A `tablist` of `tab`s with `aria-selected`, badges drawn with the Badge Component (destructive) and spoken in the tab's name ("Inbox, 3 new"), at least 48 high. Adds `tabIcon(LucideIcon)` to draw tab icons through Icon, the `tab-navigation.pressed` Style Slot, Registry `meta` and the `tab-navigation-demo` example.
