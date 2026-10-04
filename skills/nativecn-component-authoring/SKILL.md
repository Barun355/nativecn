---
name: nativecn-component-authoring
description: Write or change nativecn Components so they follow the Component contract. Use when the user asks for a "new component", "custom component", "reusable component", "add a variant", "add a size", "make this pressable", or to edit a Component in src/components of a nativecn app, or when contributing a Component or Primitive to the nativecn repo.
license: MIT
---

# Author a nativecn Component

## 1. Check before writing

- Search the Registry first with `search_items` / `list_items`. If the Component exists, add it (`get_add_command`) instead of writing one.
- "Add a Variant" or "add a Size" to an installed Component means editing its file: add a key to its typed Variants object and the matching styles. The user owns the file.
- A composition used on one Screen is not a Component; keep it next to that Screen.

## 2. Placement (ADR 0008)

- Generic, reusable Components: `src/components/<name>.tsx`. Rendering Primitives: `src/components/primitives/`. Hooks: `src/hooks/`. Helpers: `src/utils/`.
- In feature mode, something used by one Feature lives in `src/features/<feature>/components/`. The moment a second Feature needs it, move it to `src/components/` and update the imports. Reuse global items first.
- nativecn Components and Primitives always stay global.

## 3. The Component contract

**Files and exports**
- kebab-case file names (`price-tag.tsx`); named exports only, never a default export; export the props type (`PriceTagProps`).
- Variants as a typed object at the top of the file. Sizes (`sm`, `md`, `lg`) map only to Tokens.
- Multi-part Components: named exports from one file (`Card`, `CardHeader`, `CardTitle`, …). No dot syntax.
- `ref` is a plain prop (React 19); no `forwardRef`. `testID` and the underlying React Native props pass through.
- Overrides: only `style`, merged **last** onto the root, for layout. No per-part style props.
- Route files in `src/app/` are the one place a default export is required (by Expo Router); they aren't Components.

**States and Status**
- `disabled` and `loading` are booleans.
- Feedback Components take `status?: 'error' | 'success'`.
- Precedence: `disabled` > `loading` > `status`.
- A Component never resets `status`; the Screen sets and clears it.

**Form controls**
- Work controlled (`value` + change handler) and uncontrolled (`defaultValue`), via `useControllableState`.
- Names: Checkbox/Switch-like `checked` / `onCheckedChange`; choice controls `value` / `onValueChange`; text inputs `value` / `onChangeText`.
- Read `label`, `status`, `disabled` and `required` from `FormFieldContext` so the control works inside `FormField`.

**Press feedback and motion**
- Every pressable has a pressed look, applied instantly through the `Pressable` Primitive's pressed state. No ripple, no OS-specific feedback.
- Animations use the `fast` motion Token through `useMotion`, and are skipped when Reduce Motion is on.
- Selection controls (switch, checkbox, radio, segmented, chip, slider steps) give a light haptic tick when `haptics` is on in `config.ts`. Buttons don't.

**Text and icons**
- All text through `Text` (Variant + text Colour Role), all glyphs through `Icon` with a Lucide component passed in.

## 4. Styling

- `createStyles((t) => ({ … }))` from the Theme, with Tokens and Colour Roles only. No hard-coded colours or sizes; `t.scaleValue(n)` only for genuine one-offs. No Tailwind, NativeWind or `className`.
- Variant styles are extra keys in the same `createStyles` call.
- Test in light and dark.

### Style Slots

- **In a user's app** the Style is already baked into each Component as literal values. Match the look of the installed Components (e.g. copy the pressed look and control heights from `button.tsx`) so the new one fits the Preset.
- **In the nativecn repo**, base files call `slot('<component>.<part>', t)` (e.g. `slot('button.root', t)`, `slot('button.pressed', t)`), and every Style fills every slot in `packages/ui/styles/<style>.ts` (`defineStyle({ … })`): Vega and Nova in 0.1. The build fails on an unfilled slot. Primitives have no Style Slots.

## 5. Build on Primitives

Use nativecn's own Primitives. Never wrap a native control (`@expo/ui`, React Native's `Switch`/`Modal`, `Alert.alert`) or a third-party headless library.

| Primitive | Use it for |
|---|---|
| `Pressable` | anything pressable: pressed look, 48 tap area, blocks presses while disabled/loading, haptics, `role`/`aria-*` |
| `useControllableState` | controlled + uncontrolled values |
| `SelectionGroup` | single choice in a group (`radiogroup`/`radio`, `tablist`/`tab`) |
| `FormFieldContext` | label, description, error, `status`, `disabled`, `required` from `FormField` |
| `Portal` + `PortalHost` | anything that must render above every Screen (also above iOS native modals) |
| `useMotion` | enter/exit animation from motion Tokens; instant with Reduce Motion |
| `announce()` | screen-reader announcements (e.g. a `status` change) |
| keyboard handling | `react-native-keyboard-controller` via `Container` |
| `FocusChain` | "Next"/"Done" between form fields |

Get their exact APIs with `view_items`.

## 6. Accessibility checklist

Every Component meets all nine:
1. Correct `role`.
2. An accessible name: from the visible text, or required by the types when there is none (e.g. icon-only Button needs `aria-label`).
3. `aria-disabled`, `aria-busy`, `aria-checked`, `aria-selected`, `aria-expanded` as applicable.
4. `hitSlop` up to the 48 minimum.
5. No handler runs while disabled or loading.
6. Error and success are announced to screen readers.
7. Reduce Motion is honoured.
8. The font-scaling switch is honoured, with the 1.5× cap on chrome Variants.
9. An optional hint passes through.

Use the `role` / `aria-*` spelling, never `accessibility*`. Never remove an existing `role` or `aria-*`.

## 7. Dependencies

Only SDK-pinned packages, installed with `npx expo install`. Anything else: ask the user first. Never `@react-navigation/*` or `expo-drawer`.

## 8. Finish

1. Run `get_audit_checklist` and fix what it flags.
2. Type-check. In the nativecn repo, add Jest + React Native Testing Library tests covering the checklist, plus the item's `_registry.ts` entry, docs page and examples.
3. Offer the `nativecn-visual-qa` Skill to check it on a device.
