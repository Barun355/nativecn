---
"nativecn-cli": patch
---

`add`: compare the Theme's `colors.ts` and `tokens.ts` against what `create`/`init` compose from the project's Preset, so they are no longer reported as your edits. Real edits are still kept with `-y`, and `-o` restores the Preset-composed version instead of the Registry default.
