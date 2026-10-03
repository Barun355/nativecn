# Lucide and Inter on Expo SDK 57

Research for [#9](https://github.com/Barun355/nativecn/issues/9) (part of #1). Checked 2026-10-04 against npm and the official docs.

## Question

What is the current state of `lucide-react-native` + `react-native-svg` on Expo SDK 57 (support, bundle size, tree-shaking)? What is the recommended way to bundle Inter (the `expo-font` Config Plugin vs `useFonts`) so it looks identical on iOS and Android?

## Answer

Use `lucide-react-native@^1.51` on `react-native-svg@15.15.4`, the version pinned by SDK 57. Have the Icon Component take Lucide components rather than string names, because SDK 57's default production tree-shaking only removes icons nobody imports when the imports are static.

Embed four static Inter faces (400/500/600/700) with the `expo-font` Config Plugin. Name each file after its PostScript name (`Inter-Regular.ttf`, `Inter-Bold.ttf`, …) so the same `fontFamily` string works on both platforms. Have the Text Component pick weight only through `fontFamily`, never through `fontWeight`. `useFonts` with the same names is the fallback for Expo Go.

## Lucide on SDK 57

| Fact | Source |
|---|---|
| SDK 57 (`expo@57.0.26`) pins `react-native-svg` **15.15.4**, `react-native` 0.86.3 and `expo-font` ~57.0.4 | `expo/bundledNativeModules.json` in the `expo@57.0.26` tarball |
| `lucide-react-native` latest is **1.51.0** (1.0.0 shipped 2026-03-23). Its peers are `react-native-svg ^12 \|\| ^13 \|\| ^14 \|\| ^15`, `react-native *` and `react ^16.5–^19` | `npm view lucide-react-native` |
| `react-native-svg` is part of Expo's bundled native modules, so `npx expo install react-native-svg` gives the SDK-matched version and it works in Expo Go. It is the only dependency outside Expo modules + reanimated/gesture-handler that Lucide needs. That is justified because the Icon Component cannot draw Lucide glyphs without it | bundledNativeModules.json above |
| Rendering is pure JS over `react-native-svg` (`Svg`, `Path`, `Circle`, …), so iOS and Android draw from identical path data. Nothing is native to Lucide | `dist/esm/Icon.mjs` in `lucide-react-native@1.51.0` |
| The package is ESM with `"sideEffects": false`. Each icon is its own ~0.8 KB module (≈1,870 icons). The root barrel (`lucide-react-native.mjs`, ~250 KB) re-exports all of them. The `exports` map also exposes per-icon deep imports: `lucide-react-native/icons/<kebab-name>` | `package.json` and `dist/` in the tarball |
| Exports also include `Icon` (renders any icon node), `createLucideIcon` and `LucideProvider`/`useLucideContext`, which set default size/color/strokeWidth/absoluteStrokeWidth | `dist/esm/lucide-react-native.mjs`, `context.mjs` |
| Expo tree-shaking is **enabled by default since SDK 54**. It runs **only in production bundles** (`npx expo export` / EAS builds) and only on ESM. "Star exports will automatically be expanded and shaken based on usage", and the docs name lucide as the example | <https://docs.expo.dev/guides/tree-shaking/> |
| Lucide documents its RN package as tree-shakable: "only the icons you import are included in your final bundle" | <https://lucide.dev/guide/packages/lucide-react-native> |

What this means for nativecn:

- **Production size is fine.** Named imports from the barrel are shaken in release builds, and each icon costs under 1 KB plus the shared `Icon` and `react-native-svg` runtime.
- **Dev bundles still load the whole barrel.** Tree-shaking is off in dev. If Metro start-up or reload time becomes a problem, switch to deep imports (`import Camera from 'lucide-react-native/icons/camera'`), which skip the barrel in every mode.
- **Don't build a name→component map** (e.g. `<Icon name="camera" />` backed by `import * as icons`). A map like that defeats tree-shaking and ships every icon. The Icon Component should take the component: `<Icon icon={Camera} />`. It then reads size, colour and stroke from Tokens and passes `absoluteStrokeWidth` so strokes don't thin out at small Sizes.

## Inter on SDK 57

| Fact | Source |
|---|---|
| The Config Plugin is "the recommended method for adding fonts to your app": fonts are available at launch with no async loading code. It needs a development build, so it does not work in Expo Go | <https://docs.expo.dev/develop/user-interface/fonts/> |
| "On Android, the file name becomes the font family name." "On iOS, the font family name is always taken directly from the font file and may not be the same as the file name." The docs advise naming files after their PostScript name | <https://docs.expo.dev/versions/latest/sdk/font/> (v57), fonts guide above |
| The docs give the mismatch with Google Fonts files as an example: `Inter_900Black` on Android vs `Inter-Black` on iOS | fonts guide above |
| An Android-only `android.fonts[].fontDefinitions` (`fontFamily` + `path`/`weight`/`style`) generates a `res/font` XML family registered via `ReactFontManager.addCustomFont`. iOS has no equivalent: it just takes file paths | `expo-font@57.0.4` `plugin/build/withFontsAndroid.js`; font docs |
| `@expo-google-fonts/inter@0.4.2` ships Google Fonts' Inter (metadata `v20`) as 18 static TTFs (`Inter_400Regular.ttf` etc., ~340 KB each, 8 MB package) plus a `useFonts` hook | package tarball |
| Name tables in those files: PostScript names are `Inter-Regular`, `Inter-Medium`, `Inter-SemiBold`, `Inter-Bold`. Legacy family names differ per face (`Inter Medium` for 500, `Inter` for 700) | `fc-scan` on the TTFs |
| Variable-font axes in `fontDefinitions` and `fontVariationSettings` are documented for SDK 58+ / RN 0.88+, so SDK 57 cannot rely on them | fonts guide above |

Why `fontFamily: 'Inter'` + `fontWeight` is risky for "identical on both platforms":

- On Android it only works through the Android-only `fontDefinitions` XML family.
- On iOS it depends on how the system groups faces whose legacy family names differ (`Inter Medium` vs `Inter`).
- A weight with no matching face gets synthesized (faux bold) differently on each OS.

Per-face family names avoid all three problems.

### Recommended setup

1. Copy the four faces nativecn uses into the user's app as `assets/fonts/Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf` and `Inter-Bold.ttf`. Take them from `@expo-google-fonts/inter`, renamed to their PostScript names. Ship only these four (~1.4 MB). Shipping 18 faces would be 6 MB.
2. List them in the shared `fonts` array of the plugin. No platform-specific blocks are needed:
   ```json
   ["expo-font", { "fonts": [
     "./assets/fonts/Inter-Regular.ttf", "./assets/fonts/Inter-Medium.ttf",
     "./assets/fonts/Inter-SemiBold.ttf", "./assets/fonts/Inter-Bold.ttf"
   ]}]
   ```
   On Android the family name is the file name. On iOS the same string matches the PostScript name. So `fontFamily: 'Inter-SemiBold'` resolves to the same face on both.
3. The Theme's type Tokens map each weight to a `fontFamily` (`regular → 'Inter-Regular'`, …). The Text Component never sets `fontWeight`, so neither OS synthesizes a weight.
4. For Expo Go or a quick start without a rebuild: `useFonts({ 'Inter-Regular': require(...), ... })` with **the same keys**. Components work unchanged, and the Config Plugin can be added later with no code change.

After a rebuild, check with `getLoadedFonts()` on both platforms that all four names are present.

## Sources

- npm registry: `lucide-react-native@1.51.0`, `react-native-svg@15.15.5` (latest; SDK 57 pins 15.15.4), `expo@57.0.26` (dist-tag `sdk-57`), `expo-font@57.0.4`, `@expo-google-fonts/inter@0.4.2` (tarballs inspected directly)
- Expo tree-shaking guide: <https://docs.expo.dev/guides/tree-shaking/>
- Expo fonts guide: <https://docs.expo.dev/develop/user-interface/fonts/>
- Expo Font API / Config Plugin (v57): <https://docs.expo.dev/versions/latest/sdk/font/>
- Lucide React Native guide: <https://lucide.dev/guide/packages/lucide-react-native>
- Lucide source: <https://github.com/lucide-icons/lucide/tree/main/packages/lucide-react-native>
