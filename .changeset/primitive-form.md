---
"ui": patch
---

Primitives: FormFieldContext (label as the accessible name, error as the description announced once, status/disabled/required passed down) and FocusChain with `useFocusChainField` (Next/Done in order, skips disabled, hidden and multiline fields, a field's own handler wins, onSubmit on Done).
