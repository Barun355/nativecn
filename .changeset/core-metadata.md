---
"ui": patch
---

Add Registry metadata (title, categories, `meta.kind/props/variants/docs/keywords/examples`) for `text`, `icon`, `button` and `container`, with `text-demo`, `icon-demo`, `button-demo` and `container-demo` examples, and add `meta` to the Primitives (`form-field-context`, `focus-chain`, `keyboard`, `portal`, `selection-group`, `pressable`), the hooks (`use-controllable-state`, `use-motion`), the `announce` helper and the `theme` item, so the MCP server's `list_items`, `search_items` and `view_items` describe every item. SearchField's loading indicator is now the Spinner Component (silent inside the busy field) instead of ActivityIndicator, and the `search-field` item depends on `spinner`.
