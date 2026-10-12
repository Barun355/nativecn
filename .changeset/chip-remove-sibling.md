---
"ui": patch
---

A removable Chip no longer nests its × button inside the Chip's own button, which was invalid HTML on react-native-web and set off a React warning. A plain View now draws the pill around two sibling controls: the Chip's press (same role, name and selection as before) and the × button, which screen readers now reach as its own button named "Remove <label>" with a 48 tap area. It replaces the Chip's "Remove" accessibility action. The look is unchanged, and pressing the Chip still gives the whole pill the `chip.pressed` look.
