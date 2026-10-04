# Enforcing the Visual QA allowlist through agent permissions

Research for #32 (part of #1). Checked against official docs on 2026-10-04. Each claim links to the page it comes from.

**Gist:** `nativecn-cli init` can turn the Visual QA allowlist into committed, prefix-based auto-approve rules for three of the four agents: Claude Code (`.claude/settings.json`), Codex (`.codex/rules/*.rules`, trusted projects only) and Cursor (`.cursor/permissions.json` / `.cursor/cli.json`). Antigravity keeps permission rules in user settings only, so init can only print a snippet for it. These rules **skip prompts for the allowlisted forms**. They are **not a boundary**: any other command still falls back to a normal prompt, and none of the agents can confine a command to "the dev app". The main reasons are that `adb shell` arguments are re-parsed by the device's shell, that `input tap`, `screencap`, `uimode` and demo mode act on whatever is on screen or across the whole system, and that pattern languages are prefix-based. **Recommendation:** make it opt-in (`init --qa-permissions` or a prompt that defaults to no). Write allow rules only, no deny rules, so anything outside the list prompts. Change the Skill so that commands are rule-friendly: use `booted` instead of a simulator UDID, leave out `-s` when only one Android device is attached, and pull screenshots instead of redirecting with `>`.

## Summary table

| | Claude Code | OpenAI Codex | Cursor | Google Antigravity |
|---|---|---|---|---|
| **Committable project file** | `.claude/settings.json` → `permissions.allow` / `ask` / `deny` | `.codex/rules/<name>.rules` (Starlark `prefix_rule`) | IDE: `.cursor/permissions.json` → `terminalAllowlist`. CLI: `.cursor/cli.json` → `permissions.allow` / `deny` | **None.** Rules live in user settings (IDE settings UI, or `~/.gemini/antigravity-cli/settings.json`) |
| **Takes effect** | Allow rules only after the user accepts the workspace-trust dialog. Deny and ask rules apply right away. | Only when the project `.codex/` layer is trusted. Read at startup. | Re-read whenever the file changes | n/a |
| **Pattern syntax** | Whole command text with `*` wildcards anywhere (a `*` matches spaces). A trailing ` *` or `:*` means prefix. | Argument-list **prefix**. Each element is a literal or a union of literals. **No wildcards.** | IDE: case-sensitive token prefix, plus `cmd:argsGlob`. CLI: `Shell(base)` or `Shell(base:argsGlob)` | `command(prefix)` (token prefix) or `command(regex:…)` (each token is an anchored regex) |
| **Precedence** | deny > ask > allow, across all scopes | forbidden > prompt > allow (the most restrictive match wins) | IDE allowlist: no deny list. CLI: deny > allow. | Deny > Ask > Allow |
| **Chaining** | Splits on `&&` `\|\|` `;` `\|` `\|&` `&` and newlines. Every part must match. | Splits plain linear chains. Scripts with redirects, `$()`, vars or globs become one `bash -lc` invocation, which matches no rule. | Not documented | Pipelines and chains still prefix-match. Substitution and brace expansion force an exact full-line match. |
| **Redirection `>`** | The rule covers the command. The target is checked separately against `Edit` rules and the working directories. | Turns the whole script into an unsplit `bash -lc …`, so it prompts | Not documented | Not documented |

## Per agent

### Claude Code

