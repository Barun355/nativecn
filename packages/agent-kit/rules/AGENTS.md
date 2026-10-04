<!-- nativecn:start -->
# nativecn

This project uses **nativecn**, a copy-into-your-project component system for Expo apps (iOS and Android). Components, Blocks and the Theme are copied into this app's source by `nativecn-cli`. They belong to this project now: read them, use them and edit them like any other code.

- Settings live in `components.json`: the Preset, the `structure` (`flat` or `feature`), the aliases and the `routes` folder.
- The Theme lives in `src/theme/` (or `theme/` in apps without `src/`).
- Discover Components, Blocks and Presets through the nativecn MCP server (see "MCP tools"). Do not guess item names, props or Variants.

## Rules

These 12 Rules are non-negotiable. Follow them in every file you write or edit in this app.

1. **Styling.** Use Tokens only, through `createStyles`. Never hard-code colours or sizes; use `t.scaleValue(n)` (from `useTheme()`) only for a genuine one-off; `t.scale` is the zoom factor itself, not a function. Never use Tailwind, NativeWind or `className`.
2. **Building blocks.** All text uses `Text`. All glyphs use `Icon` (pass in a Lucide component). Wrap every Screen's content in `Container`.
3. **Feedback.** Never use `Alert.alert` or any other platform alert or dialog. Use nativecn's own `toast()` and Alert Components.
4. **Navigation.**
   - The drawer comes only from `expo-router/drawer`. Never install `@react-navigation/*` or the npm package `expo-drawer`.
   - Use `SegmentedTabs` for in-screen tabs and `TabNavigation` for the bottom bar. Never confuse either with Expo Router's `Tabs`.
5. **Dependencies (ADR 0007).** Use `npx expo install` for SDK-pinned packages. For anything else, **ask the user first**.
6. **Storage (ADR 0005).** AsyncStorage holds only non-sensitive preferences. Tokens, credentials and personal data go in `expo-secure-store`.
7. **Placement (ADR 0008).**
   - Follow `structure` in `components.json`.
   - Reuse global items first.
   - An item used by one Feature stays in that Feature.
   - Promote it to global the moment a second Feature needs it (components, hooks, utils, screens).
8. **The Preset is fixed.** Never change `preset` in `components.json` or try to switch Style.
9. **Adding items.**
   - Use MCP `get_add_command` or `nativecn-cli add`.
   - Always pass `--route` for Screen Blocks, and `--feature` too in feature mode.
   - Run `--diff` before updating, and use `-o` only when the user asks for their edits to be replaced.
10. **Forms.** Use react-hook-form + zod, wired through `FormField`, with fields inside `FocusChain`.
11. **Accessibility.** Meet the 9-point checklist below. Never remove `role` or `aria-*`.
12. **After changes.** Run `get_audit_checklist` and fix anything it flags.

### Notes on the Rules

- **Feedback:** validation errors appear under their field via `FormField`. Server errors thrown from `onSubmit`, and success messages, are shown only through `toast()`.
- **Blocks never talk to a server.** Form Blocks call the Screen's `onSubmit(values)`. You write the backend call in the Screen, and any session you store follows Rule 6.
- **Dependencies:** the recorded exceptions to Rule 5 are zustand, react-hook-form, zod and lucide-react-native. `nativecn-cli add` installs them at the version range the item pins.
- **Theme edits:** you may hand-edit Tokens in `src/theme/` when the user asks (for example to add a Colour Role). Keep light and dark keys identical in `colors.ts`. Never re-run setup to change the Preset.
- **Scheme:** switch light/dark with `setScheme('system' | 'light' | 'dark')` from `useTheme()`, or the `SchemeSwitcher` Component. `ThemeProvider` must wrap the root Layout.
- **Components:** every Component takes only `style` as an override, merged last onto the root. For deeper changes, edit the Component's file. Use the `role` / `aria-*` props, not `accessibility*`.

### Accessibility checklist (9 points)

1. Correct `role`.
2. An accessible name: from the visible text, or `aria-label` when there is none (icon-only Buttons require it).
3. `aria-disabled`, `aria-busy`, `aria-checked`, `aria-selected`, `aria-expanded` as applicable.
4. `hitSlop` up to the 48 minimum tap target.
5. No handler runs while disabled or loading.
6. Error and success are announced to screen readers.
7. Reduce Motion is honoured.
8. The font-scaling switch in `theme/config.ts` is honoured, with the 1.5x cap on chrome Variants.
9. An optional hint passes through.

## Placement

Default aliases: `@/components`, `@/hooks`, `@/utils`, `@/theme`, `@/screens` (and `@/features` in feature mode).

| Folder | Holds |
|---|---|
| `src/app/` | routes only (Screens and Layouts) |
| `src/components/` | Components; rendering Primitives in `src/components/primitives/`; drawer Blocks |
| `src/hooks/` | Primitive hooks and app hooks |
| `src/utils/` | helpers |
| `src/theme/` | the Theme |
| `src/screens/` | Screen Blocks, rendered by a route file |
| `src/features/<feature>/{components,hooks,screens,utils}` | feature mode only |

In feature mode, nativecn Components and Primitives always stay global. Screen Blocks go to a named Feature (`--feature`).

## Skills

Five Skills are installed in `.agents/skills/` (and `.claude/skills/`). Load the matching Skill before starting its task.

