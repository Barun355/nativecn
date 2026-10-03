# Expo SDK 57 + pnpm monorepo setup

Resolves #22. Question: how do we configure Metro for an Expo SDK 57 app in a pnpm + Turborepo monorepo so the bundle has a single `react-native` copy, and `@/registry/*` resolves to `packages/ui` from the Showcase App?

## Answer

- **No `metro.config.js` is needed.** Use the stock Expo config. If we add one later for other reasons, it must be the plain `getDefaultConfig(__dirname)` with no `watchFolders`, `nodeModulesPaths`, `extraNodeModules` or `disableHierarchicalLookup`.
- **Keep pnpm's default isolated linker.** Don't set `nodeLinker: hoisted`, and don't add a `.npmrc` for linker settings, because pnpm 11 ignores them there.
- **Deduplication comes from Expo, not from pnpm.** Expo's *autolinking module resolution* turns on automatically when the app sits in a workspace. It makes `react`, `react-native` and the other "sticky" packages resolve to the app's copy, even when `packages/ui` resolves a different copy on disk.
- **Aliases go only in `apps/showcase/tsconfig.json`, as `paths` without `baseUrl`.** Use `"@/registry/*": ["../../packages/ui/*"]` and `"@/*": ["./src/*"]`. Expo's resolver matches the longest prefix first, so `@/registry/*` wins over `@/*` whatever order they are written in. The alias also applies to imports *inside* `packages/ui`, because the resolver uses the app's tsconfig for every file outside `node_modules`.
- **`packages/ui` lists `react` and `react-native` as `peerDependencies`.** It also pins them in `devDependencies` at exactly the app's versions, for typechecking. Use a pnpm catalog to keep the two in lockstep.

I checked all of this empirically against `expo@57.0.26` (React Native 0.86.3, React 19.2.3) with pnpm 11.20.0. See "Verification" below.

## Recommended files

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"

# One source of truth for versions shared by the app and packages/ui.
catalog:
  react: 19.2.3
  react-native: 0.86.3
  "@types/react": ~19.2.2
  typescript: ~6.0.3

