# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

This is a **multi-context** monorepo.

- **`CONTEXT-MAP.md`** at the repo root: it lists each context, where its `CONTEXT.md` lives, and how the contexts relate. Read the map first, then each `CONTEXT.md` relevant to the topic.
- **`docs/adr/`** at the root: system-wide decisions. Read the ones that touch the area you're about to work in.
- **`packages/<context>/docs/adr/`**: decisions scoped to one context. Check the context you're working in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CONTEXT-MAP.md
├── docs/adr/                      ← system-wide decisions
├── apps/
│   ├── web/                       ← nativecn.dev (no glossary of its own yet)
│   └── showcase/                  ← Showcase App (no glossary of its own yet)
└── packages/
    ├── ui/                        ← Design System context
    │   ├── CONTEXT.md
    │   └── docs/adr/
    ├── cli/                       ← Distribution context
    │   ├── CONTEXT.md
    │   └── docs/adr/
    └── agent-kit/                 ← Agent Kit context (includes the MCP server)
        ├── CONTEXT.md
        └── docs/adr/
```

An app gets its own `CONTEXT.md` (and an entry in `CONTEXT-MAP.md`) only once it needs terms no existing context defines.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
