---
"ui": patch
---

Add the `Pressable` Primitive (`components/primitives/pressable.tsx`): the pressed look from a Style Slot applied instantly via `pressedStyle`, a tap area extended to the 48 minimum (from a declared `size` or measured with onLayout), no handlers while `disabled` or `loading`, optional `haptic` ("selection" | "light") behind `config.haptics`, and `role`/`aria-disabled`/`aria-busy`. Adds `expo-haptics` (~57.0.3).
