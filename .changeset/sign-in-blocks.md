---
"ui": patch
---

Add the first Screen Blocks: `sign-in-01` (classic centred: logo, email and password, "or", then Apple and Google), `sign-in-02` (social-first: a dark brand hero, centred, with Apple and Google leading and "Continue with email" revealing the form) and `sign-in-03` (email first, in two steps: the email, then the password, or "Email me a code instead" with InputOTP). Each installs to `{screens}/sign-in-0X/` with `add --route` (suggested route `(auth)/sign-in`). Each carries its own form logic with react-hook-form and zod: validation errors appear under the fields, and server errors and success messages appear only through `toast()`. The fields sit in a FocusChain. The Blocks never talk to a server: `onSubmit`, `onSocialSignIn` and `onSendCode` are callbacks. Adds the `screens/` Registry folder and its `_registry.ts` (replacing the empty `blocks/` placeholder), and react-hook-form and zod as dev dependencies.
