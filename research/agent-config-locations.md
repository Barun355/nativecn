# Where agents read Rules, Skills, MCP and Plugins

Research for #18 (part of #1). Checked against official docs and source on 2026-10-04. Each claim links to the page that owns it.

**Gist:** Every Agent Kit part except MCP config now has one shared location that three of the four agents read. The exception is Claude Code. `AGENTS.md` works for rules in all four. `.agents/skills/` works for skills in Codex, Cursor and Antigravity, but Claude Code reads only `.claude/skills/`. MCP config differs in both file and format for each agent: `.mcp.json`, `.cursor/mcp.json`, `.codex/config.toml` (TOML) and `.agents/mcp_config.json` (which uses `serverUrl`). Plugins use a different manifest directory per agent, but Codex also reads Claude's and Cursor's marketplace files.

## Summary table (project level)

| | Claude Code | OpenAI Codex (CLI / IDE / app) | Cursor | Google Antigravity (2.0 / IDE / CLI) |
|---|---|---|---|---|
| **Rules file** | `CLAUDE.md` or `.claude/CLAUDE.md`, plus `CLAUDE.local.md` (personal). Reads `AGENTS.md` **only when no CLAUDE.md exists** (v2.1.277+). `@path` imports work. | `AGENTS.override.md`, then `AGENTS.md` (or a `project_doc_fallback_filenames` name), at most one per directory from the git root down to cwd. 32 KiB cap in total. | `AGENTS.md` at the root and in nested folders. `.cursorrules` is legacy. | `AGENTS.md` or `GEMINI.md` at the root or in subfolders. No frontmatter, always active. |
| **Scoped rules** | `.claude/rules/**/*.md`, with optional `paths:` frontmatter | none (one AGENTS.md per directory) | `.cursor/rules/*.mdc` (must be `.mdc`) with `description`, `globs` and `alwaysApply` frontmatter | `.agents/rules/*.md` with a **required** `trigger:` (`always_on`, `model_decision`, `glob` or `manual`). 24 KB per file. |
| **Skills (project)** | `.claude/skills/<name>/SKILL.md` (also nested `<subdir>/.claude/skills`) | `.agents/skills/<name>/SKILL.md`, every directory from cwd up to the repo root | `.agents/skills/` and `.cursor/skills/` (nested ones too). Also reads legacy `.claude/skills/` and `.codex/skills/`. | `.agents/skills/<name>/` (legacy `.agent/skills/` still works) |
| **Skills (user)** | `~/.claude/skills/` | `$HOME/.agents/skills`, `/etc/codex/skills` (admin) | `~/.agents/skills/`, `~/.cursor/skills/`, legacy `~/.claude/skills/` and `~/.codex/skills/` | 2.0/IDE: `~/.gemini/config/skills/`. CLI: `~/.gemini/antigravity-cli/skills/` |
| **SKILL.md** | Agent Skills standard (`name`, `description`). Claude adds its own fields (e.g. `disable-model-invocation`, `context`). | Agent Skills standard, plus optional `agents/openai.yaml` | Agent Skills standard. `name` must match the folder. | Agent Skills standard |
| **MCP (project)** | `.mcp.json`. JSON `mcpServers`, stdio `command`/`args`/`env` or `type: "http"` + `url`. | `.codex/config.toml`, **trusted projects only**. TOML `[mcp_servers.<name>]` with `command`/`args`/`env`, or `url`. | `.cursor/mcp.json`. JSON `mcpServers` with `command`/`args`/`env` or `url`/`headers`. | `.agents/mcp_config.json`. JSON `mcpServers` with `command`/`args`/`env` or **`serverUrl`** (not `url`). |
| **MCP (user)** | `~/.claude.json` (via `claude mcp add`) | `~/.codex/config.toml` (via `codex mcp add`) | `~/.cursor/mcp.json` | `~/.gemini/config/mcp_config.json` |
| **Plugin manifest** | `.claude-plugin/plugin.json` (optional). Folders: `skills/`, `commands/`, `agents/`, `hooks/hooks.json`, `.mcp.json`. | `.codex-plugin/plugin.json`. Folders: `skills/`, `.mcp.json`, hooks. Also falls back to `.claude-plugin/plugin.json` (see source). | `.cursor-plugin/plugin.json`. Folders: `rules/`, `skills/`, `agents/`, `commands/`, `hooks/hooks.json`, `mcp.json`. | `plugin.json` at the plugin root. Folders: `skills/`, `agents/`, `rules/`, `mcp_config.json`, `hooks.json`. |
| **Marketplace** | `.claude-plugin/marketplace.json`. Install with `/plugin marketplace add owner/repo` then `/plugin install x@mkt`. A team can declare plugins with `extraKnownMarketplaces` and `enabledPlugins` in `.claude/settings.json`. Public listing: Anthropic's directory. | `.agents/plugins/marketplace.json` (repo) or `~/.agents/plugins/...` (personal). **Also reads `.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json`.** Install with `codex plugin marketplace add` or `/plugins`. Public listing: the OpenAI curated catalog. | `.cursor-plugin/marketplace.json`. Public listing: cursor.com/marketplace (manually reviewed). Users install from the Customize panel. | A workspace plugin is a folder under `.agents/plugins/<name>/`. Global plugins live in `~/.gemini/config/plugins/`. Install with `agy plugin install <path>` or `/plugin install`. |

