---
"ui": patch
---

Add Preset colour data: hex Colour Roles for the 7 Base and 24 Accent Colours (converted from shadcn oklch by a reproducible script), shared destructive/success/warning/info/overlay roles, `composeColors(base, accent)`, and a Jest contrast check that every Foreground pair in all 168 combinations reaches WCAG AA in light and dark.
