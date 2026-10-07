# Dependencies: the Expo SDK's pinned modules, or a recorded decision

Anything nativecn writes into a user's app (Components, Primitives, Blocks, the Theme, the Starter) may depend only on:

- packages in the current Expo SDK's pinned native-module list (`bundledNativeModules.json`, installed with `expo install` so versions match the SDK). Examples: `expo-*` modules, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-native-keyboard-controller`, `@react-native-async-storage/async-storage`.

Any other package needs its own ADR that names the item that needs it and says why. The recorded exceptions so far are:
- zustand: Theme Scheme persistence and the Toast queue (Design System ADR 0001)
- react-hook-form and zod: form logic in Blocks (Design System ADR 0002)
- @hookform/resolvers: the `zodResolver` that connects zod to react-hook-form in the form Blocks (Design System ADR 0002; owner decision, issue #149, 2026-10-07)

Under this rule, Lucide's `react-native-svg` is SDK-pinned, and `lucide-react-native` is covered by the Lucide decision.

This keeps the "lightweight, faster builds" promise checkable. Every addition is either version-locked by Expo or deliberately argued for, and "can I add library X?" has one place to look.

## Consequences
- Never installed: `@react-navigation/*` (Expo Router covers navigation, including `expo-router/drawer`) and the unrelated npm package `expo-drawer`.
- The Registry build fails if an item declares a dependency outside this rule without a matching ADR.
