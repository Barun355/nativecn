---
"ui": patch
---

Add the SegmentedTabs and SchemeSwitcher Components. `SegmentedTabs` (with `SegmentedTabsList`, `SegmentedTabsTrigger`, `SegmentedTabsContent`) is in-screen tabs with `value`/`defaultValue`/`onValueChange` and the `segmented` or `underline` Variant: tabs are announced as `tab` with `aria-selected` in a `tablist` (SelectionGroup Primitive), give a light haptic tick, reach the 48 tap target, and only the selected Content renders; the indicator slides with the `fast` motion Token and jumps under Reduce Motion. `SchemeSwitcher` picks System, Light or Dark through `setScheme` (persisted): `segmented` is SegmentedTabs, `icon` is one icon-only Button labelled with the current Scheme that cycles through the three. Adds the `segmented-tabs.pressed` Style Slot (Vega and Nova) and the `segmented-tabs`, `segmented-tabs-demo`, `scheme-switcher` and `scheme-switcher-demo` Registry Items.
