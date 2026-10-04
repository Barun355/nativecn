# The `design/` folder

Everything here is optional. Create files only with the user's confirmation, and keep them plain so the user can edit them.

```
design/
  screens/
    sign-in.png          Reference Design, light
    sign-in.dark.png     Reference Design, dark (optional)
  flows.md               confirmed User Flows
  expectations.md        descriptions for screens without an image
```

## `design/screens/`

- One image per Screen, named after its route (`sign-in.png`, `settings-profile.png` for `settings/profile`).
- `.dark.png` is the dark Scheme version. Without it, judge dark mode by the Colour Roles alone.
- Images are usually Figma exports. Judge them by their design system, not pixel by pixel: device sizes and fonts differ.

## `design/flows.md`

Only flows the user has confirmed. One section per User Flow:

```md
## Sign up
Confirmed: 2026-10-04

1. sign-up: fill name, email, password, accept terms → tap "Create account"
2. verify-code: enter the 6-digit code → goes to home automatically
3. home

Notes: "Continue with Google" calls onSocialSignIn("google") and skips step 2.
```

- Name each step by its route, then the action, then where it should lead.
- Note the evidence when it came from code (e.g. `router.replace('/home')` in `src/screens/sign-up/index.tsx:42`).
- When the code changes a flow, propose the update and ask the user to confirm it again.

## `design/expectations.md`

The user's own words for Screens that have no image, or a pin-pointed problem. One section per Screen:

```md
## settings
Recorded: 2026-10-04

- Grouped list like iOS Settings: Account, Appearance (SchemeSwitcher), Notifications, About.
- Destructive "Log out" row at the bottom, in its own section.
- Problem the user sees: the version number is cut off on small phones.
```