| Skill | Use when |
|---|---|
| `nativecn-setup` | starting a new app or adding nativecn to an existing one: `create`/`init` flags, custom Presets, applying the init Layout snippet, choosing agents |
| `nativecn-build-screen` | building a Screen (login, settings, profile...): pick a Block, add it with `--route`/`--feature`, compose Components, wire routes and Layouts |
| `nativecn-theme` | changing colours, dark mode, fonts or other Tokens in `src/theme/`; Scheme switching; migrating Expo's default theme files |
| `nativecn-component-authoring` | writing a new Component or adding a Variant: the Component contract, the accessibility checklist, Primitives, `createStyles`, placement |
| `nativecn-visual-qa` | "match the design", "screenshot and fix": run the Visual QA Loop on a device |

## MCP tools

The nativecn MCP server (`nativecn-cli mcp`) is read-only: it never writes files or runs the CLI. Use it instead of guessing.

| Tool | Use it to |
|---|---|
| `list_items` | list all Components, Primitives and Blocks, by type and category |
| `search_items` | find items for a need (e.g. "dark mode toggle" → SchemeSwitcher) |
| `view_items` | read an item's files, props, Variants and docs in this project's Style |
| `get_item_examples` | get ready-to-copy usage examples |
| `get_add_command` | get the exact `nativecn-cli add ...` command with the correct `--route` / `--feature` for this project |
| `get_project_config` | read this project's `components.json` |
| `get_audit_checklist` | get the post-change checklist (Tokens only, no `Alert.alert`, placement, accessibility) |
| `list_block_variants` | compare the Block Variants for a purpose **before** choosing a Block |
| `list_preset_options` + `build_preset_code` | list every Style, colour, radius and font, and build the code for a custom Preset |

If the MCP reports that the Registry is unreachable, tell the user. Never invent an item or command.

## Key commands

Always run `nativecn-cli` through `npx nativecn-cli@latest`.

- **Create a new app:** `npx nativecn-cli@latest create [items...]` (alias of `init`).
  - Flags: `-p/--preset <code>`, `-n/--name`, `-y/--yes`, `-d/--defaults`, `-f/--force`, `-c/--cwd`, `-s/--silent`, `--style --base --accent --radius --font --heading-font`, `--folder-feat`, `--agents claude,codex,cursor,antigravity`, `--qa-permissions`.
  - Turn the user's request ("Nova, violet, Lora headings") into flags or a Preset code. Never silently use defaults.
- **Set up an existing app:** `npx nativecn-cli@latest init`. It never rewrites existing files; apply the root-Layout snippet it prints (`ThemeProvider`, `KeyboardProvider`, `<Toaster />`). Requires Expo SDK 57 or newer with Expo Router.
- **Add items:** `npx nativecn-cli@latest add <items...>`. Items are names only.
  - `--route <path>`: always for Screen Blocks (e.g. `--route "(auth)/sign-in"`).
  - `--feature <name>`: always for Screen Blocks in feature mode.
  - `--diff [path]`: compare local files with upstream before updating. It never writes.
  - `-o/--overwrite`: only when the user asks for their edits to be replaced. `-y` alone never overwrites.
  - Also: `--dry-run`, `--view [path]`, `-p/--path`, `-c/--cwd`, `-a/--all`, `-s/--silent`.
  - Example: `npx nativecn-cli@latest add sign-in-02 --feature auth --route "(auth)/sign-in"`.
  - Read the summary: it says when a native rebuild is needed.
- **Refresh the Agent Kit:** `npx nativecn-cli@latest agents [--agents <list>] [--update] [--qa-permissions]` rewrites these Rules, the Skills and the MCP config.
- **Run the MCP server:** `npx -y nativecn-cli@latest mcp` (stdio).

## Visual QA device allowlist

The Visual QA Loop drives devices with raw platform tools. Use only the commands below.

- **Scope:** take screenshots, open and navigate **the dev app only** (its scheme, package and bundle id from `app.json`, or Expo Go's `exp://` URL in Expo Go), and check Screens, User Flows and Components. **Nothing else unless the user asks.**
- **Android device selection:** leave out `-s <serial>` when exactly one device is attached. With several devices, `-s <serial>` is required and the user is prompted.
- **iOS Simulator:** always target `booted`, never a simulator id.
- **Never** use `adb shell` for anything outside this list, and never redirect output with `>`.

| Purpose | Android (adb) | iOS Simulator (`xcrun simctl`) |
|---|---|---|
| list | `adb devices -l` | `xcrun simctl list devices booted -j` |
| open a screen | `adb shell am start -a android.intent.action.VIEW -d <scheme>://<route> -p <package>` | `xcrun simctl launch booted <bundleId>`, `xcrun simctl openurl booted <scheme>://<route>` |
| navigate | `adb shell input tap <x> <y>` / `swipe` / `text` / `keyevent BACK`; `adb exec-out uiautomator dump /dev/tty` to find tap targets | deep links only |
| light/dark | `adb shell cmd uimode night yes` / `no` | `xcrun simctl ui booted appearance dark` / `light` |
| tidy status bar | `adb shell settings put global sysui_demo_allowed 1` + the demo-mode broadcast | `xcrun simctl status_bar booted override --time 9:41 --batteryLevel 100` |

**Screenshots.** Save under `<OS temp>/nativecn-qa/<device>/<timestamp>-<screen>.png` and keep the last 20 per device.

Android: save → pull → delete. All three steps, every time; the delete is mandatory.

```
adb shell screencap -p /sdcard/nativecn-qa.png
adb pull /sdcard/nativecn-qa.png <OS temp>/nativecn-qa/<device>/<timestamp>-<screen>.png
adb shell rm /sdcard/nativecn-qa.png
```

iOS (writes straight to the laptop):

```
xcrun simctl io booted screenshot <OS temp>/nativecn-qa/<device>/<timestamp>-<screen>.png
```

During Visual QA, never commit. Fix only small, visual-only problems within one Screen; report everything else and wait for the user. The `nativecn-visual-qa` Skill has the full lists.
<!-- nativecn:end -->
