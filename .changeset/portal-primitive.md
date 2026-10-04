---
"ui": patch
---

Add the `Portal` and `PortalHost` Primitives (`components/primitives/portal.tsx`): named hosts, layering by `layer` then registration order, safe-area insets for Portal content via `usePortalInsets()`, and on iOS the host renders inside `FullWindowOverlay` so it sits above native modals.
