# Build every Primitive ourselves rather than wrapping native controls

Expo recommends native controls (`Alert.alert`, `@expo/ui` BottomSheet, Menu, Picker, DateTimePicker, and Expo Router `formSheet`) for overlays and pickers. nativecn deliberately builds all of these itself: Dialog, BottomSheet, Select, DropdownMenu, DateTimePicker, Combobox and the rest.

Native controls render outside the Theme (an `@expo/ui` `Host` tree can't take our Tokens), look different on iOS and Android, and can't be edited in place by the user. That breaks the core promise: one Theme, the same look on both platforms, and fully owned source.

## Consequences

- We own focus management, screen-reader behaviour, keyboard avoidance and gestures for every overlay. That is a large, ongoing accessibility commitment.
- Reviewers will cite "Web Modal" native slop. The answer is that owning the source matters more here, and platform feel comes from Tokens and motion, not from system controls.
