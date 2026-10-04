---
"nativecn-cli": patch
---

`agents`: write or refresh the Agent Kit (AGENTS.md section and CLAUDE.md, Skills in `.agents/skills` linked from `.claude/skills`, MCP config for Claude Code, Codex, Cursor and Antigravity, opt-in `--qa-permissions` allow rules, Plugin hints). Rules and Skills are fetched from GitHub at the CLI's version tag; `init` and `create` now write the Agent Kit for the chosen agents.
