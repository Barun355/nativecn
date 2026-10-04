---
"ui": patch
---

The Registry build now enforces the dependency rule (ADR 0007: Expo-pinned packages or a recorded exception) and the WCAG AA contrast check for every Preset, and detects a leftover `slot()` call from the code itself, so comments and strings that mention `slot(` no longer fail the build.

SearchField no longer fails to type-check once its Style Slots are inlined (it destructured an inlined object literal, which TypeScript rejects for excess properties).
