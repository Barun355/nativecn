---
"ui": patch
---

Input and SearchField now reach the 48 touch target in every Size and Style without changing their visual height. TextInput has no `hitSlop`, so each field's frame is now a Pressable whose `hitSlop` is computed from the frame's height (its Style Slot, or a height set through `style`). A tap on the frame or within its `hitSlop` focuses the field, except while it is disabled or not editable. Screen readers skip the frame (`accessible={false}`) and reach the TextInput, with its `role` and `aria-*`, directly. Nova's 36-high fields get 6 above and below at Scale 1. Vega's look is unchanged. InputOTP gets the same check: its root's `hitSlop` comes from the `input-otp.cell` and `input-otp.root` Slots, so the row reaches 48 on both axes when it would fall short (e.g. Nova's 48-high cells at Scale below 1). A tap there focuses the hidden input.
