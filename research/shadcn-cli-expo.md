# Can the stock shadcn CLI install nativecn items into an Expo app?

Resolves #12. Tested 2026-10-04 with `shadcn@4.21.1` (latest at the time) against a fresh `create-expo-app@latest` project (Expo SDK 57, RN 0.86, Expo Router, `src/` layout, `@/*` → `./src/*`).

## Answer

**Yes, with one hand-written `components.json` and two authoring rules.** `shadcn add @nativecn-cli/<item>` installs plain-StyleSheet items into an Expo app. It rewrites `@/registry/<style>/…` imports to the app's aliases and installs npm dependencies. With `registry:file` + `target`, it also places Blocks at an Expo Router path. Four things break:

1. **`shadcn init` is unusable.** It hard-fails with "No Tailwind CSS configuration found" (and links to NativeWind), so users must write `components.json` by hand. `add` without a `components.json` only offers to run `init`.
2. **`registry:page` is silently dropped on Expo.** Blocks must use `registry:file` with a `target`.
3. **Bare `registryDependencies` resolve to shadcn's own web registry.** Every dependency must be namespaced (`@nativecn-cli/text`) or a full URL.
4. **Dependency versions are not SDK-matched.** shadcn runs `npx expo install -- <pkgs>`, and the `--` passes the names straight to npm, so you get `^latest` instead of Expo's `~SDK` pin. This looks like an upstream bug.

## Working `components.json` (verified)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "css": "",
    "baseColor": "neutral"
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks",
    "utils": "@/lib/utils"
  },
  "registries": {
    "@nativecn-cli": "https://nativecn.dev/r/{name}.json"
  }
}
```

(The test used `http://localhost:4455/r/{name}.json` for the registry URL.)

What's actually required, from the schema (`rawConfigSchema`, `packages/registry/src/registry/schema.ts`) and from testing:

| Field | Required? | Notes |
|---|---|---|
| `style` | yes (schema) | Any string. Only used for shadcn's own `@shadcn` registry (`/styles/{style}/{name}.json`) and for the `{style}` placeholder in registry URLs. |
| `tailwind.css`, `tailwind.baseColor` | yes (schema) | Stubs work: `""` for both was accepted. Omitting `tailwind` gives "Invalid configuration found". Nothing writes to CSS while items keep `cssVars`/`css`/`tailwind` empty. Expo's template `src/global.css` was left untouched. |
| `tailwind.cssVariables` | no (defaults to `true`) | Leave it at `true`. If it's `false`, `transformCssVars` rewrites class strings using `baseColor`. That's harmless without `className`, but pointless. |
| `aliases.components`, `aliases.utils` | yes (schema) | |
| `aliases.ui`, `aliases.lib`, `aliases.hooks` | **set them in practice** | Without `aliases.lib`, a `registry:lib` file was **placed** at `src/lib/theme.ts` but **imported** as `@/components/lib/theme`, which is a broken import. Always set all five aliases. |
| `rsc` | no (defaults to `false`) | With `false`, `transformRsc` strips a leading `"use client"` (observed). That's harmless for RN. |
| `iconLibrary` | leave unset | `transformIcons` only acts on `<IconPlaceholder>` elements when `iconLibrary` is a known web library. Unset means a no-op. |
| `registries` | not needed once listed | Unknown `@namespace`s are looked up in `package.json` and then in `https://ui.shadcn.com/r/registries.json` (the shadcn registry directory), and persisted into `components.json` (`ensureRegistriesInConfig`, `packages/shadcn/src/utils/registries.ts`). `@nativecn-cli` isn't in the directory today, so users must add the line above until it is listed. |

## What was tested and what happened

Scratch setup, outside the repo: a tiny registry (`registry.json` + `shadcn build` → `public/r/*.json` served on `localhost:4455`) and a fresh Expo app.

