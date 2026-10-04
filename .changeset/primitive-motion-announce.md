---
"ui": patch
---

Primitives: `useMotion()` (timing, spring and enter/exit configs from the motion Tokens, instant under Reduce Motion, built on Reanimated 4) and `announce(message, { queue })` (screen-reader announcements that survive iOS focus changes; skips empty messages). FormFieldContext now announces errors through `announce()`.
