---
"nativecn-cli": patch
---

The Starter pins `react-dom` to the Expo SDK 57 version, as Expo's own template does, so `create` with npm no longer fails on a `react-dom` peer conflict while installing items. A new Starter smoke test runs `create` and `add` end to end in CI.
