---
"nativecn-cli": patch
---

`mcp`: a read-only MCP server over stdio (`npx -y nativecn-cli@latest mcp`) with `list_items`, `search_items`, `view_items`, `get_item_examples`, `get_add_command`, `get_project_config`, `get_audit_checklist`, `list_block_variants`, `list_preset_options` and `build_preset_code`. `createServer()` (from `nativecn-cli/mcp`) serves the same tools over any transport, without `get_project_config`, for the remote endpoint.
