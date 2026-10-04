# The Plugin is the nativecn repo root

The Plugin (#58) bundles the five Skills and the local nativecn MCP server (#20). The Skills live once, in `skills/<name>/` at the repo root (#16), and the Plugin must not carry a second copy that could drift. So the Plugin root is the repo root, and every host reads the same `skills/` folder:

| Host | Manifest | MCP config |
|---|---|---|
| Claude Code | `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` | `mcp.json` (via `mcpServers`) |
| Codex | `.claude-plugin/marketplace.json` (read as a Claude-compatible marketplace) + root `plugin.json` | `mcp.json` |
| Cursor | `.cursor-plugin/plugin.json` | `mcp.json` (via `mcpServers`) |
| Antigravity | root `plugin.json` | `mcp_config.json` |

The MCP server is `nativecn-cli`, `npx -y nativecn-cli@latest mcp`, the same entry `nativecn-cli agents` writes into projects. A test in `packages/cli` keeps the manifests and `MCP_COMMAND` in step.

## Choices made while building #58

- **The marketplace entry is a `url` source pointing at this repo**, not `"./"`. Codex 0.137 drops a plugin whose relative source is the marketplace root, and copies plugins without their symlinks, so neither `"./"` nor a `plugins/nativecn/skills` symlink works there. A `url` source to the repo works in both Claude Code and Codex. The cost: pinning the marketplace with `#<ref>` doesn't pin the Plugin, which follows the default branch.
- **No `version`.** Hosts then version the Plugin by commit, so users get Skill fixes without a release. The MCP server is `nativecn-cli@latest` either way.
- **The root `plugin.json` has only `$schema`, `name` and `description`**, the fields that both the Agent Plugins schema and Antigravity's schema allow.
- **The Plugin can't write `AGENTS.md`.** As #20 decided, `nativecn-setup` carries the Rules and has the agent run `init` or `agents` on first use.
