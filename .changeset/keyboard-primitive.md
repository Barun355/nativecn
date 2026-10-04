---
"ui": patch
---

Add the keyboard handling Primitive (`components/primitives/keyboard.tsx`, Registry Item `keyboard`) on react-native-keyboard-controller: `KeyboardProvider` for the root Layout, `KeyboardAwareScroll` (scrolls the focused field into view, `bottomOffset` defaults to the `spacing[6]` Token, taps work while the keyboard is open) and `KeyboardStickyFooter` (keeps a form's main button `gap` above the keyboard and clear of the home indicator when it is closed).
