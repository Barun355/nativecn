# Expo's folder structure, plus an opt-in feature mode

nativecn writes into Expo's recommended project layout rather than shadcn's `components/ui/` + `lib/` convention:
- `src/app/`: routes only.
- `src/components/`: Components, and Primitives that render, under `src/components/primitives/`.
- `src/hooks/`: Primitive hooks.
- `src/utils/`: helpers.
- `src/theme/`: the Theme.
- `src/screens/`: screen Blocks, rendered by a route file.
- Drawer Blocks go in `src/components/`.

`nativecn-cli create|init --folder-feat` adds a feature layer, `src/features/<feature>/{components,hooks,screens,utils}`, recorded in `components.json` as `"structure": "feature"` (the default is `"flat"`).

In feature mode:
- nativecn Components and Primitives always stay global.
- Screen Blocks go to a named feature (`add sign-in-02 --feature auth` writes to `src/features/auth/screens/sign-in-02/`).
- Agents follow one placement rule: reuse what already exists globally; something used by one feature lives in that feature; the moment a second feature needs it, promote it to the global folder. This applies equally to components, hooks, utils and screens.

We chose Expo's layout because the apps are Expo apps and Expo's own skills and agents already expect it. Feature mode exists for larger apps, where a flat `components/` folder becomes unmanageable.

## Consequences
Users coming from shadcn won't find `components/ui/`. Default aliases are `@/components`, `@/hooks`, `@/utils`, `@/theme` and `@/screens`.
