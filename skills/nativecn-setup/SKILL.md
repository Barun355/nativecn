---
name: nativecn-setup
description: Set up nativecn in an Expo app. Use when the user wants to start a new app with nativecn, add nativecn to an existing Expo app, pick a Preset (Style, colours, radius, fonts), or configure agents for nativecn. Triggers include "start a new app", "create an Expo app with nativecn", "add nativecn", "set up nativecn", "init nativecn", "use Nova with violet", "Lora headings", and any project where nativecn Skills are installed but there is no components.json or no AGENTS.md yet.
---

# nativecn setup

nativecn is shadcn for Expo apps: Registry Items are copied into the user's app, which owns them. Everything is done through **nativecn-cli** (`npx nativecn-cli@latest …`) and the **nativecn MCP server**. Follow these steps in order.

## 1. Check what exists

1. Look for `components.json` at the project root.
   - Missing, and the folder has no app (or the user wants a new one) → **create** (step 3).
   - Missing, inside an existing Expo app → **Init** (step 4).
   - Present → nativecn is set up. If there is no nativecn section in `AGENTS.md`, run `npx nativecn-cli@latest agents` (step 6), then continue with the user's real task.
2. If you were installed as a **Plugin** (no `AGENTS.md` nativecn section, no `.agents/skills/nativecn-*`), apply the Rules below for the whole session, and on first use in a project run `init` or `agents` so the project gets its own `AGENTS.md`. If the CLI can't run, write `AGENTS.md` yourself with the Rules below, and a `CLAUDE.md` containing `@AGENTS.md` (append the line if `CLAUDE.md` exists).

## 2. Requirements (the CLI checks these first)

- **Expo SDK 57 or newer, with Expo Router.** Older SDKs and bare React Native are not supported.
- If the SDK is below 57, the CLI stops with: "nativecn supports Expo SDK 57 and newer; SDK <57 is not supported. Upgrade with `npx expo install expo@latest --fix`." Tell the user; upgrade only if they agree.

## 3. Create a new app

```sh
npx nativecn-cli@latest create <name> [items…] [flags]
```

- Builds the app from the nativecn **Starter** (one promo Screen inside a root Layout with `ThemeProvider`), applies the Preset, installs, writes `components.json` and the Agent Kit, then runs `git init` and makes one commit, `feat: initial commit`.
- Positional items are installed right away: `create my-app button card`.

## 4. Init in an existing Expo app

```sh
npx nativecn-cli@latest init [items…] [flags]
```

- Adds only new files. It **never rewrites existing files and never commits.**
- It prints two things you must act on:
  1. **The root Layout snippet** (`ThemeProvider`, `KeyboardProvider`, `<Toaster />`). See step 5.
  2. **Existing files that overlap** with the nativecn Theme (e.g. Expo's `constants/theme.ts`, `themed-text`). Don't delete them now. Offer to migrate them with the `nativecn-theme` Skill.
- Apps without `src/`: aliases point at root folders and `routes` becomes `app`. If there is no `@/*` path alias, Init offers to add it to `tsconfig.json`; accept with `--yes` once the user agrees.

## Flags (create and Init)

| Flag | Meaning |
|---|---|
| `-p, --preset <code>` | a Preset builder code (e.g. `a7Kx2Q`) |
| `--style --base --accent --radius --font --heading-font` | the Preset as long flags |
| `--folder-feat` | feature mode: `"structure": "feature"` in `components.json` |
| `--agents claude,codex,cursor,antigravity` | which agents get Rules, Skills and MCP config |
| `--qa-permissions` | opt-in auto-approve rules for the Visual QA commands (see below) |
| `-n, --name` | app name |
| `-y, --yes` | no prompts; defaults for anything not given |
| `-d, --defaults` | use the default Preset |
| `-f, --force` | force overwrite of existing configuration |
| `-c, --cwd <dir>` | working directory |
| `-s, --silent` | less output |

Without a terminal, the CLI behaves like `--yes` and prints every choice it made. Always pass explicit flags so nothing depends on prompts.

## Choosing the Preset

The Preset (Style, Base Colour, Accent Colour, Radius, Body Font, Heading Font) is chosen **once** and is fixed for the life of the project. Get it right now.

1. Call the MCP tool `list_preset_options` for the exact option values.
2. Translate the user's words into options. "Nova, violet, Lora headings" → Style `nova`, Accent Colour `violet`, Heading Font `lora`; everything else the default.
3. Call `build_preset_code` to get the code, and pass `--preset <code>`, or pass the long flags. Use the exact spellings `list_preset_options` returns.
4. **Never silently use the defaults.** If the user gave no preferences, say so and confirm the default (Vega · neutral · neutral · default radius · Inter) before running. If a request doesn't map to an option (e.g. a font that isn't offered), say which options are closest and ask.

