---
name: nativecn-visual-qa
description: Run the Visual QA Loop on a running nativecn Expo app - navigate Screens and User Flows on an Android device or iOS Simulator, screenshot them, judge them against the Reference Design at the design-system level, trace each problem to the code, fix small safe problems and report the rest. Use when the user says "match the design", "compare with Figma", "screenshot and fix", "check the screens", "visual QA", "does this look right", "test the flow on my phone", or "check dark mode on device".
---

# nativecn Visual QA Loop

An AI design and UX review of the running app. It is **not** pixel comparison or a test runner: you look at screenshots, judge them against the Reference Design's design system, trace each problem to the code, fix what is small and safe, and report the rest.

## Ground rules

- **Dev app only.** Open, navigate and screenshot only the app under development (its scheme, package and bundle id from `app.json`, or Expo Go's `exp://` URL when the user develops in Expo Go). Do nothing else on the device unless the user asks.
- **Only the commands in [references/device-commands.md](references/device-commands.md)**, in exactly those forms. No install, uninstall, clear-data, push or other `adb shell` commands. No Maestro or other automation tools.
- **Screenshots go to the OS temp folder**, never into the project and never left on the phone.
- **Never commit.** Auto-fixes stay uncommitted for the user to review. Don't stash, reset or check out files either.
- If the app isn't running on a device, ask the user to start it (e.g. `npx expo run:android`, `npx expo run:ios` or `npx expo start`). Don't build or install it yourself unless asked.

## 1. Prepare

1. Read `app.json` (or `app.config.*`): the `scheme`, `android.package` and `ios.bundleIdentifier`.
2. Resolve the OS temp folder (`node -p "require('os').tmpdir()"`). This run uses:
   - screenshots: `<tmp>/nativecn-qa/<device-id>/<timestamp>-<screen>.png`;
   - the report: `<tmp>/nativecn-qa/<run-timestamp>/report.md`.
   Keep only the last 20 screenshots per device; delete older ones.
3. List devices (`adb devices -l`, `xcrun simctl list devices booted -j`).
   - One Android device: leave out `-s`. Several: ask which one, then use `-s <serial>` (the user will be prompted).
   - iOS: use `booted`. If several Simulators are booted, ask the user to shut down the others.
4. Tidy the status bar (demo mode / `status_bar override`) and note the current appearance, so you can restore both at the end.

## 2. The `design/` folder

All optional, at the project root:

```
design/screens/<screen>.png (+ <screen>.dark.png)   Reference Design images (e.g. Figma exports)
design/flows.md                                      confirmed User Flows
design/expectations.md                               the user's description for screens without an image
```

Formats are in [references/design-folder.md](references/design-folder.md).

**User Flows.** If `design/flows.md` is missing or out of date:
1. Derive the flows from the code (route files in `src/app/`, `router.push` / `router.replace` / `Link`, form submits and their handlers) and any docs.
2. Write each one in plain language (e.g. "Sign up: sign-up → verify code → home").
3. Show them to the user and ask them to confirm or correct them. Save only confirmed flows.
4. If you can't derive them, ask the user to describe them.

**Screens without an image.** Ask the user what the screen should look like or do, or to pin-point the problem, and record the answer in `design/expectations.md`.

**Figma.** If a Figma MCP server is connected and the user points at a file or frame, read the design's real values (colours, spacing, type, components) from it as an extra input. Don't write to `design/` from Figma unless the user asks.

## 3. Capture

For every confirmed User Flow, end to end, and for each Screen in it:
1. Open the Screen with a deep link (`<scheme>://<route>`). On Android you can also tap: read the element tree with `uiautomator dump` to find tap targets, then `input tap` / `swipe` / `text` / `keyevent BACK`. On iOS there is no tap tool: use deep links and read the code for the steps in between.
2. Screenshot it in **light**, switch appearance, screenshot it in **dark**.
3. Capture the states the flow passes through (empty, loading, error, success) where you can reach them.

## 4. Judge

Give the AI both the app screenshot and the Reference Design image (when there is one), plus the Figma values when available. Judge **at the design-system level, never pixel to pixel**:

- **Spacing** is on the Token scale.
- **Typography:** the right Text Variant for each role, and a clear hierarchy.
- **Layout:** alignment, auto-layout, safe areas, clipping and overlap.
- **Components:** the right Component and Variant, with all its states present.
- **Colour Roles** are right in light and dark.
- **Misalignment and broken Components.**
- **Non-functional actions:** every action does something and leads where the User Flow says. Check by navigating and by reading the handlers in the code.

Check each User Flow as a whole against the Screens and the code, not just single Screens.

For each problem, trace the **root cause** in the code (file:line), not only the symptom.

## 5. Fix or report

**Guiding rule: auto-fix only if the fix is visual-only, stays inside one Screen, uses what already exists (Tokens, Components, Variants), and is easy to undo. Otherwise report it and wait for the user.**

### Auto-fix
1. Hard-coded colour → the matching Colour Role.
2. Spacing or size off the scale → the nearest Token, or `scale(n)` for a genuine one-off.
3. Wrong Text Variant for its role (e.g. a title as `body` → `h2`, per the design).
4. Misalignment: alignment, a missing `gap`, uneven padding.
5. Safe-area and keyboard problems: wrap the Screen in `Container`.
6. Clipping or overflow: `numberOfLines`, shrink or wrap.
7. Broken Component usage: a misspelled prop, a wrong Variant name, a missing required prop (e.g. `aria-label` on an icon-only Button).
8. Missing visual states when the data already exists (e.g. passing `loading`).
9. Inconsistent icon sizes or colours.
10. Tap targets under 48 → `hitSlop`.
11. Accessibility gaps: a missing `role` or labels.

### Report only (the user decides)
1. Navigation and flow: where actions lead, routes, missing Screens.
2. Non-functional actions (the intended behaviour can't be guessed).
3. Logic: data, API, state, validation rules, form behaviour.
4. Auth, storage, permissions, security.
5. Theme or Preset changes (`src/theme/`), which affect the whole app.
6. Edits to shared Components (`src/components/…`), which affect every Screen using them.
7. Packages, `app.json`, config.
8. Copy and content, images and assets.
9. Layout redesigns: moving sections, changing hierarchy, swapping Components.
10. Deleting code or features.
11. A design that conflicts with the Rules (e.g. a non-Token colour), or an unclear design.

### Limits
- Each auto-fix stays within one Screen file and its private parts (e.g. `src/screens/<block>/components/…`).
- A fix needing more than about 30 changed lines becomes a report.
- After fixing, re-capture to confirm. A fix that doesn't hold after 3 attempts is reverted (undo your own edits only) and reported.
- Report-only items are changed only when the user asks; then apply the recommended option.

## 6. Report

Show the report in chat and save it as `report.md` in the run's temp folder. For each finding:
- **where:** the Screen plus file:line;
- **what's wrong:** in plain language;
- **root cause:** traced in the code;
- **options:** suited to this codebase and use case, with trade-offs, one of them recommended;
- **severity:** broken (doesn't work or can't be used) / wrong (works, but doesn't match the Reference Design or the design system) / polish;
- **status:** auto-fixed or awaiting the user.

End with the list of auto-fixes (file:line and a one-line reason each), and remind the user they are uncommitted.

```md
# Visual QA: <app>, <date>
Devices: <model, OS> · Flows: <names> · Reference: <images / expectations / Figma>
Summary: <n> broken · <n> wrong · <n> polish; <n> auto-fixed, <n> awaiting you

## 1. <short title>
- **Where:** sign-in, `src/screens/sign-in/index.tsx:57`
- **What's wrong:** …
- **Root cause:** …
- **Options:** 1. (recommended) … (trade-off) · 2. … (trade-off)
- **Severity:** wrong
- **Status:** awaiting you

## Auto-fixes (uncommitted)
- `src/screens/sign-in/index.tsx:57`: hard-coded `#666` → the muted foreground Colour Role
```

## 7. Clean up

Restore the device: leave demo mode / clear the status bar override, and set the appearance back to what it was. Make sure no screenshot is left on the phone.

## nativecn's own QA list

When working in the nativecn repo on the Showcase App, also run its QA list, starting with: **a Toast over an Expo Router `formSheet` modal on iOS must render above the modal.**
