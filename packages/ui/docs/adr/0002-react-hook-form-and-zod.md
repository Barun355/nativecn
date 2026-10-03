# Form Blocks use react-hook-form and zod

Form Blocks (sign-in, sign-up) carry form logic: field values, validation, error display and submit/loading state. They never talk to a server. They hand clean values to the screen's `onSubmit`, so nativecn stays neutral about the auth backend.

The form logic uses **react-hook-form** for form state and **zod** for the validation rules. Neither package is on the Expo SDK's pinned list, so both are exceptions under ADR 0007. We accepted roughly 20 KB because this is exactly shadcn's form stack: agents and developers already write it fluently, and adding or changing a field is a small, low-risk edit. A homemade form helper would save the bytes but teach every agent a system it has never seen.

## Consequences
- `FormField` stays library-neutral. Blocks connect it to react-hook-form through `Controller`, and apps can use FormField without either library.
- Validation errors appear under their field. Server errors thrown from `onSubmit`, and success messages, are shown **only** through nativecn's own `toast()`. Platform dialogs (`Alert.alert`) are never used, here or anywhere else nativecn writes code.
- Social sign-in buttons only call `onSocialSignIn(provider)`. Validation messages are English strings in the Block file; i18n is out of scope for 0.1.
