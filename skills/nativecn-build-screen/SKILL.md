---
name: nativecn-build-screen
description: Build Screens in a nativecn Expo app from Blocks and Components. Use when the user asks to build, add or design a screen or flow, such as "build a login screen", "add a sign-up flow", "make a settings screen", "profile screen", "add a drawer", "add bottom tabs", or "wire up navigation" in a project with a nativecn components.json.
---

# Build a Screen with nativecn

A **Block** is a pre-designed composition (a Screen such as sign-in, or a drawer's contents) that you install, rename and adapt. Start from a Block when one fits; otherwise compose Components. Never hand-write what the Registry already has.

## 1. Read the project

Call the MCP tool `get_project_config` (or read `components.json`) for:
- `structure`: `flat` or `feature`;
- `aliases` and `routes` (usually `src/app`);
- the Preset, which is fixed. Don't change it.

## 2. Pick a Block

1. Call `list_block_variants` with the purpose (e.g. "sign in"). Each Block Variant is a different design, not a theme.
2. Match the user's request to the differences it lists. If more than one fits, show the user the options in one line each and let them choose.
3. 0.1 Blocks, for orientation (always confirm with `list_block_variants`):
   - `sign-in-01` classic centred · `sign-in-02` social-first hero · `sign-in-03` email first, two steps.
   - `sign-up-01` classic single form · `sign-up-02` step-by-step wizard · `sign-up-03` social-first with a verify code.
   - Pairs: sign-in-01 + sign-up-01, sign-in-02 + sign-up-03, sign-in-03 + sign-up-02.
   - `drawer-01` profile header with grouped sections · `drawer-02` SaaS workspace · `drawer-03` cover header.
4. No Block fits → compose Components (step 5).

## 3. Add it

Get the exact command from `get_add_command`, or write it yourself:

```sh
npx nativecn-cli@latest add sign-in-02 --route "(auth)/sign-in"                  # flat
npx nativecn-cli@latest add sign-in-02 --route "(auth)/sign-in" --feature auth   # feature mode
```

- **Always pass `--route`** for a Screen Block, and **`--feature`** too in feature mode. The CLI never overwrites an existing route file; if it skips one, it prints the 3-line route file for you to place.
- `--dry-run` shows the files and packages without writing.
- `-y` alone **never** overwrites a file. Use `-o` only when the user explicitly wants their edits replaced.
- Before updating an item that is already installed, run `add <item> --diff` and show the user what would change.
- Read the summary. If it says a native rebuild is needed, tell the user (a reload is not enough).

Where things land:
- Screen Blocks: `src/screens/<block>/`, or `src/features/<feature>/screens/<block>/` in feature mode, rendered by a route file in `src/app/`.
- Drawer Blocks: `src/components/drawer-0X/`.
- Components and Primitives: always global (`src/components/`, `src/components/primitives/`, `src/hooks/`, `src/utils/`).

## 4. Adapt the Block

The Block is the user's code now. Rename it to what it is in the app (e.g. `sign-in-02` → `sign-in`) if the user wants, and update its imports.

- **Form Blocks never talk to a server.** Wire the route's `onSubmit(values)` to the user's backend. Throw on failure: server errors and success messages are shown **only** via `toast()`. Validation errors already appear under each field.
- Social buttons only call `onSocialSignIn(provider)`. Connect that to the user's auth.
- Store sessions and tokens in `expo-secure-store`, never AsyncStorage.
- Replace placeholder logos, names and avatars with the user's.
- Keep the forms on react-hook-form + zod through `FormField`, with fields inside `FocusChain`.

## 5. Compose new Screens from Components

1. Find Components with `search_items` (e.g. "dark mode toggle" → SchemeSwitcher) or `list_items`.
2. Before using one, call `view_items` for its props and Variants and `get_item_examples` for usage. Don't guess props.
3. Add missing Components with `get_add_command` / `nativecn-cli add <name>`.
4. Build the Screen:
   - wrap the content in `Container` (safe area, scroll, keyboard, padding);
   - all text through `Text` with the right Variant (`h1`–`h4`, `body`, `label`, …); all glyphs through `Icon` with a Lucide component;
   - styles via `createStyles((t) => ({ … }))` using Tokens only; `scale(n)` only for genuine one-offs;
   - feedback through `toast()` and the Alert Component, never `Alert.alert`;
   - lists of rows with `ListSection` / `ListItem`, empty data with `EmptyState`, loading with `Skeleton` or `Spinner`.

## 6. Routes and Layouts

- A route file in `src/app/` only renders the Screen: it imports the Screen from `@/screens/…` (or `@/features/<feature>/screens/…`) and default-exports a small component, as Expo Router requires.
- Group routes with Expo Router groups, e.g. `src/app/(auth)/sign-in.tsx` with its own `_layout.tsx`.
- **Bottom bar:** an Expo Router JavaScript `Tabs` Layout whose `tabBar` renders `TabNavigation`. Set icons and badges with `Tabs.Screen` options (`tabBarIcon`, `tabBarBadge`).
- **In-screen tabs:** `SegmentedTabs`. Never use it as the bottom bar, and never confuse either with Expo Router's `Tabs`.
- **Drawer:** a Layout using `Drawer` from `expo-router/drawer`, with a Drawer Block (or `DrawerContent` and its parts) as `drawerContent`. Never install `@react-navigation/*` or the npm package `expo-drawer`.
- Stack headers and links come from Expo Router itself.
- Keep `ThemeProvider`, `KeyboardProvider` and `<Toaster />` in the root Layout.

## 7. Placement rule (ADR 0008)

- Follow `structure` from `components.json`.
- Reuse what already exists globally first.
- Something used by one Feature lives in that Feature (`src/features/<feature>/{components,hooks,screens,utils}`).
- The moment a second Feature needs it, move it to the global folder and update the imports. This applies to components, hooks, utils and screens alike.
- In `flat` mode, use Expo's folders: `src/components/`, `src/hooks/`, `src/utils/`, `src/screens/`.

## 8. Finish

1. Run `get_audit_checklist` and fix everything it flags.
2. Type-check.
3. Offer the `nativecn-visual-qa` Skill to check the Screen on a device.

New packages: SDK-pinned ones via `npx expo install`; anything else, ask the user first.