What the options are, for talking to the user:
- **Style:** Vega (clean, balanced, the default) or Nova (compact). It decides every Component's shape and density.
- **Base Colour:** the greys (neutral, stone, zinc, mauve, olive, mist, taupe).
- **Accent Colour:** the colour of `primary` and `ring` (shadcn's 24 colours).
- **Radius:** default (the Style's own), none, small, medium or large.
- **Body Font / Heading Font:** Inter, Geist, DM Sans, Figtree, Lora, Source Serif 4, Geist Mono, JetBrains Mono. The Heading Font defaults to the Body Font.

Only the chosen fonts are downloaded into `assets/fonts/` and registered through the `expo-font` Config Plugin, so a development build needs a native rebuild afterwards.

## Structure

Ask whether the app will have several distinct Features (auth, billing, …). If so, pass `--folder-feat`; otherwise the Structure is `flat`. Never move existing files to change it.

## Choosing agents

Ask which agents the user works with and pass `--agents`. The CLI writes, per agent:
- **Rules:** `AGENTS.md` (or a nativecn section appended to it), plus `CLAUDE.md` with `@AGENTS.md`.
- **Skills:** `.agents/skills/<name>/`, with `.claude/skills/<name>` linked to it.
- **MCP config:** `.mcp.json`, `.cursor/mcp.json`, `.codex/config.toml` (Codex loads it only in a trusted project) or `.agents/mcp_config.json`.
- **Plugin:** it only prints the install command, because Plugins install per user.

If fetching the Skills fails (offline), the command still finishes; retry later with `npx nativecn-cli@latest agents`.

### `--qa-permissions`

Off by default. Pass it only when the user asks for fewer prompts during the Visual QA Loop. It writes **allow-only** rules for the Visual QA device commands (`.claude/settings.json`, `.codex/rules/*.rules`, `.cursor/permissions.json` and `.cursor/cli.json`; for Antigravity it prints a snippet to paste). Tell the user:
- The rules only skip the confirmation prompt for those commands. Everything else still asks, and nothing is blocked.
- For Cursor, the project file **replaces** their own IDE terminal allowlist in this project.

## 5. Apply the root Layout snippet

After Init (always when you ran it with `--yes`), edit the root Layout (`src/app/_layout.tsx`, or `app/_layout.tsx`) using the snippet Init printed:
- `ThemeProvider` wraps the whole app. `useTheme()` throws outside it.
- `KeyboardProvider` (from `react-native-keyboard-controller`) wraps the navigator.
- `<Toaster />` is rendered once, inside `ThemeProvider`, after the navigator.
- If the Layout already uses Expo Router's navigation `ThemeProvider` with `DarkTheme`/`DefaultTheme`, feed it `useNavigationTheme()` from the nativecn Theme instead, and import the two providers under different names.
- Keep everything else the user has in the Layout.

Then type-check, and tell the user if a native rebuild is needed.

## 6. Refreshing the Agent Kit

`npx nativecn-cli@latest agents [--agents <list>] [--update] [--qa-permissions]` writes or refreshes the Rules, Skills and MCP config. It shows a diff before replacing an `AGENTS.md` section the user has edited; show that diff to the user.

## The nativecn Rules

These apply to every change in a nativecn project. They are a copy of the `AGENTS.md` Rules, for Plugin users whose project doesn't have them yet.

1. **Styling:** Tokens only, via `createStyles`. No hard-coded colours or sizes; `scale(n)` for genuine one-offs. No Tailwind, NativeWind or `className`.
2. **Building blocks:** all text uses `Text`, all glyphs use `Icon` (a Lucide component passed in), and screens are wrapped in `Container`.
3. **Feedback:** never `Alert.alert` or any platform alert. Use nativecn's own `toast()` and Alert Components.
4. **Navigation:**
   - The drawer comes only from `expo-router/drawer`. Never install `@react-navigation/*` or the npm package `expo-drawer`.
   - `SegmentedTabs` is for in-screen tabs and `TabNavigation` for the bottom bar. Never confuse either with Expo Router's `Tabs`.
5. **Dependencies (ADR 0007):** use `npx expo install` for SDK-pinned packages. Anything else: **ask the user first**.
6. **Storage (ADR 0005):** AsyncStorage holds only non-sensitive preferences. Tokens, credentials and personal data go in `expo-secure-store`.
7. **Placement (ADR 0008):**
   - Follow `structure`.
   - Reuse global items first.
   - An item used by one Feature stays in that Feature.
   - Promote it to global the moment a second Feature needs it (components, hooks, utils, screens).
8. **The Preset is fixed.** Never change `components.json` `preset` or try to switch Style.
9. **Adding items:**
   - Use MCP `get_add_command` or `nativecn-cli add`.
   - Always pass `--route` for Screen Blocks, and `--feature` too in feature mode.
   - Run `--diff` before updating, and use `-o` only when the user asks for their edits to be replaced.
10. **Forms:** react-hook-form + zod, wired through `FormField`, with fields inside `FocusChain`.
11. **Accessibility:** meet the 9-point checklist. Never remove `role` or `aria-*`.
12. **After changes:** run `get_audit_checklist` and fix anything it flags.

## Related Skills

- `nativecn-build-screen`: building Screens from Blocks and Components.
- `nativecn-theme`: colours, fonts, dark mode, migrating Expo's theme files.
- `nativecn-component-authoring`: new Components and Variants.
- `nativecn-visual-qa`: checking the running app against the design.
