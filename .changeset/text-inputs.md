---
"ui": patch
---

Add the text input Components: `Label` (label Variant, `required` marker read as "required"), `FormField` (label, description, error, required, status, disabled; provides FormFieldContext so the control reads "Email, text field, Enter a valid email"; the visible copies are hidden from screen readers), `Input` (TextInput props, `size` sm/md/lg, leading `icon`, `status`, `disabled`, focus ring in the `ring` Colour Role, automatic Show/Hide password toggle with `secureTextEntry`, joins FocusChain with a merged ref), `Textarea` (auto-grow from `minRows` 3 to `maxRows` 8, a counter when `maxLength` is set, skipped by FocusChain) and `SearchField` (search icon, automatic clear button, `loading`, `onSubmit`). Adds the `input.sm`/`input.lg` Style Slots, Registry `meta` (props, variants, docs, keywords, examples) and `<item>-demo` example items.
