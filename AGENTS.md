## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed through the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context: `CONTEXT-MAP.md` at the root points to one `CONTEXT.md` per context under `packages/`; system-wide ADRs in `docs/adr/`. See `docs/agents/domain.md`.

### Decision index

Every 0.1 design decision, with its reasoning, is indexed in the closed wayfinder map [Wayfinder: build-ready spec for nativecn 0.1](https://github.com/Barun355/nativecn/issues/1). Each line links to the ticket that holds the full decision. Read the relevant ticket before changing anything it decided; ADRs live in `docs/adr/` and `packages/*/docs/adr/`.
