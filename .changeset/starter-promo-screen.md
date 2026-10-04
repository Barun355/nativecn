---
"nativecn-cli": patch
---

The Starter's promo Screen (decision #25, Layout A). The Starter's `src/app/index.tsx` is now the promo Screen: a hero, the Your Preset card read from `components.json`, a Components sampler, Next steps as selectable text (long-press to copy), and the SchemeSwitcher. It imports only the nine Components `create` installs (text, icon, button, badge, card, separator, container, segmented-tabs, scheme-switcher), so it takes the project's Style from them. The Starter smoke test checks the promo Screen, the chosen Preset, and that `create` installs exactly those items and their dependencies.
