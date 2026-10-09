# nativecn-cli

## 0.0.1

### Patch Changes

- 6bc5264: `add`: compare the Theme's `colors.ts` and `tokens.ts` against what `create`/`init` compose from the project's Preset, so they are no longer reported as your edits. Real edits are still kept with `-y`, and `-o` restores the Preset-composed version instead of the Registry default.
- 2c4949d: `add`: install Components, Primitives and Blocks with their dependencies, Destinations, routes and Config Plugins.
- 7d9bec6: `agents`: write or refresh the Agent Kit (AGENTS.md section and CLAUDE.md, Skills in `.agents/skills` linked from `.claude/skills`, MCP config for Claude Code, Codex, Cursor and Antigravity, opt-in `--qa-permissions` allow rules, Plugin hints). Rules and Skills are fetched from GitHub at the CLI's version tag; `init` and `create` now write the Agent Kit for the chosen agents.
- b6d988a: CLI core: components.json schema, Registry fetching, Destination resolution (flat and feature mode), import rewriting and the dependency tree.
- 58f2b54: `init` and `create`: check for Expo SDK 57+ with Expo Router, create a new app from the Starter, choose a Preset (prompts, `--preset` or long flags), compose the Theme's colours, radius and fonts, download only the chosen fonts, and write `components.json`.
- bf0969f: `mcp`: a read-only MCP server over stdio (`npx -y nativecn-cli@latest mcp`) with `list_items`, `search_items`, `view_items`, `get_item_examples`, `get_add_command`, `get_project_config`, `get_audit_checklist`, `list_block_variants`, `list_preset_options` and `build_preset_code`. `createServer()` (from `nativecn-cli/mcp`) serves the same tools over any transport, without `get_project_config`, for the remote endpoint.
- 152eca7: The MCP server's `view_items` and `get_item_examples` now show code with the import paths `add` writes (the project's aliases, or the default `@/components/…`, `@/theme` when there is no project) instead of the Registry's internal `@/registry/…` paths. Import rewriting is shared with the docs site through `rewriteItemImports` and the default aliases a fresh `create` writes.
- 6d468f6: The MCP server's `view_items` shows an item's `meta.a11y` as an Accessibility list.
- 418d40a: `agents`: the Plugin hints now print the real install commands for Claude Code, Codex, Cursor and Antigravity, now that the nativecn repo is packaged as a Plugin.
- 9e9702c: The Starter's promo Screen (decision #25, Layout A). The Starter's `src/app/index.tsx` is now the promo Screen: a hero, the Your Preset card read from `components.json`, a Components sampler, Next steps as selectable text (long-press to copy), and the SchemeSwitcher. It imports only the nine Components `create` installs (text, icon, button, badge, card, separator, container, segmented-tabs, scheme-switcher), so it takes the project's Style from them. The Starter smoke test checks the promo Screen, the chosen Preset, and that `create` installs exactly those items and their dependencies.
- c3bda8a: The Starter pins `react-dom` to the Expo SDK 57 version, as Expo's own template does, so `create` with npm no longer fails on a `react-dom` peer conflict while installing items. A new Starter smoke test runs `create` and `add` end to end in CI.
