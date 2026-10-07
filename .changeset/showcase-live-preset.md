---
"ui": patch
---

The Theme exports `ThemeContext`, so a preview can layer a Theme over the app's (the Showcase App applies Presets live this way); apps never need it. The Preset Radius options' radius bases move to `presets/radius.ts` (`RADIUS_BASE`), shared by the Registry build and the Showcase App.