# nodeLinker defaults to "isolated". Leave it. Do NOT set `nodeLinker: hoisted`.
```

- pnpm 11 reads node_modules-layout settings only from `pnpm-workspace.yaml`. `.npmrc` is read only for auth and registry settings. So an `.npmrc` with `node-linker=hoisted` (common in older Expo guides) would silently do nothing. [pnpm settings](https://pnpm.io/settings), [pnpm node-modules settings](https://pnpm.io/settings/node-modules) ("Default: isolated").
- pnpm 11 defaults already suit us: `autoInstallPeers: true`, `dedupePeerDependents: true`, `strictPeerDependencies: false`, `resolvePeersFromWorkspaceRoot: true`. [pnpm peer-dependency settings](https://pnpm.io/settings/peer-dependencies)
- Expo supports isolated installs from SDK 54. Only SDK 53 recommended turning them off. The hoisted linker is documented as a fallback "if isolated installations cause issues". [Expo: Work with monorepos](https://docs.expo.dev/guides/monorepos/)
- Catalogs: [pnpm catalogs](https://pnpm.io/catalogs). Dependencies reference them as `"react": "catalog:"`. The app's `react`/`react-native` versions are still chosen by `npx expo install --fix`, so after an SDK bump, update the catalog to whatever `expo install` picks.

### `apps/showcase/package.json` (relevant part)

```json
{
  "main": "index.ts",
  "dependencies": {
    "expo": "~57.0.26",
    "react": "catalog:",
    "react-native": "catalog:"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "typescript": "catalog:"
  }
}
```

The Showcase App does **not** need `"ui": "workspace:*"` as a dependency. It imports the source by path alias, not by package name. That suits ADR 0001 (`packages/ui` is never published, and its imports are `@/registry/...` paths that get rewritten on install). If Turborepo needs to know that showcase builds depend on ui, add `"ui": "workspace:*"` to `devDependencies`. It is harmless either way.

### `apps/showcase/metro.config.js`

None. If one becomes necessary (e.g. for SVG transformer, asset extensions):

```js
// apps/showcase/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
// Do NOT set watchFolders / resolver.nodeModulesPaths / extraNodeModules /
// disableHierarchicalLookup: Expo derives them from the workspace root since SDK 52.
module.exports = config;
```

Source: "Expo configures Metro automatically for monorepos. You don't have to manually configure Metro when using monorepos if you use `expo/metro-config`." The guide also says to delete those four properties from older configs. [Expo: Work with monorepos](https://docs.expo.dev/guides/monorepos/)

### `apps/showcase/tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/registry/*": ["../../packages/ui/*"],
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "../../packages/ui/**/*.ts", "../../packages/ui/**/*.tsx"]
}
```

- Expo CLI supports tsconfig `paths` out of the box (`experiments.tsconfigPaths`, default `true`). Restart Expo CLI after editing tsconfig. [Expo: TypeScript, path aliases](https://docs.expo.dev/guides/typescript/)
- **Omit `baseUrl`.** It is deprecated in TypeScript 6, which SDK 57's template ships (`typescript ~6.0.3`). Without it, `paths` resolve relative to the tsconfig file, and Expo's resolver does the same. The comment in `@expo/cli` `createTypescriptResolver.js` reads: "the `baseUrl` is optional and paths can be relative to the config path instead". It also notes baseUrl "is disabled [in TS 6] unless `ignoreDeprecations: "6.0"`". This was verified with `tsc --noEmit`, which passes.
- **Order doesn't matter:** `createTypescriptResolver.js` sorts wildcard prefixes with "Match longest prefix first". So `@/registry/button` never falls through to `src/registry/button`.
- **The alias applies inside `packages/ui` too.** The resolver skips only files whose path contains `/node_modules/`, and `packages/ui/*` is reached by real path, not through `node_modules`. So `packages/ui/components/button.tsx` can `import { cn } from '@/registry/lib/cn'`, which is the shadcn convention that ADR 0001 relies on. Verified.
- `include` covers `packages/ui` so the app's `tsc` typechecks the components with the same alias. `packages/ui` should also get its own `tsconfig.json` with `"paths": { "@/registry/*": ["./*"] }` so it can typecheck on its own (and in CI via Turborepo).

### `packages/ui/package.json`

```json
{
  "name": "ui",
  "private": true,
  "peerDependencies": {
    "react": "*",
    "react-native": "*"
  },
  "devDependencies": {
    "react": "catalog:",
    "react-native": "catalog:",
    "@types/react": "catalog:",
    "typescript": "catalog:"
  }
}
```

- `peerDependencies` document the contract: the host app supplies React and React Native. That is true for both the Showcase App and a user's app after `nativecn add`.
- `devDependencies` give `packages/ui` its own `node_modules/react{,-native}` for `tsc`, editor tooling and any unit tests. **Pin them to exactly the app's versions** (via the catalog). When they match, pnpm links `packages/ui/node_modules/react-native` to the *same* `.pnpm/react-native@…` directory as the app, which was verified. A skew (even in `@types/react`, which is part of react-native's peer-suffixed store path) creates a second physical copy on disk.
- Other runtime deps of components (e.g. `react-native-svg`, `lucide-react-native` for Icon) follow the same pattern: peer + catalog-pinned dev dep in `packages/ui`, a real dependency in `apps/showcase`. Expo's sticky resolution (below) covers native modules from autolinking, but a JS-only library that `packages/ui` resolves to a different version would still be bundled twice.

## Why there is only one `react-native` copy: autolinking module resolution

- From SDK 54, `experiments.autolinkingModuleResolution: true` "forces Metro's dependency resolution to match native module autolinking". From SDK 55 it is enabled automatically for monorepo apps. [Expo: Work with monorepos](https://docs.expo.dev/guides/monorepos/)
- In SDK 57 `@expo/cli` (`instantiateMetro.js`) it is `exp.experiments.autolinkingModuleResolution ?? (isWorkspace || targetsOutOfTreePlatform)`, where `isWorkspace = serverRoot !== projectRoot`. `expo start/export` logs "Expo Autolinking module resolution enabled".
- `createExpoAutolinkingResolver.js` keeps a `KNOWN_STICKY_DEPENDENCIES` list that always resolves to the app's copy. The list includes `react`, `react-dom`, `react-native`, `react-native-web`, `react-native-webview`, `expo-modules-core`, `expo-font`, `expo-asset`, `expo-constants`, `react-native-gesture-handler`, `react-native-reanimated`, `@react-navigation/core` and `@react-navigation/native`, plus every autolinked native module. Its comment reads: "react and react-dom aren't native modules, but must also be deduplicated in bundles".
- **Don't set `experiments.autolinkingModuleResolution: false`.** Without it, a version skew between `packages/ui` and the app *does* produce two Reacts in the bundle (see Verification, run C).

## Verification

Scratch monorepo at `/tmp/claude-1000/emr/mono` (outside the repo). It was built with `create-expo-app --template blank-typescript@sdk-57` (expo 57.0.26, RN 0.86.3, React 19.2.3, TS 6.0.3), pnpm 11.20.0 defaults, no `metro.config.js` and no `.npmrc`.

Setup:
- `packages/ui/components/button.tsx` imports `react`, `react-native` and `@/registry/lib/cn`.
- `App.tsx` imports `@/registry/components/button` and `@/lib/hello`, where `@/lib/hello` resolves to `src/lib/hello.ts`.

Each run used `npx expo export --platform ios --no-bytecode --source-maps`, and then I read the distinct `react@…` / `react-native@…` store paths from the bundle's source-map `sources`.

| Run | `packages/ui` devDeps | autolinkingModuleResolution | Copies in bundle | Modules |
|---|---|---|---|---|
| A | same versions as app | auto (on) | 1 react, 1 react-native | 583 |
| B | react 19.2.0, @types/react 19.2.0 (skewed, so 2 copies on disk) | auto (on) | **1 react, 1 react-native** | 583 |
| C | same skew as B | `false` | **2 react, 2 react-native** | 1051 |

In every run, both aliases resolved: `packages/ui/components/button.tsx`, `packages/ui/lib/cn.ts` and `apps/showcase/src/lib/hello.ts` were in the bundle. `tsc --noEmit` passed with `paths` and no `baseUrl`.

## Checks to keep in CI

- `pnpm why --depth=10 react-native` (and `react`) should show a single version. This is the command the Expo guide recommends, which also lists duplicate RN/React versions as unsupported. [Expo: Work with monorepos](https://docs.expo.dev/guides/monorepos/)
- `npx expo install --check` and `npx expo-doctor` in `apps/showcase`.

## Out of scope / follow-ups

- `apps/web` (nativecn.dev) also imports `packages/ui` source through `@/registry/*`. Its bundler (Next/Vite + `react-native-web`) needs its own alias and React dedupe; Expo's sticky resolver only covers Metro.
- Turborepo: give the Showcase App no `build` outputs for Metro (dev server). Cache `typecheck`/`lint`, with `packages/ui/**` as inputs.

## Sources

- Expo docs, Work with monorepos: https://docs.expo.dev/guides/monorepos/
- Expo docs, TypeScript (path aliases, `experiments.tsconfigPaths`): https://docs.expo.dev/guides/typescript/
- Expo SDK 57 changelog (React 19.2, React Native 0.86): https://expo.dev/changelog/sdk-57
- `@expo/cli@57.0.27` source: `build/src/start/server/metro/instantiateMetro.js`, `createExpoAutolinkingResolver.js`, `createTypescriptResolver.js`, `withMetroMultiPlatform.js` (from the npm tarball; upstream at https://github.com/expo/expo/tree/main/packages/%40expo/cli/src/start/server/metro)
- pnpm settings: https://pnpm.io/settings, https://pnpm.io/settings/node-modules, https://pnpm.io/settings/peer-dependencies
- pnpm catalogs: https://pnpm.io/catalogs
