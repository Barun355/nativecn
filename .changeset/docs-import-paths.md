---
"nativecn-cli": patch
---

The MCP server's `view_items` and `get_item_examples` now show code with the import paths `add` writes (the project's aliases, or the default `@/components/…`, `@/theme` when there is no project) instead of the Registry's internal `@/registry/…` paths. Import rewriting is shared with the docs site through `rewriteItemImports` and the default aliases a fresh `create` writes.