- **Location and trust.** Project rules go in `.claude/settings.json`. Allow rules there "grant capability, so Claude Code applies them only after you accept the workspace trust dialog". Deny and ask rules apply immediately. Source: [permissions § trust](https://code.claude.com/docs/en/permissions).
- **Precedence.** "Rules are evaluated in order: deny, then ask, then allow… An allow rule can't carve an exception out of a deny rule." A deny at any scope beats an allow at any other scope. Source: [permissions](https://code.claude.com/docs/en/permissions).
- **Wildcards.** "A `*` in a Bash rule matches any text, including spaces." A trailing ` *` also matches the bare command, and `:*` is the same as a trailing ` *`. Claude Code **warns at startup** about an allow rule with a `*` before the subcommand (e.g. `Bash(git -C * status *)`) because the `*` can absorb injected options. Sources: [permissions § wildcard patterns](https://code.claude.com/docs/en/permissions#wildcard-patterns), [errors § wildcard before the rest of the command](https://code.claude.com/docs/en/errors#has-a-wildcard-before-the-rest-of-the-command). **Consequence:** `Bash(adb -s * shell input tap *)` triggers the warning, and that `*` can swallow extra text.
- **Compound commands.** These separators split a command: `&&`, `||`, `;`, `|`, `|&`, `&` and newlines. "A rule must match each subcommand independently." Deny and ask rules also match inside subshells, `$(...)` and loops. Source: [permissions § compound commands](https://code.claude.com/docs/en/permissions#compound-commands).
- **Wrappers and env vars.** Claude Code strips `timeout`, `time`, `nice`, `nohup`, `stdbuf`, `command`, `builtin` and bare `xargs`. "An allow rule won't match past an assignment of any other variable", so `ANDROID_SERIAL=x adb …` is **not** matched by an `adb …` allow rule. Source: [permissions § wrappers](https://code.claude.com/docs/en/permissions#process-wrappers).
- **Redirection.** "For `> file`… the check covers your `Edit` allow and deny rules, protected paths, and the working directories. A rule such as `Bash(git commit *)` allows the command, not the target." Source: [permissions § redirections](https://code.claude.com/docs/en/permissions#redirections). `/path` in project settings anchors at the project root, so `Edit(/.nativecn/qa/**)` covers the screenshot directory. Source: [permissions § path patterns](https://code.claude.com/docs/en/permissions).
- **Stated limits.** "Bash permission patterns that try to constrain command arguments are fragile." A rule "isn't a security boundary around the program": `/usr/bin/x` and `sh -c '…'` aren't matched. For real enforcement the docs point to the sandbox or a PreToolUse hook. Source: [permissions § what a Bash rule doesn't match](https://code.claude.com/docs/en/permissions#bash-rule-limits).

### OpenAI Codex

- **Location and trust.** Codex reads `.rules` files from `rules/` next to each active config layer. "Project-local rules under `<repo>/.codex/rules/` load only when the project `.codex/` layer is trusted." The files are read at startup. Rules are labelled **experimental**. Source: [Rules](https://learn.chatgpt.com/docs/agent-configuration/rules).
- **Syntax.** `prefix_rule(pattern=[…], decision="allow"|"prompt"|"forbidden", justification=…, match=[…], not_match=[…])`. Each pattern element is "a literal string" or "a union of literals". There is no wildcard, and matching is against the argument list as a prefix. `match` and `not_match` are inline tests checked when the file loads. Source: [Rules](https://learn.chatgpt.com/docs/agent-configuration/rules).
- **Semantics.** Rules decide what may run **outside the sandbox** without a prompt. "Codex applies the most restrictive decision when more than one rule matches (`forbidden` > `prompt` > `allow`)." Source: [Rules](https://learn.chatgpt.com/docs/agent-configuration/rules).
- **Chaining and redirection.** Codex splits a `bash -lc` script into separate commands only when it is plain words joined by `&&`, `||`, `;` or `|`. With "redirection (`>`, `>>`, `<`), substitutions, environment variables, wildcard patterns", the whole script is evaluated as one `["bash","-lc","<script>"]`. That form matches no adb rule, so it prompts. Source: [Rules](https://learn.chatgpt.com/docs/agent-configuration/rules).
- **Consequences.** A variable `-s <serial>` or simulator UDID can't be matched, because there are no wildcards. `exec-out screencap -p > file` always prompts. The `<scheme>` in `-d <scheme>://…` can't be restricted, because a prefix rule allows any trailing arguments. Rules can be tested with `codex execpolicy check --rules <file> -- <cmd>`.

### Cursor

- **IDE agent.** Cursor reads `.cursor/permissions.json` → `terminalAllowlist: string[]`. "Commit the per-repo file so teammates inherit the same rules." The file is re-read whenever it changes. Matching "is case-sensitive and uses prefix semantics" (`git` matches `git status` but not `gitk`), and `npm:install*` separates the base command from an args glob. **There is no deny list.** **Side effect:** when the key is present, it "**replaces** the corresponding IDE allowlist entirely". It is concatenated only with `~/.cursor/permissions.json`, the in-app editor becomes read-only, and a team admin policy overrides both. Source: [permissions.json reference](https://cursor.com/docs/reference/permissions).
- **`autoRun.allow_instructions` and `block_instructions`.** These are natural-language hints for the Auto-review classifier, "steering, not enforcement". Auto-review "is not a security boundary". Sources: [permissions.json reference](https://cursor.com/docs/reference/permissions), [run modes](https://cursor.com/docs/agent/security/run-modes).
- **Run modes.** In Allowlist mode, only allowlisted actions run without approval. In Auto-review mode, allowlisted calls run outside the sandbox and everything else is sandboxed or sent to the classifier. `.cursor/sandbox.json` can be committed. Source: [run modes](https://cursor.com/docs/agent/security/run-modes).
- **Cursor CLI.** The CLI reads `.cursor/cli.json` → `permissions.allow` / `deny` with `Shell(commandBase)` or `Shell(cmd:argsGlob)`. "Deny rules take precedence over allow rules." The docs don't say how chaining is parsed or whether `*` in the args glob crosses spaces. Source: [CLI permissions](https://cursor.com/docs/cli/reference/permissions).

### Google Antigravity

- **Syntax.** `command(prefix)`, `command(regex:…)` or `command(*)`, in Allow, Ask and Deny lists. "Conflicting rules are strictly evaluated in priority order: Deny > Ask > Allow." Source: [Agent Permissions](https://antigravity.google/docs/permissions).
- **Matching.** Prefix matching works on whole whitespace-separated tokens. With `regex:`, "each whitespace-separated token is evaluated as an anchored regular expression `^(?:pattern)$`". Command substitution, brace expansion and similar constructs disable prefix matching, so the full line must match character for character. Pipelines and chains still prefix-match. Source: [Agent Permissions (CLI tab)](https://antigravity.google/docs/permissions?tab=cli).
- **Location.** Rules live only in user settings: Settings > General > Permission Settings, or per project under Settings > Projects in the IDE, and `~/.gemini/antigravity-cli/settings.json` for the CLI. **The docs describe no workspace file**, so nothing init writes into the repo can set them. Source: [Agent Permissions](https://antigravity.google/docs/permissions).
- **Sandbox.** Under the Default preset, terminal commands run in a sandbox with workspace-only access and no network. Commands that need more prompt unless an allow rule covers them. Source: [Agent Permissions](https://antigravity.google/docs/permissions). adb talks to its server over a localhost socket, so expect adb to prompt unless it is allowed.
- **Reliability.** Forum threads report allow-list entries being ignored or moved after a restart ([1](https://discuss.ai.google.dev/t/bug-antigravity-still-ask-permission-even-command-is-already-on-allowed-list/118636), [2](https://discuss.ai.google.dev/t/bug-allow-list-terminal-commands-entries-are-moved-to-terminal-commands-after-ide-restart/178583)). These are user reports, not first-party docs.

## Skill changes that make rules possible

These apply across agents. They follow from the matching limits above.

1. **iOS: use `booted`, not a UDID.** simctl accepts the string `booted` wherever it takes a `<device>` and picks a booted simulator. If several are booted, it picks one (from `xcrun simctl help`). This makes the commands literal, so even Codex can match them, and `launch booted <bundleId>` pins launches to the dev app's bundle ID.
2. **Android: leave out `-s` when exactly one device is attached.** adb uses the single attached device, or `$ANDROID_SERIAL`, and fails with "more than one device/emulator" otherwise ([adb docs](https://developer.android.com/tools/adb)). A `-s <id>` form can't be matched by Codex, triggers Claude's wildcard warning, and `ANDROID_SERIAL=… adb` breaks Claude's allow matching. With several devices, the agent uses `-s` and gets a prompt.
3. **Screenshots: avoid `>`.**
   - Android: `adb shell screencap -p /data/local/tmp/nativecn-qa.png`, then `adb pull /data/local/tmp/nativecn-qa.png .nativecn/qa/<name>.png`.
   - iOS: `xcrun simctl io booted screenshot .nativecn/qa/<name>.png`.
   - Keep `.nativecn/qa/` gitignored.
   - Claude Code alone can safely keep `adb exec-out screencap -p > .nativecn/qa/x.png`, because it checks the redirect target against `Edit(/.nativecn/qa/**)`.
4. **Keep `uiautomator dump /dev/tty` as is.** It writes to stdout and has no redirect.

## Draft rules

Placeholders filled by init from the app config: `<scheme>` is the dev app's URL scheme, and `<bundleId>` is the iOS bundle identifier of the dev build.

### Claude Code: `.claude/settings.json` (merge into an existing `permissions` object)

```json
{
  "permissions": {
    "allow": [
      "Bash(adb devices -l)",
      "Bash(adb shell am start -a android.intent.action.VIEW -d <scheme>://*)",
      "Bash(adb shell input tap *)",
      "Bash(adb shell input swipe *)",
      "Bash(adb shell input text *)",
      "Bash(adb shell input keyevent *)",
      "Bash(adb exec-out uiautomator dump /dev/tty)",
      "Bash(adb exec-out screencap -p)",
      "Bash(adb shell screencap -p /data/local/tmp/nativecn-qa.png)",
      "Bash(adb pull /data/local/tmp/nativecn-qa.png .nativecn/qa/*)",
      "Bash(adb shell cmd uimode night yes)",
      "Bash(adb shell cmd uimode night no)",
      "Bash(adb shell settings put global sysui_demo_allowed 1)",
      "Bash(adb shell am broadcast -a com.android.systemui.demo *)",
      "Bash(xcrun simctl list devices booted -j)",
      "Bash(xcrun simctl launch booted <bundleId>)",
      "Bash(xcrun simctl openurl booted <scheme>://*)",
      "Bash(xcrun simctl io booted screenshot .nativecn/qa/*)",
      "Bash(xcrun simctl ui booted appearance dark)",
      "Bash(xcrun simctl ui booted appearance light)",
      "Bash(xcrun simctl status_bar booted override *)",
      "Bash(xcrun simctl status_bar booted clear)",
      "Edit(/.nativecn/qa/**)"
    ],
    "ask": [
      "Bash(adb *;*)",
      "Bash(adb *&*)",
      "Bash(adb *|*)",
      "Bash(adb *$*)",
      "Bash(adb *`*)"
    ]
  }
}
```

- **Why `ask` and not `deny`.** The `ask` entries catch shell metacharacters that are quoted or escaped locally but run by the **device's** shell, e.g. ``adb shell input tap 1 1 \; rm -r /sdcard/x``. Claude Code doesn't split these, so the trailing `*` would otherwise approve them. `ask` beats `allow` without blocking the user's own deliberate adb work. This is defense in depth, not a guarantee.
- **Unverified.** The docs don't say whether `Bash(adb exec-out screencap -p)` matches the command once its `> target` is removed. The redirections section implies it does. Test it before shipping.

### Codex: `.codex/rules/nativecn-qa.rules`

```python
# nativecn Visual QA allowlist. Loads only when this project's .codex/ is trusted.
def qa(pattern, **kw):
    prefix_rule(pattern = pattern, decision = "allow",
                justification = "nativecn Visual QA Loop allowlist", **kw)

qa(["adb", "devices", "-l"])
qa(["adb", "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d"])   # scheme NOT enforceable
qa(["adb", "shell", "input", ["tap", "swipe", "text", "keyevent"]])
qa(["adb", "exec-out", "uiautomator", "dump", "/dev/tty"])
qa(["adb", "shell", "screencap", "-p", "/data/local/tmp/nativecn-qa.png"])
qa(["adb", "pull", "/data/local/tmp/nativecn-qa.png"])
qa(["adb", "shell", "cmd", "uimode", "night", ["yes", "no"]])
qa(["adb", "shell", "settings", "put", "global", "sysui_demo_allowed", "1"])
qa(["adb", "shell", "am", "broadcast", "-a", "com.android.systemui.demo"])
qa(["xcrun", "simctl", "list", "devices", "booted", "-j"])
qa(["xcrun", "simctl", "launch", "booted", "<bundleId>"],
   match = ["xcrun simctl launch booted <bundleId>"],
   not_match = ["xcrun simctl launch booted com.apple.Preferences"])
qa(["xcrun", "simctl", "openurl", "booted"])                                    # URL NOT enforceable
qa(["xcrun", "simctl", "io", "booted", "screenshot"])
qa(["xcrun", "simctl", "ui", "booted", "appearance", ["dark", "light"]])
qa(["xcrun", "simctl", "status_bar", "booted", ["override", "clear"]])
```

- **Unverified Starlark.** The docs show only top-level `prefix_rule(...)` calls. If a helper `def` isn't accepted, inline the calls. Test with `codex execpolicy check --pretty --rules .codex/rules/nativecn-qa.rules -- adb shell input tap 1 2`.
- **Device-shell chaining.** Prefix rules can't exclude trailing metacharacters, so the same device-shell problem as Claude Code applies, with no `ask` override.

### Cursor IDE: `.cursor/permissions.json`

```jsonc
{
  // WARNING: when present this REPLACES the user's in-app terminal allowlist.
  "terminalAllowlist": [
    "adb devices -l",
    "adb shell am start -a android.intent.action.VIEW -d <scheme>://",
    "adb shell input tap", "adb shell input swipe", "adb shell input text", "adb shell input keyevent",
    "adb exec-out uiautomator dump /dev/tty",
    "adb shell screencap -p /data/local/tmp/nativecn-qa.png",
    "adb pull /data/local/tmp/nativecn-qa.png",
    "adb shell cmd uimode night",
    "adb shell settings put global sysui_demo_allowed 1",
    "adb shell am broadcast -a com.android.systemui.demo",
    "xcrun simctl list devices booted -j",
    "xcrun simctl launch booted <bundleId>",
    "xcrun simctl openurl booted <scheme>://",
    "xcrun simctl io booted screenshot",
    "xcrun simctl ui booted appearance",
    "xcrun simctl status_bar booted"
  ],
  "autoRun": {
    "block_instructions": [
      "adb or xcrun simctl commands that target an app other than <bundleId> / the <scheme>:// scheme, or that install, uninstall, clear data, push files or run arbitrary device shell commands"
    ]
  }
}
```

- **Prefix matching on `<scheme>://`.** The docs say prefix matching works on tokens ("`git status` and anything starting with `git status `"). It is unclear whether `…-d <scheme>://` matches `-d <scheme>://home`, where the prefix ends mid-token. If not, use the args-glob form `adb:shell am start -a android.intent.action.VIEW -d <scheme>://*`. Test this.
- **Cursor CLI.** `.cursor/cli.json` takes the same list as `Shell(adb:devices -l)`, `Shell(adb:shell input tap*)` and so on, plus a `deny` array.

### Antigravity: printed for the user to paste (Settings > Permission Settings, or `~/.gemini/antigravity-cli/settings.json`)

```json
{
  "permissions": {
    "allow": [
      "command(adb devices -l)",
      "command(regex:adb shell am start -a android\\.intent\\.action\\.VIEW -d <scheme>://\\S*)",
      "command(regex:adb shell input (tap|swipe|text|keyevent))",
      "command(adb exec-out uiautomator dump /dev/tty)",
      "command(adb shell screencap -p /data/local/tmp/nativecn-qa.png)",
      "command(adb pull /data/local/tmp/nativecn-qa.png)",
      "command(regex:adb shell cmd uimode night (yes|no))",
      "command(adb shell settings put global sysui_demo_allowed 1)",
      "command(adb shell am broadcast -a com.android.systemui.demo)",
      "command(xcrun simctl list devices booted -j)",
      "command(xcrun simctl launch booted <bundleId>)",
      "command(regex:xcrun simctl openurl booted <scheme>://\\S*)",
      "command(xcrun simctl io booted screenshot)",
      "command(regex:xcrun simctl ui booted appearance (dark|light))",
      "command(xcrun simctl status_bar booted)"
    ]
  }
}
```

Because Antigravity's regex is anchored per token, it is the only agent besides Claude Code that can pin the `<scheme>` token. How the regex rules interact with trailing tokens isn't spelled out.

## What can't be enforced (any agent)

- **"Dev app only" for input, screenshots, appearance and status bar.** `input tap/swipe/text/keyevent` act on whatever is in the foreground. `screencap` and `simctl io screenshot` capture the whole screen. `cmd uimode night` and demo mode are system-wide. `simctl ui appearance` and `status_bar` apply to the whole simulator. No rule can tie them to a package.
- **Android deep links.** `am start -a VIEW -d <scheme>://…` opens whichever app resolves the scheme. A rule can pin the scheme (Claude Code, Antigravity, maybe Cursor), but not the package. Adding `-p <package>`/`-n` to the Skill's command would pin the package and is rule-friendly.
- **iOS URLs.** `openurl` can be pinned to `<scheme>://` in Claude Code and Antigravity only.
- **Device-shell re-parsing.** `adb shell <args>` hands its arguments to the device's `sh`. Escaped or quoted `;`, `&&`, `|` and `$()` therefore run arbitrary device commands while the text still matches an allowed prefix. Only Claude Code's `ask` metacharacter rules or a PreToolUse hook can catch this.
- **Argument values in Codex.** Codex can't check any value (serials, scheme, paths, coordinates) except by listing literals.
- **Bypass forms.** `/usr/bin/adb`, `$ANDROID_HOME/platform-tools/adb`, `sh -c '…'` and `xcrun --sdk … simctl` don't match the rules. They fall back to a prompt, which is acceptable because the rules only allow, but they show that the rules don't **contain** the agent.
- **Output paths.** `adb pull … .nativecn/qa/*` and `simctl io booted screenshot .nativecn/qa/*` are not checked by Claude Code's Edit rules, which see only redirects and known file commands, so `../` traversal is possible. The risk is low, because the file written is a screenshot.
- **Antigravity from the repo.** There is no project file for Antigravity permissions.

## Recommendation for `init`

1. **Opt-in.** Use a `--qa-permissions` flag, or an init prompt that defaults to no. Reasons:
   - Allow rules grant capability, which Claude Code and Codex already gate behind trust.
   - Cursor's `terminalAllowlist` silently replaces the user's own IDE terminal allowlist.
   - The rules can't deliver "dev app only", so they shouldn't look like a security feature.
2. **Per agent when opted in:**
   - **Claude Code:** merge the allow and ask block above into `.claude/settings.json`, without touching existing keys. This is the best fit, because of metacharacter `ask` rules and Edit-checked redirects.
   - **Codex:** write `.codex/rules/nativecn-qa.rules`, and remind the user that the project must be trusted.
   - **Cursor:** write `.cursor/cli.json` permissions. Write `.cursor/permissions.json` `terminalAllowlist` only after warning about the override, or skip it and print the list for Settings.
   - **Antigravity:** print the snippet and the settings path. Write nothing.
3. **Never write deny rules for adb or simctl.** Unlisted commands should prompt, not break the user's own workflows.
4. **Ship the Skill changes** listed above (`booted`, no `-s` with one device, pull-based screenshots, `-p <package>` on `am start`). Without them, the Codex and Cursor rules can't match.
5. **Open design question for the map.** If the allowlist must be a real boundary, the only robust route is a tiny wrapper (e.g. `nativecn-cli qa tap 100 200`) that validates arguments and fixes the package and scheme, plus one exact rule per agent. Claude Code could instead use a PreToolUse hook. Either option departs from the current "raw platform tools" decision in [CONTEXT.md](../packages/agent-kit/CONTEXT.md).

## Sources

- Claude Code: [permissions](https://code.claude.com/docs/en/permissions), [errors § wildcard warning](https://code.claude.com/docs/en/errors#has-a-wildcard-before-the-rest-of-the-command)
- Codex: [Rules](https://learn.chatgpt.com/docs/agent-configuration/rules)
- Cursor: [permissions.json reference](https://cursor.com/docs/reference/permissions), [run modes](https://cursor.com/docs/agent/security/run-modes), [CLI permissions](https://cursor.com/docs/cli/reference/permissions)
- Antigravity: [Agent Permissions](https://antigravity.google/docs/permissions), [CLI tab](https://antigravity.google/docs/permissions?tab=cli)
- Android: [adb](https://developer.android.com/tools/adb). iOS: `xcrun simctl help` (the `booted` alias)
