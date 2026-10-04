---
name: nativecn-theme
description: Change the look of a nativecn Expo app through its Theme. Use when the user asks to "change colours", "change the primary colour", "add a brand colour", "dark mode", "light mode", "add a theme switcher", "use a different font", "change spacing or radius", or to replace or migrate Expo's default theme files (constants/theme.ts, themed-text, themed-view, use-theme) in a project with a nativecn components.json.
license: MIT
---

# Theme a nativecn app

The **Theme** is the single source of truth for every Token. Change the look there, never by hard-coding values in Screens or Components.

## The Theme files

All in `src/theme/` (or `theme/` in apps without `src/`):

| File | Holds | Edit? |
|---|---|---|
| `colors.ts` | Colour Roles, light and dark | yes |
| `tokens.ts` | spacing, radius, type ramp, elevation, motion, control heights, opacity, fonts | yes |
| `config.ts` | `fontScaling` (off), `defaultScheme` (`'system'`), Scale baseline and clamp, `haptics` | yes, with care |
| `scale.ts`, `provider.tsx`, `navigation.ts`, `index.ts` | the runtime: Scale, `ThemeProvider`, `useTheme`, `createStyles`, navigation theme | only to fix a bug |

Read the files before editing; the Token and Colour Role names you need are there.

## The Preset is fixed, hand edits are allowed

- The Preset (Style, Base Colour, Accent Colour, Radius, Body Font, Heading Font) was chosen at create/Init and is fixed.
- **Never** edit `preset` in `components.json`, never try to switch Style, and never re-add items with `-o` to get another Style. There is no `apply` command.
- Hand-editing the Theme files and the copied Component files **is** allowed. That is how the user changes the look after setup.

## Colours

- Change a Colour Role's value in `colors.ts`, for **both** light and dark. The two objects must keep identical keys.
- The Accent Colour lives in `primary` and `ring` (and their `…Foreground` pairs).
- **Add a role** (e.g. `brand`) by adding `brand` and `brandForeground` to both light and dark. Types are inferred from the file, so `t.colors.brand`-style access type-checks at once.
- Keep every role and its `…Foreground` pair at WCAG AA (4.5:1) contrast in both Schemes. Check the numbers before you finish and tell the user if their colour fails.
- Never put colours anywhere but `colors.ts`. Screens and Components read Colour Roles through `createStyles`.

## Spacing, radius, type

- Edit the scales in `tokens.ts`. Values are base values: the Theme applies the Scale, so don't pre-scale them.
- A change here affects the whole app. Say so before making it.
- For a genuine one-off size in a Screen, use `scale(n)`; don't add a Token for one use.

## Fonts

- Fonts are static `.ttf` faces in `assets/fonts/`, registered by the `expo-font` Config Plugin in `app.json`, and named in `tokens.ts`. Text Variants `display` and `h1`–`h4` use the Heading Font; the rest use the Body Font.
- To change a font: put its four faces in `assets/fonts/`, update the `expo-font` plugin entry and the font names in `tokens.ts`, then **rebuild the native app** (a reload is not enough).
- The eight nativecn fonts (Inter, Geist, DM Sans, Figtree, Lora, Source Serif 4, Geist Mono, JetBrains Mono) are hosted at nativecn.dev `/fonts/<font>/` with their licences. For any other font, the user supplies the files; check its licence allows bundling.
- Never install `@expo-google-fonts/*`.

## Scheme (light / dark)

- `ThemeProvider` takes `scheme: 'system' | 'light' | 'dark'`, defaulting to `defaultScheme` in `config.ts`.
- `useTheme()` returns the scaled Tokens plus `scheme`, `scale` and `setScheme()`. `setScheme` also sets the native appearance, and the choice is persisted (zustand + AsyncStorage under `nativecn-theme`).
- **For a user-facing switch**, add the SchemeSwitcher Component (`npx nativecn-cli@latest add scheme-switcher`): `variant="segmented"` (System · Light · Dark) or `variant="icon"`.
- Never style from React Native's `useColorScheme()` directly; read the Theme. Only the Scheme is persisted; never store anything sensitive alongside it.
- The status bar and Expo Router's navigation theme follow the Scheme through `useNavigationTheme()`.
- Test every change in both Schemes.

## Using the Theme in code

```tsx
import { createStyles } from '@/theme';

const useStyles = createStyles((t) => ({
  // Tokens and Colour Roles only; read the names from src/theme/
}));

export function ProfileHeader() {
  const styles = useStyles();
  // …
}
```

`createStyles` returns a hook; styles are built once per Scale and Scheme and cached. No inline literals, no Tailwind, no `className`.

## Font scaling

`fontScaling` in `config.ts` is off by default (ADR 0004). Turning it on makes text follow the OS font size (capped at 1.5× for `button`, `label` and `caption`). It is a whole-app accessibility decision: explain the trade-off and let the user decide.

## Migrating Expo's default theme files

Init leaves Expo's template theming in place and lists the overlapping files. Migrate only when the user asks:

| Expo file | Replace with |
|---|---|
| `src/constants/theme.ts`: `Colors` | Colour Roles (`text` → `foreground`, `background` → `background`, `textSecondary` → the muted foreground role; pick the nearest role for the others) |
| `src/constants/theme.ts`: `Spacing`, `Fonts` | the nearest spacing Tokens; the Theme's fonts |
| `src/constants/theme.ts`: `MaxContentWidth`, `BottomTabInset` | `Container` (it caps content width) and the tab Layout; they aren't Tokens |
| `src/hooks/use-theme.ts` | nativecn's `useTheme()` from `@/theme` (same name, different return value) |
| `src/hooks/use-color-scheme(.web).ts` | `useTheme().scheme` |
| `src/components/themed-text.tsx` (`ThemedText`) | `Text` with the matching Variant (`title` → a heading Variant, `default` → `body`, `small` → `small`, `link` → `Button variant="link"` or Text in a Link) |
| `src/components/themed-view.tsx` (`ThemedView`) | `Container` for a Screen, or a `View` styled with `createStyles` |
| root Layout using `DarkTheme` / `DefaultTheme` | `useNavigationTheme()` |

Steps:
1. Find every importer of each file (`grep` for the import paths).
2. Migrate them one at a time, keeping the look as close as the Tokens allow, and type-check after each file.
3. When nothing imports an Expo theme file any more, ask the user before deleting it (and the `global.css` import if it was only for theming).

## After changes

Run `get_audit_checklist`, fix what it flags, and offer the `nativecn-visual-qa` Skill to check both Schemes on a device.
