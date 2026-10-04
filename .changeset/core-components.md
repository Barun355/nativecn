---
"ui": patch
---

Add the core Components: `Text` (type ramp Variants, text Colour Roles, `align`, the font-scaling switch with a 1.5× cap on chrome Variants, `selectable` on for body/small), `Icon` (a Lucide component at a Token size in a Colour Role, decorative unless `aria-label`), `Button` (primary/secondary/outline/ghost/destructive/link, sm/md/lg, icon slot with `loading` spinner and `status` icon, icon-only requires `aria-label`, built on Pressable) and `Container` (safe-area `edges`, `scroll`, `keyboard` via KeyboardAwareScroll, Token padding, `maxWidth` 640). Adds `button.sm`/`button.lg` Style Slots, a per-Slot typed `slot()`, an `announce` Registry Item, and `lucide-react-native` (^1.51.0) + `react-native-svg` (15.15.4).
