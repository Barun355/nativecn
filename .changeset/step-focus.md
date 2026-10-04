---
"ui": patch
---

Multi-step Blocks (`sign-in-03`, `sign-up-02`, `sign-up-03`) now move screen-reader focus to the new step's heading on every step change: forward, Back, and Android's back button. While VoiceOver or TalkBack runs, the new step's field no longer takes the keyboard, so focus stays on the heading; without a screen reader the field takes the keyboard as before. Each Block carries its own `hooks/use-step-focus.ts`, and its `meta.a11y` says so.
