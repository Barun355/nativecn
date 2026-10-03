# What create-expo-app does on SDK 57

Research for [#15](https://github.com/Barun355/nativecn/issues/15). The question: what does `create-expo-app` do, step by step, on SDK 57, so that `nativecn-cli create` can create a Starter the same way and swap in nativecn's Components and Theme?

Researched 2026-10-04.

## Answer in brief

- **`create-expo-app` is now just a shim.** `create-expo-app@5.0.0` is one line, `module.exports = require('create-expo')`. All the logic lives in [`create-expo`](https://github.com/expo/expo/tree/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo) (latest and `sdk-57` = 5.0.3) in the expo/expo monorepo.
- **Steps, in order:**
  1. Parse flags.
  2. Resolve and validate the project directory.
  3. Pin the template to `expo-template-default@sdk-57`.
  4. Fetch it with `npm pack` into an OS temp cache.
  5. Untar it, renaming paths as it goes.
  6. Find-and-replace `HelloWorld` in `app.json` and native files.
  7. Sanitise `app.json` and `package.json`.
  8. Configure the package manager.
  9. Install dependencies (and pods, if there is an `ios/` folder).
  10. Write `AGENTS.md` and, if present, `.claude/settings.json`.
  11. `git init`, then `git add -A`, then `git commit`.
- **The SDK 57 default template keeps its code in `src/`.** The theming lives in:
  - `src/constants/theme.ts`
  - `src/hooks/use-theme.ts`
  - `src/hooks/use-color-scheme{,.web}.ts`
  - `src/components/themed-{text,view}.tsx`
  - `src/global.css`

  Nine further files consume these, and some of them hard-code colours.

## Sources

All source links are pinned to `gitHead` `ad1efa3fa5802156660198ba5d787f91014d8df3`, the commit that `create-expo@5.0.3` was published from (taken from the npm tarball's `package.json`). `SRC` below stands for `https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src`.

| Source | What it gives |
|---|---|
| `npm view create-expo-app` / tarball `create-expo-app@5.0.0` | The shim (`index.js`, depends on `create-expo >=5.0.1`, repo `expo/create-expo-app-legacy`) |
| `npm view create-expo dist-tags` | `latest` and `sdk-57` = `5.0.3`; `sdk-56` = `4.0.4`; `sdk-55` = `3.6.18` |
| `npm view expo dist-tags` | `latest` and `sdk-57` = `57.0.26`; `next` = `58.0.3` |
| `npm view expo-template-default dist-tags` | `latest` and `sdk-57` = `57.0.28` |
| [`SRC/cli.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/cli.ts) | Flags |
| [`SRC/createAsync.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/createAsync.ts) | The orchestration (order of steps) |
| [`SRC/promptSdkVersion.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/promptSdkVersion.ts) | SDK pinning |
| [`SRC/Template.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/Template.ts) | Template resolution, renaming, sanitising |
| [`SRC/utils/npm.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/utils/npm.ts), [`SRC/utils/tar.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/utils/tar.ts), [`SRC/createFileTransform.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/createFileTransform.ts) | Download, extract, path renames |
| [`SRC/resolvePackageManager.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/resolvePackageManager.ts) | Package-manager detection and install |
| [`SRC/resolveProjectRoot.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/resolveProjectRoot.ts) | Name prompt and validation |
| [`SRC/generateAgentFiles.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/generateAgentFiles.ts) | `AGENTS.md`, `.claude/settings.json` |
| [`SRC/utils/git.ts`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/src/utils/git.ts) | git init and commit |
| [`create-expo/CHANGELOG.md`](https://github.com/expo/expo/blob/ad1efa3fa5802156660198ba5d787f91014d8df3/packages/create-expo/CHANGELOG.md) | 5.0.3 stopped writing `CLAUDE.md` |
| Tarball `expo-template-default@57.0.28` (source: [`templates/expo-template-default`](https://github.com/expo/expo/tree/ad1efa3fa5802156660198ba5d787f91014d8df3/templates/expo-template-default)) | Every file in the template |
| [docs.expo.dev/more/create-expo](https://docs.expo.dev/more/create-expo/) (modified 2026-09-24) | Documented flags: `--yes`, `--no-install`, `--no-agents-md`, `--template`, `--example`, `--version`, `--help`; npm, Yarn 1, Yarn 2+, pnpm and Bun support |
| Observed run | `EXPO_NO_TELEMETRY=1 npx -y create-expo-app@latest my-app --yes --no-install` in a scratch directory outside any git repo |

## Step by step

### 0. Entry point

- `npx create-expo-app` runs the shim, which requires `create-expo`. Its `bin/create-expo.js` then requires `build/index.js`, an ncc bundle of `src/`.
- There is no business logic in `create-expo-app` itself.
- `yarn create expo`, `pnpm create expo` and `bun create expo` reach the same code (cli.ts help text).

### 1. Flags (`cli.ts`)

| Flag | Effect |
|---|---|
| `-y, --yes` | Use defaults. With no path argument it creates the app **in the current directory** (which must be empty and have a valid name). Also makes SDK pinning non-interactive. |
| `--no-install` | Skip installing JS deps and CocoaPods. Prints a "make sure you have modules installed" warning instead. Package-manager configuration still runs. |
| `--no-agents-md` | Skip writing `AGENTS.md` and `.claude/settings.json`. |
| `-t, --template [pkg]` | Template to use. With a bare `--template`, prompts from five templates: default, blank, blank-typescript, tabs, bare-minimum (`legacyTemplates.ts`). |
| `-e, --example [name]` | Use an example from github.com/expo/examples instead. A bare `--example` prompts. Cannot be combined with `--template`. |
| `-v, --version`, `-h, --help` | Print the version or the help text. |

- Parsing is `arg` with `permissive: true`. `--template` and `--example` accept either a string or a bare boolean.
- The first positional argument is the project path.
- Telemetry is sent unless `EXPO_NO_TELEMETRY` is set.
- Other env vars it reads:
  - `CI`: non-interactive.
  - `EXPO_BETA`: uses the `@beta` tag.
  - `EXPO_NO_CACHE`: bypasses the template cache.
  - `EXPO_DEBUG`: verbose output.

### 2. Project root (`resolveProjectRoot.ts`, `createAsync.ts`)

- If no path is given, it prompts "What is your app named?" with default `my-app`. With `--yes` and no path, it uses the current directory instead.
- The folder name must match `/^[a-z0-9@.\-_]+$/i`.
- It must not be one of `react-native`, `react`, `react-dom`, `react-native-web`, `expo` or `expo-router`.
- The directory is created with `mkdir -p` and must have no conflicting files. If it has any, it exits with "has files that might be overwritten".
- **The app name is always `path.basename(projectRoot)`.** Nothing else is used as the name.

### 3. Template resolution and SDK pinning (`promptSdkVersion.ts`, `Template.ts`, `utils/npm.ts`)

1. The template defaults to `expo-template-default`. `applySdkVersionToTemplateAsync` then decides which SDK tag to use:
   - If the template already has a tag, or is not one of Expo's five templates, it is used as-is.
   - When run non-interactively (`--yes`, `CI`, or no TTY) with the default template, it fetches `https://api.expo.dev/v2/versions`. It then pins to the highest released, non-deprecated SDK: **`expo-template-default@sdk-57`** today (observed output: "Creating my-app using the expo-template-default@sdk-57 template.").
   - When run interactively, it asks "Select an Expo SDK version:" with three choices:
     - "Latest (SDK N)"
     - "For learning with Expo Go (SDK M)", shown only when this differs from Latest
     - "Other SDK version…", which lists the four newest SDKs
   - If the versions endpoint is unreachable, it falls back to the npm `latest` dist-tag.
2. `resolvePackageModuleId` classifies the template string as one of three kinds:
   - **GitHub repo**: an `owner/repo` shorthand or a `github.com/...` URL. It is downloaded from `codeload.github.com/<owner>/<repo>/tar.gz/<branch>`.
   - **Local file**: a path starting `file:`, `.`, or `/`, for example a `.tgz`.
   - **npm package**: anything else.
3. For npm templates, `getResolvedTemplateName` expands short names: `blank` becomes `expo-template-blank`, and `default@57` becomes `expo-template-default@sdk-57`. Scoped packages are passed through unchanged.

### 4. Download: npm tarball via `npm pack` (`utils/npm.ts`)

1. The cache directory is `os.tmpdir()/.create-expo-app/template-cache`.
2. It runs `npm pack <name@tag> --dry-run --json` in that directory to learn the tarball filename. This always uses `npm`, whichever package manager the user has.
3. If `<filename>.tgz` is not already cached (or `EXPO_NO_CACHE` is set, or the template is a local file), it runs `npm pack <name@tag> --json` to download it. The cache never expires (there is a TODO about this in the source).
4. It handles both the npm < 12 (array) and npm 12 (object) shapes of `npm pack --json` (5.0.1 changelog).

### 5. Extract and rename paths (`utils/tar.ts`, `createFileTransform.ts`)

- The `.tgz` is streamed through gzip decompression and `multitars` untar into the project root.
- The leading `package/` path segment is stripped (`strip: 1`).
- Entries that would escape the project root, or symlinks pointing outside it, are skipped.
- Each path is renamed during extraction:
  - `HelloWorld` and `helloworld` in **paths** become the sanitised app name (letters and digits only; lower-cased under `android`).
  - A file named `gitignore` becomes `.gitignore`. npm strips dotfiles named `.gitignore` when publishing, so templates ship it without the dot.
  - The directories `_vscode`, `_eas`, `_github` and `_cursor` become `.vscode`, `.eas`, `.github` and `.cursor`.

### 6. Rename the app inside files (`Template.ts`, `renameTemplateAppNameAsync`)

The files matched by `defaultRenameConfig` are:

- `app.json`
- `android/**/*.gradle`, `android/app/BUCK`, `android/app/src/**/*.{java,kt,xml}`
- `ios/Podfile`, `ios/**/*.xcodeproj/project.pbxproj`, xcschemes, `contents.xcworkspacedata`
- the same set for `macos/`

`node_modules` is excluded. In each matched file it replaces:

- `Hello App Display Name` → the raw name (XML-escaped in `.xml` and `.plist` files)
- `HelloWorld` → the sanitised name
- `helloworld` → the sanitised, lower-cased name

For the default template, only `app.json` matches. Its `"scheme": "helloworld"` becomes `"myapp"`; the dash is dropped by sanitisation.

### 7. Sanitise `app.json` and `package.json` (`sanitizeTemplateAsync`)

- **`.gitignore`**: if the template has none, `create-expo/template/gitignore` is copied in. If it has one, the code checks whether it ignores `ios/` or `android/`.
- **`app.json`**: deep-merges `{ expo: { name: <folder>, slug: <folder> } }` into the existing file. Observed: `"name": "HelloWorld"` became `"my-app"`, and `"slug": "expo-template-default"` became `"my-app"`.
- **`package.json`**:
  - `name` is set to an npm-safe version of the app name.
  - `version` is set to `1.0.0` and `private` to `true`.
  - `description`, `tags` and `repository` are deleted.
  - `license` is deleted only if it is `0BSD`. The `LICENSE` *file* stays on disk.
  - `ios` and `android` scripts are added only if the template lacks them. The default template already has them (`expo start --ios` / `--android`).

### 8. Package manager (`resolvePackageManager.ts`)

- **Detection.** It reads `npm_config_user_agent` and checks the prefixes `yarn`, `pnpm`, `bun` and `npm`, in that order. If the variable is absent, it probes `yarn --version`, then `pnpm`, then `bun`, and falls back to `npm`. So `npx` gives npm, `pnpm create expo` gives pnpm, and so on.
- **Configuration.** This runs even with `--no-install`. Only Yarn 2+ is touched: it runs `yarn config set nodeLinker node-modules`.
- **Install.** `@expo/package-manager`'s `installAsync()` runs in the project root. Failures are logged and creation continues.
- **CocoaPods.** If `ios/` exists and the OS is macOS, pods are installed (and the CocoaPods CLI is installed first if missing). The default template has no `ios/`, so this is a no-op.

### 9. Agent files (`generateAgentFiles.ts`)

This step is skipped with `--no-agents-md`.

- **`AGENTS.md`** is copied if missing. The copy is bundled from `expo/llm-configs` at publish time. It tells agents to:
  - read the major `expo` version in `package.json`
  - fetch the versioned docs
  - use `npx expo install`
  - and so on.
- **`.claude/settings.json`**, enabling `expo@claude-plugins-official`, is written only if `~/.claude.json` or `~/.claude` exists.
- **`CLAUDE.md`** (`@AGENTS.md`) was written up to 5.0.2. 5.0.3 stopped writing it (CHANGELOG, #50400). Our observed run used a cached `create-expo@5.0.1` through `npx`, so it still produced one.

### 10. Git (`utils/git.ts`)

- If `git` is not on PATH, this step is silently skipped.
- **If the directory is already inside a git work tree:**
  - under `CI` it skips;
  - otherwise it asks "Skip initializing a new git repository?", defaulting to yes.
- **Otherwise it runs:**
  1. `git init`
  2. `git add -A`
  3. `git commit -m "Initial commit\n\nGenerated by create-expo <version>."`

  Any error is swallowed. Observed: a single commit containing every file.

### 11. Post-steps (output)

- It prints "✅ Your project is ready!", then `cd <path>`, then the `<pm> run android`, `<pm> run ios` and `<pm> run web` commands (with a note about iOS on non-macOS).
- With `--no-install` it also prints the install reminder.
- Finally, it runs an update check for `create-expo`.

Nothing else happens: no `expo prebuild`, no `expo install --fix`, no typecheck. The template's own `reset-project` script is left for the user to run.

## The SDK 57 default template (`expo-template-default@57.0.28`)

### Every file

The list below shows the project after creation. Paths shown as `_vscode` and `gitignore` in the tarball are renamed on extraction (step 5). `AGENTS.md` and `.claude/` come from step 9.

```
.claude/settings.json            (create-expo, conditional)
.gitignore                       (template `gitignore`)
.vscode/extensions.json          (template `_vscode/`)
.vscode/settings.json
AGENTS.md                        (create-expo)
LICENSE                          (0BSD; file kept, package.json field removed)
README.md
app.json
package.json
tsconfig.json                    (extends expo/tsconfig.base; strict; paths @/* -> ./src/*, @/assets/* -> ./assets/*)
scripts/reset-project.js         (moves src/ and scripts/ to example/, writes blank src/app/{index,_layout}.tsx)
assets/expo.icon/icon.json       (iOS Icon Composer icon, used by app.json ios.icon)
assets/expo.icon/Assets/expo-symbol 2.svg
assets/expo.icon/Assets/grid.png
assets/images/android-icon-{background,foreground,monochrome}.png
assets/images/expo-badge.png, expo-badge-white.png, expo-logo.png, logo-glow.png
assets/images/favicon.png, icon.png, splash-icon.png, tutorial-web.png
assets/images/react-logo.png (+ @2x, @3x)
assets/images/tabIcons/{home,explore}.png (+ @2x, @3x)
src/app/_layout.tsx              root layout: ThemeProvider(DarkTheme|DefaultTheme from expo-router) + AnimatedSplashOverlay + AppTabs
src/app/index.tsx                Home screen
src/app/explore.tsx              Explore screen
src/components/animated-icon.tsx (+ .web.tsx, .module.css)   splash overlay / animated logo
src/components/app-tabs.tsx      NativeTabs (expo-router/unstable-native-tabs), coloured from Colors
src/components/app-tabs.web.tsx  web tab bar, uses ThemedText/ThemedView/Colors
src/components/external-link.tsx
src/components/hint-row.tsx
src/components/web-badge.tsx
src/components/ui/collapsible.tsx
src/components/themed-text.tsx
src/components/themed-view.tsx
src/constants/theme.ts
src/global.css
src/hooks/use-color-scheme.ts
src/hooks/use-color-scheme.web.ts
src/hooks/use-theme.ts
```

### `package.json` and `app.json`

- **`package.json`**:
  - `main`: `expo-router/entry`
  - Scripts: `start`, `reset-project`, `android`, `ios`, `web`, `lint`
  - Main dependencies: `expo ~57.0.26`, `react-native 0.86.3`, `react 19.2.3`, `expo-router ~57.0.24`, `react-native-reanimated 4.5.1`, `react-native-worklets 0.10.1`, `react-native-screens ~4.26.0`, `react-native-safe-area-context ~5.7.0`, `react-native-gesture-handler ~2.32.0`, `@expo/ui ~57.0.21`
  - Other `expo-*` dependencies: `constants`, `device`, `font`, `glass-effect`, `image`, `linking`, `splash-screen`, `status-bar`, `symbols`, `system-ui`, `web-browser`
  - Web: `react-dom`, `react-native-web`
  - Dev dependencies: `typescript ~6.0.3`, `@types/react ~19.2.2`
- **`app.json`**:
  - `userInterfaceStyle: automatic`
  - `scheme: helloworld`, renamed during creation
  - `ios.icon: ./assets/expo.icon`
  - Android adaptive icon with background `#E6F4FE`
  - `predictiveBackGestureEnabled: false`
  - `web.output: static`
  - Plugins: `expo-router`, and `expo-splash-screen` with background `#208AEF` and `imageWidth` 76
  - `experiments.typedRoutes` and `experiments.reactCompiler` both `true`

### Theming files: what they are and what nativecn replaces

| File | What it is | nativecn action |
|---|---|---|
| `src/constants/theme.ts` | Exports four things: **`Colors`** (`light` and `dark`, each with `text`, `background`, `backgroundElement`, `backgroundSelected`, `textSecondary`); the **`ThemeColor`** type; **`Fonts`** (via `Platform.select`: iOS system designs `system-ui` / `ui-serif` / `ui-rounded` / `ui-monospace`, CSS variables on web); and **`Spacing`** (`half 2`, `one 4`, `two 8`, `three 16`, `four 24`, `five 32`, `six 64`). It also exports the layout constants `BottomTabInset` and `MaxContentWidth = 800`, and imports `@/global.css`. | **Replace** with the nativecn Theme (the TS token theme from ADR 0001). Either keep the same path and export names so template code still compiles, or rewrite every consumer. `BottomTabInset` and `MaxContentWidth` are layout constants, not tokens, and need a home of their own. |
| `src/hooks/use-theme.ts` | `useTheme()` returns `Colors[scheme]`, treating `'unspecified'` as light. | **Replace** with nativecn's theme hook. |
| `src/hooks/use-color-scheme.ts` | Re-exports `useColorScheme` from `react-native`. | Replace, or keep, depending on how nativecn's Theme resolves the colour scheme. |
| `src/hooks/use-color-scheme.web.ts` | Returns `'light'` until hydrated, to support static web rendering. | Same as above. Web is not a nativecn target (iOS and Android first), but `web.output: static` is in the template. |
| `src/components/themed-text.tsx` | `ThemedText`, with `type` set to one of `default`, `title`, `small`, `smallBold`, `subtitle`, `link`, `linkPrimary` or `code`, plus a `themeColor` prop. It hard-codes `#3c87f7` for `linkPrimary`. | **Replace** with the nativecn Text Component. |
| `src/components/themed-view.tsx` | `ThemedView`, with `type?: ThemeColor` and `lightColor`/`darkColor` props. Those two props are declared but unused. | **Replace** with nativecn's surface or View Component. |
| `src/global.css` | Web-only CSS variables for the font stacks. | Remove, or replace with nativecn's equivalent. |

These files consume the theming files and so have to be rewritten or removed with them:

| File | Theming it uses |
|---|---|
| `src/app/_layout.tsx` | `useColorScheme` from RN, plus expo-router's `ThemeProvider`, `DarkTheme` and `DefaultTheme` (React Navigation themes). nativecn should feed its own Theme into the navigation theme here. |
| `src/components/app-tabs.tsx` | `Colors[scheme]` for the `NativeTabs` background, indicator and label colours. |
| `src/components/app-tabs.web.tsx` | `Colors`, `Spacing`, `MaxContentWidth`, `ThemedText`, `ThemedView` |
| `src/app/index.tsx` | `ThemedText`, `ThemedView`, `BottomTabInset`, `MaxContentWidth`, `Spacing` |
| `src/app/explore.tsx` | `ThemedText`, `ThemedView`, `useTheme`, `BottomTabInset`, `MaxContentWidth`, `Spacing` |
| `src/components/ui/collapsible.tsx` | `ThemedText`, `ThemedView`, `Spacing`, `useTheme` |
| `src/components/hint-row.tsx` | `ThemedText`, `ThemedView`, `Spacing` |
| `src/components/web-badge.tsx` | `ThemedText`, `ThemedView`, `Spacing`, RN `useColorScheme` |
| `src/components/animated-icon.tsx` and `.module.css` | Hard-coded brand colours `#208AEF`, `#3C9FFE` and `#0274DF` |

Other Expo-branded colours and assets live in `app.json`:

- the splash `backgroundColor` `#208AEF`
- the Android adaptive-icon background `#E6F4FE`
- the Expo/React logos and icons under `assets/`

The Starter may want to rebrand these. That is a product choice, not a theming requirement.

## Implications for `nativecn-cli create`

These follow from the facts above; the decisions themselves belong to the downstream tickets.

1. **The cheapest faithful mirror is to delegate.**
   - **Route A: delegate.** Run `create-expo` with `--template <nativecn Starter>`, then overlay the nativecn files. This gets naming, sanitising, package-manager detection, agent files and git for free.
   - **Route B: re-implement.** Copy steps 2–10 above into nativecn-cli.
   - `--template` already accepts an npm package, a GitHub `owner/repo`, or a local `.tgz`. So the Starter can itself be published as a template (Route A), and `create-expo` handles the rest.
2. **Pass an explicit SDK tag.** Expo's SDK auto-pinning only applies to its own five templates. A custom template gets whatever its npm `latest` tag points to. If the Starter is a template, nativecn-cli should pass an explicit version (e.g. `@sdk-57`).
3. **If nativecn post-processes Expo's default template instead (Route A without its own template):**
   - It must run *before* the git commit, or amend that commit. Otherwise the user's first commit contains Expo's theme files.
   - `create-expo` has no post-extract hook and no `--no-git` flag. Git init is skipped only when git is missing, or when the directory is already inside a work tree and the user agrees (or `CI` is set). So nativecn-cli would have to amend the initial commit, or add a second commit of its own.
4. **Follow the template's own naming rules.**
   - Use the `HelloWorld` / `helloworld` / `Hello App Display Name` placeholders.
   - Ship `gitignore` without the dot.
   - Ship `_vscode` instead of `.vscode`.

   `create-expo` only renames files that follow these conventions.
5. **Keep the theming surface tidy.** The theming surface is small and well bounded: three hooks, two themed components, one constants file and one CSS file. If nativecn keeps the paths `@/constants/theme`, `@/hooks/use-theme` and `@/components/themed-*` as thin compatibility re-exports, Expo docs and snippets that assume the default template keep working. The alternative is a clean break, which means rewriting the nine consumers.
6. **Keep `src/` and the `@/*` aliases.** SDK 57 puts everything under `src/` with `@/*` path aliases. Any Registry Item install path (Screens, Components) must target `src/app` and `src/components`, not the old root `app/` (note: the template README still says "edit the files inside the **app** directory"; that text is stale).
