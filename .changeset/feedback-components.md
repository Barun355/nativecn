---
"ui": patch
---

Add the feedback Components: `Skeleton` (`width`, `height`, `circle`; pulses via useMotion, still under Reduce Motion, hidden from screen readers), `Spinner` (`size` sm/md/lg from the iconSize Tokens, `color` Colour Role; a turning Lucide LoaderCircle announced as a busy progress bar), `Progress` (`value` 0–100 animated, `indeterminate` sweep; `role="progressbar"` with `aria-valuenow`), `Alert` with `AlertTitle`/`AlertDescription` (default/destructive/success/warning/info, a default Lucide icon per Variant, `role="alert"`) and `EmptyState` (`icon`, `title`, `description`, action as `children`). Button's `loading` now uses the Spinner. Adds Registry Items with `meta` (props, variants, docs, keywords, examples), `<item>-demo` examples, and a `use-motion` Registry Item.
