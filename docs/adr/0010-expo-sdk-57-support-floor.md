# Expo SDK 57 is the permanent support floor

nativecn supports every Expo SDK from **57 up to the latest**. When a new SDK ships, support is added; older SDKs are never dropped below 57 without a new, explicit decision. The Starter always uses the newest SDK, and `init` rejects anything older than 57.

## Consequences
- Components, Primitives and Blocks may only use APIs available in SDK 57. Anything newer must be feature-detected, with an SDK 57 fallback.
- Every Registry Item's dependencies must resolve via `expo install` on both SDK 57 and the latest SDK.
- Each SDK-bump release runs the Visual QA list and the CI checks on SDK 57 as well as the newest SDK.