Items:
- `theme` (`registry:lib`, `registry/default/lib/theme.ts`)
- `text` (`registry:ui`, imports `@/registry/default/lib/theme`)
- `button` (`registry:ui`, imports `@/registry/default/ui/text`, `@/registry/default/lib/theme`, dep `expo-haptics`)
- `tokens` (`registry:lib` at `registry/default/theme/tokens.ts`, outside `lib/`)
- `card` (imports `@/registry/default/theme/tokens`)
- `sign-in-01` (`registry:block` whose file targets `app/(auth)/sign-in.tsx`)
- `bare-dep` (`registryDependencies: ["text"]`)

| Step | Command | Result |
|---|---|---|
| Build | `npx shadcn@latest build` | OK, no Tailwind needed, `@/registry/...` imports kept verbatim in `content`. |
| Project detection | `npx shadcn info` | `framework: Expo (expo)`, `srcDirectory: Yes`, `importAlias: @`. Detection is "package.json has `expo` dependency" (`get-project-info.ts`). |
| Init | `npx shadcn init -y -b radix -p nova` | **Fails**: "Validating Tailwind CSS ✖ … No Tailwind CSS configuration found … Visit https://www.nativewind.dev/docs/getting-started/installation". |
| Add with no config | `npx shadcn add -y ../reg/public/r/text.json` | Interactive prompt "You need to create a components.json file … Proceed?", which leads to `init`, which fails. |
| Add component | `npx shadcn add -y @nativecn-cli/button` | **OK.** Created `src/lib/theme.ts`, `src/components/ui/text.tsx`, `src/components/ui/button.tsx` (transitive `@nativecn-cli/*` deps resolved). Imports rewritten: `@/registry/default/ui/text` → `@/components/ui/text`, `@/registry/default/lib/theme` → `@/lib/theme`. `expo-haptics` installed. |
| Non-standard dir | `add @nativecn-cli/card` (theme file at `registry/default/theme/tokens.ts`, `registry:lib`) | **OK.** File placed at `src/lib/tokens.ts` and the import fixed to `@/lib/tokens` by the second-pass `resolveImports` in `update-files.ts`. |
| Explicit placement | Same file as `registry:file` with `target: "@components/theme/tokens.ts"` | **OK.** `src/components/theme/tokens.ts`, import `@/components/theme/tokens`. Alias targets (`@ui/`, `@components/`, `@lib/`, `@hooks/`) work. |
| Block as `registry:page` | `add @nativecn-cli/sign-in-01` | **Silently skipped.** No file written, no warning. |
| Block as `registry:file` | Same with `"type": "registry:file", "target": "app/(auth)/sign-in.tsx"` | **OK.** Written to `src/app/(auth)/sign-in.tsx` (the `src/` prefix is added automatically for src-dir projects). Route-group parentheses pass `isSafeTarget`. Imports rewritten. |
| Bare dep | `add --dry-run @nativecn-cli/bare-dep` | **Fails**: "The item at https://ui.shadcn.com/r/styles/default/text.json was not found". With a name shadcn does have (e.g. `button`), it would silently install shadcn's **web** Tailwind component. |
| Updates | `add --diff src/components/theme/tokens.ts @nativecn-cli/tokens-file` | **OK.** Shows a unified diff. `-o/--overwrite` updates files. Matches ADR-0001's update story. |
| Types | `npx tsc --noEmit` | No errors in installed files (only the template's pre-existing `global.css`/CSS-module errors). |

### Why `registry:page` is dropped

`resolvePageTarget` (`packages/registry/src/utils/updaters/update-files.ts`) only knows `next-app`, `next-pages`, `react-router` and `laravel`. For any other framework, Expo included, it returns `""`, and `resolveFilePath` returns `""`, so the file is skipped with no message. `registry:file` takes the generic `target` branch (`~/` = project root, an alias prefix, or a path that gets `src/` prepended when `isSrcDir`).

### Why dependency versions aren't SDK-matched

shadcn does detect Expo (`getUpdateDependenciesPackageManager` returns `"expo"` when `package.json` has `expo`) and calls:

```ts
await execa("npx", ["expo", "install", "--", ...dependencies], { cwd })
```

Expo CLI forwards everything after `--` to the underlying package manager, so the packages bypass Expo's `bundledNativeModules.json` resolution. Reproduced directly:

- `npx expo install -- expo-haptics` → `"expo-haptics": "^57.0.3"` (npm latest)
- `npx expo install expo-haptics` → `"expo-haptics": "~57.0.3"` (SDK pin)

The two match on the newest SDK only by coincidence. On an older SDK the stock CLI would install a mismatched native module. Workarounds: pin versions in the item (`"expo-haptics@~57.0.3"`), which ties an item to one SDK; or tell users to run `npx expo install --fix` afterwards. nativecn-cli's own installer should call `expo install <pkgs>` without `--` (as ADR-0001 already plans). This is worth an upstream shadcn issue.

## Rules for nativecn items (so the stock CLI keeps working)

1. Use `registry:ui` / `registry:component` / `registry:lib` / `registry:hook` for source files. Imports under `@/registry/<style>/{ui,components,lib,hooks}/…` rewrite cleanly, and other subdirs still resolve via `resolveImports`. Use `registry:file` + an alias `target` (`@lib/theme/tokens.ts`) when exact placement matters.
2. Blocks: put the Screen file in as **`registry:file`** with `target: "app/<route>.tsx"` (for example `app/(auth)/sign-in.tsx`). Never use `registry:page`.
3. `registryDependencies`: always `@nativecn-cli/<name>` (or a full URL), never bare names.
4. Keep `tailwind`, `cssVars` and `css` empty (as ADR-0001 says). Don't use `IconPlaceholder`.
5. Avoid a leading `"use client"`. It gets stripped anyway.
6. Document a copy-paste `components.json` (above) for "use the shadcn CLI" users, plus `npx expo install --fix` after adding. Consider listing `@nativecn-cli` in shadcn's registry directory so the `registries` entry is auto-added.
7. The CI check ADR-0001 asks for can be exactly this flow: fresh `create-expo-app`, write the `components.json` above, run `shadcn add` for every item, then `tsc --noEmit`.

## Sources

- shadcn source at tag `shadcn@4.21.1` (https://github.com/shadcn-ui/ui/tree/shadcn%404.21.1):
  - `packages/registry/src/registry/schema.ts`: `rawConfigSchema`, `registryConfigItemSchema`, file-type union (`target` required for `registry:file`/`registry:page`)
  - `packages/registry/src/utils/updaters/update-files.ts`: `resolveFilePath`, `resolvePageTarget`, `resolveImports`
  - `packages/registry/src/utils/transformers/index.ts`, `transform-import.ts`, `transform-rsc.ts`, `transform-icons.ts`
  - `packages/registry/src/utils/updaters/update-dependencies.ts`: `getUpdateDependenciesPackageManager`, `installWithExpo`
  - `packages/registry/src/utils/get-project-info.ts`: Expo detection
  - `packages/registry/src/utils/is-safe-target.ts`
  - `packages/shadcn/src/preflights/preflight-add.ts`, `packages/shadcn/src/utils/registries.ts` (`ensureRegistriesInConfig`), `packages/registry/src/registry/constants.ts` (`BUILTIN_REGISTRIES`)
- shadcn docs: https://ui.shadcn.com/docs/components-json, https://ui.shadcn.com/docs/registry/registry-item-json (target, `~/`, alias targets), https://ui.shadcn.com/docs/registry/namespace, https://ui.shadcn.com/docs/directory
- Expo CLI `install` (args after `--` go to the package manager): https://docs.expo.dev/more/expo-cli/#install
- Empirical runs: `shadcn@4.21.1`, `create-expo-app@latest` (SDK 57), Node 24, npm 11.
