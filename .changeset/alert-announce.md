---
"ui": patch
---

A destructive or success Alert is now announced to screen readers once when it appears and again when its text changes ("Error: …", "Success: …", the same shape as a Toast), using the `announce` helper. Unrelated re-renders stay silent. default, warning and info Alerts are not announced. `aria-label` replaces the announced text. An Alert inside another Alert, or inside a FormField that is already announcing its error, does not announce. The alert Registry item now depends on `announce` and `form-field-context`, and its `meta.a11y` says all this.