## Per agent detail and sources

### Claude Code
- **Rules.** Claude reads `./CLAUDE.md` or `./.claude/CLAUDE.md`, plus `./CLAUDE.local.md`. Files in parent directories load at launch and files in child directories load on demand. It also reads `.claude/rules/*.md`, which can be path-scoped with `paths:` frontmatter, and `@path` imports. Source: [memory](https://code.claude.com/docs/en/memory).
- **AGENTS.md.** Claude reads it by default only when there is no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the cwd or any directory above it. Otherwise it reads only the CLAUDE.md files. The documented way to share one file is a `CLAUDE.md` that imports `@AGENTS.md`. Claude does **not** read anything under `.agents/`. This needs v2.1.277+. Source: [memory § AGENTS.md](https://code.claude.com/docs/en/memory#agents-md).
- **Skills.** Locations are `.claude/skills/<name>/SKILL.md` (project), `~/.claude/skills/` (personal) and `<plugin>/skills/` (plugin, namespaced `/plugin:skill`). Skills follow the [Agent Skills](https://agentskills.io) open standard. Only `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools` are portable. Any other fields are Claude Code extensions. Source: [skills](https://code.claude.com/docs/en/skills).
- **MCP.** Project scope is `.mcp.json` at the repo root with the `mcpServers` key. User and local scope live in `~/.claude.json`. Source: [mcp](https://code.claude.com/docs/en/mcp).
- **Plugins.** The manifest is `.claude-plugin/plugin.json` and is optional. Only `name` is required. The default folders are `skills/`, `commands/`, `agents/`, `hooks/hooks.json`, `.mcp.json` and `bin/`. A `CLAUDE.md` at the plugin root is **not** loaded, so rules have to ship as a skill. Source: [plugins reference](https://code.claude.com/docs/en/plugins-reference).
- **Marketplace.** The file is `.claude-plugin/marketplace.json` with `name`, `owner` and `plugins[{name, source}]`. Sources can be a relative path, `github`, `git-subdir`, `url`, `npm` and others. Install with `claude plugin marketplace add owner/repo` then `claude plugin install name@marketplace`. Source: [plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces). `.claude/settings.json` can declare `extraKnownMarketplaces` and `enabledPlugins`, which take effect after the teammate trusts the folder. Source: [settings](https://code.claude.com/docs/en/settings).

### OpenAI Codex
- **Rules.** Codex reads `AGENTS.override.md` or `AGENTS.md` from `~/.codex` (global), then one file per directory from the git root down to cwd. The files are concatenated, root first, up to `project_doc_max_bytes` (32 KiB). Source: [AGENTS.md guide](https://learn.chatgpt.com/docs/agent-configuration/agents-md) (formerly developers.openai.com/codex/guides/agents-md).
- **Skills.** Codex reads `.agents/skills` in every directory from cwd up to the repo root, then `$HOME/.agents/skills`, `/etc/codex/skills`, and finally the built-in skills. A skill is a `SKILL.md` with `name` and `description`, plus optional `scripts/`, `references/`, `assets/` and `agents/openai.yaml`. `$skill-installer` installs curated skills. Source: [build skills](https://learn.chatgpt.com/docs/build-skills).
- **MCP.** Config lives in `~/.codex/config.toml`, and in `.codex/config.toml` for **trusted projects only**. The CLI, IDE extension and desktop app all share it. Format: `[mcp_servers.<name>]` with `command`, `args`, `env`/`env_vars`, or `url`, `bearer_token_env_var` and `http_headers`. CLI: `codex mcp add <name> -- <cmd>`. Source: [MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
- **Plugins.** Plugins bundle skills and MCP servers, plus optional hooks and apps. Users install them from `/plugins` in the CLI, and ChatGPT and Codex share one public catalog. Sources: [plugins](https://learn.chatgpt.com/docs/plugins) and [build plugins](https://learn.chatgpt.com/docs/build-plugins). The manifest path `.codex-plugin/plugin.json` comes from source: [`utils/plugins/src/lib.rs`](https://github.com/openai/codex/blob/main/codex-rs/utils/plugins/src/lib.rs). [`core-plugins/src/manifest.rs`](https://github.com/openai/codex/blob/main/codex-rs/core-plugins/src/manifest.rs) has tests that load an alternate `.claude-plugin/plugin.json` manifest, and the default `"skills": "./skills"` and `"mcpServers": "./.mcp.json"`.
- **Marketplace.** [`core-plugins/src/marketplace.rs`](https://github.com/openai/codex/blob/main/codex-rs/core-plugins/src/marketplace.rs) looks for `.agents/plugins/marketplace.json`, `.agents/plugins/api_marketplace.json`, `.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json`. **This means a Claude-format marketplace repo can also be added to Codex.**

### Cursor
- **Rules.** `.cursor/rules/*.mdc` files must use the `.mdc` extension; a plain `.md` file there is ignored. Their frontmatter is `description`, `globs` and `alwaysApply`. `AGENTS.md` also works, at the root and in nested folders, with the more specific file winning. `.cursorrules` is legacy. Source: [rules](https://cursor.com/docs/context/rules).
- **Skills.** Project: `.agents/skills/` and `.cursor/skills/`, including nested ones. User: `~/.agents/skills/` and `~/.cursor/skills/`. Legacy: `.claude/skills/`, `.codex/skills/` and their `~` versions. `name` must be lowercase-hyphenated and match the folder. Source: [skills](https://cursor.com/docs/context/skills).
- **MCP.** Project config is `.cursor/mcp.json` and global is `~/.cursor/mcp.json`. Both use `mcpServers` with `command`/`args`/`env`/`envFile` or `url`/`headers`, and support `${env:NAME}` and `${workspaceFolder}` interpolation. Source: [MCP](https://cursor.com/docs/context/mcp).
- **Plugins.** The manifest is `.cursor-plugin/plugin.json`, with `rules/`, `skills/`, `agents/`, `commands/`, `hooks/hooks.json`, `mcp.json` and `assets/`. A multi-plugin repo uses `.cursor-plugin/marketplace.json`. Submit at cursor.com/marketplace/publish; every listing is reviewed by hand. There is also an MCP install deeplink: `cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64`. Sources: [plugins](https://cursor.com/docs/plugins) and [building plugins](https://cursor.com/docs/plugins/building).

### Google Antigravity
- **Rules.** Global rules: `~/.gemini/{AGENTS,GEMINI}.md`, `~/.gemini/config/{AGENTS,GEMINI}.md` and `~/.gemini/config/rules/*.md`. Workspace rules: `AGENTS.md` or `GEMINI.md` at the root or in subfolders, which are always on and have no frontmatter, and `.agents/rules/*.md`, which need a `trigger:` frontmatter. Limits are 24 KB per file and a 20k-token budget for all always-on rules together. Source: [rules](https://antigravity.google/docs/rules). The older `.agent/rules/` and `.agent/workflows/` paths appear in third-party guides from the 2025 launch. The current docs use `.agents/`.
- **Skills.** Workspace skills live in `.agents/skills/<skill>/`, and legacy `.agent/skills` still works. Global skills are in `~/.gemini/config/skills/` (2.0 and IDE) or `~/.gemini/antigravity-cli/skills/` (CLI). Source: [skills](https://antigravity.google/docs/skills).
- **MCP.** Workspace config is `.agents/mcp_config.json` and global is `~/.gemini/config/mcp_config.json`. Both use `mcpServers` with `command`/`args`/`env` or `serverUrl`, plus `headers`, `oauth` and `disabled`. Users can also add servers from the MCP Store in the IDE. Source: [MCP](https://antigravity.google/docs/mcp).
- **Plugins.** A plugin is a `plugin.json` plus optional `mcp_config.json`, `hooks.json`, `skills/`, `agents/` and `rules/`. Workspace plugins go in `.agents/plugins/<name>/`. Global plugins go in `~/.gemini/config/plugins/` (2.0 and IDE) or `~/.gemini/antigravity-cli/plugins/` (CLI). Install with `agy plugin install <path>` or `/plugin install <name>`, and find curated plugins in the Customizations tab. Source: [plugins](https://antigravity.google/docs/plugins).

## skills.sh / `npx skills add`

Source: [vercel-labs/skills README](https://github.com/vercel-labs/skills).

- `npx skills add <source>` accepts `owner/repo`, a GitHub URL, a `tree/main/skills/<name>` path, GitLab or other git URLs, or a local path. It finds the `SKILL.md` folders in the source and asks which agents to install for.
- Flags: `-a/--agent <id>` (e.g. `claude-code`, `codex`, `cursor`, `antigravity`), `-g/--global`, `-s/--skill <name|'*'>`, `-y/--yes` and `--copy`. By default it puts one canonical copy on disk and symlinks each agent's directory to it.
- Install paths it uses (project / global):
  - `claude-code`: `.claude/skills/` / `~/.claude/skills/`
  - `codex`: `.agents/skills/` / `~/.codex/skills/`
  - `cursor`: `.agents/skills/` / `~/.cursor/skills/`
  - `antigravity`: `.agents/skills/` / `~/.gemini/antigravity/skills/`
  - `universal` (Amp and others): `.agents/skills/` / `~/.config/agents/skills/`
- Other commands: `list`, `find`, `remove`, `update` and `use`. [skills.sh](https://skills.sh) is the public directory and leaderboard, filled by the CLI's telemetry, which covers public repos only.
- **Two global paths in the CLI differ from the vendor docs.** For Codex the CLI writes `~/.codex/skills/`, but the docs say `$HOME/.agents/skills`. For Antigravity the CLI writes `~/.gemini/antigravity/skills/`, but the docs say `~/.gemini/config/skills/`. Project-level installs agree, so prefer project scope.
- **What this means for nativecn.** If the Skills live as `skills/<name>/SKILL.md` in the nativecn repo, then `npx skills add Barun355/nativecn` works for all four agents with no extra tooling. It puts `.agents/skills/` in place for three agents and `.claude/skills/` for Claude Code.

## Recommendation: what `nativecn-cli init` / `create` should write

The aim is one source of truth and the fewest files, with no duplicated rule text.

1. **Rules.**
   - Write `AGENTS.md` at the project root. It holds the canonical nativecn Rules, and Codex, Cursor and Antigravity read it as-is.
   - Write a `CLAUDE.md` that contains just `@AGENTS.md`, or append that line if a CLAUDE.md already exists. Without it, an existing or later CLAUDE.md stops Claude from reading AGENTS.md, and older Claude Code versions never read AGENTS.md at all.
   - Skip `.cursor/rules/*.mdc` and `.agents/rules/*.md` for now. Add them only if we later want glob-scoped rules (e.g. only for `components/ui/**`).
   - Keep AGENTS.md well under Codex's 32 KiB and Antigravity's 24 KB per-file limit.
2. **Skills.**
   - Write each Skill once to `.agents/skills/<name>/SKILL.md`, which Codex, Cursor and Antigravity read.
   - Point Claude at the same files: symlink `.claude/skills/<name>` to `../../.agents/skills/<name>`, or copy it on Windows or when symlinks fail. This is the same approach `npx skills` takes.
   - Use only the portable frontmatter fields (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`), and keep `name` equal to the folder name, since Cursor requires that.
   - Alternative: shell out to `npx skills add Barun355/nativecn -a claude-code -a codex -a cursor -a antigravity -y`. That avoids writing our own install code but adds a network dependency.
3. **MCP.** Write one file per agent, only for the agents the user selected. A remote server avoids `npx` cold starts; a stdio `npx -y @nativecn/mcp` works offline. The four formats:
   - Claude Code: `.mcp.json` → `{"mcpServers":{"nativecn":{"command":"npx","args":["-y","<pkg>"]}}}`
   - Cursor: `.cursor/mcp.json`, same JSON shape.
   - Codex: `.codex/config.toml` → `[mcp_servers.nativecn]\ncommand = "npx"\nargs = ["-y", "<pkg>"]`. Tell the user that Codex loads it only once the project is trusted. Otherwise print `codex mcp add nativecn -- npx -y <pkg>`.
   - Antigravity: `.agents/mcp_config.json`, same shape as Claude and Cursor, but a remote server uses **`serverUrl`**, not `url`.
   - Merge into an existing file; never overwrite it.
4. **Plugin.** Do not write plugins from `init`; publish them instead.
   - Make the nativecn repo itself the marketplace, with `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` sharing the same `skills/` and `.mcp.json`.
   - Codex already reads `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` (see the Codex source above), so one Claude-format plugin also covers Codex.
   - Add `.cursor-plugin/plugin.json`, which can reuse `skills/`, `rules/` and `mcp.json`, and submit it to the Cursor marketplace.
   - Antigravity plugins are just a folder (`plugin.json`, `skills/`, `rules/`, `mcp_config.json`) that users can install with `agy plugin install`.
   - At most, `init` could add `extraKnownMarketplaces` and `enabledPlugins` to `.claude/settings.json` so Claude Code teammates are offered the plugin. Keep that opt-in.
5. **llms.txt.** None of the four agents reads it automatically. Host it on the docs site and point to it from the AGENTS.md Rules.

### Files written per agent (summary)

| Agent | Rules | Skills | MCP |
|---|---|---|---|
| Claude Code | `CLAUDE.md` (`@AGENTS.md`) | `.claude/skills/*` → symlink to `.agents/skills/*` | `.mcp.json` |
| Codex | `AGENTS.md` | `.agents/skills/*` | `.codex/config.toml` (needs trust) |
| Cursor | `AGENTS.md` | `.agents/skills/*` | `.cursor/mcp.json` |
| Antigravity | `AGENTS.md` | `.agents/skills/*` | `.agents/mcp_config.json` (`serverUrl`) |

## Open questions for #20 / #21
- Should the nativecn MCP server be remote (HTTP) or a local stdio `npx` package? The answer changes the key each agent needs: `url` for Claude and Cursor, `url` in TOML for Codex, `serverUrl` for Antigravity.
- On Windows, should Skills for Claude be symlinked or copied?
- Should `init` ask which agents to configure, or detect existing `.cursor/`, `.claude/`, `.codex/` and `.agents/` folders?
