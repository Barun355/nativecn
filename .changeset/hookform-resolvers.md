---
"ui": patch
---

The six auth Screen Blocks (`sign-in-01`..`03`, `sign-up-01`..`03`) now connect zod to react-hook-form with `zodResolver` from `@hookform/resolvers/zod` instead of each carrying a local copy, and list `@hookform/resolvers@^5.9.1` in their `dependencies`. `@hookform/resolvers` is a recorded exception to the dependency rule (ADR 0007, Design System ADR 0002; owner decision, issue #149). Validation, the messages under each field and the `toast()` feedback are unchanged.
