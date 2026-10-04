---
"ui": patch
---

Add the sign-up Screen Blocks: `sign-up-01` (classic single form: Apple and Google on top, then name, email, password and a terms Checkbox), `sign-up-02` (a step-by-step wizard under a Progress bar: email, name, password, then a 6-digit code with InputOTP) and `sign-up-03` (social first and passwordless: Apple and Google lead, and "Sign up with email" sends an InputOTP code). Each installs to `{screens}/sign-up-0X/` with `add --route` (suggested route `(auth)/sign-up`). Each carries its own form logic with react-hook-form and zod: validation errors appear under the fields, and server errors and success messages appear only through `toast()`. The fields sit in a FocusChain. The Blocks never talk to a server: `onSubmit`, `onSocialSignIn` and `onSendCode` are callbacks.
