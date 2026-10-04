# shadcn's item format as internal tooling, with our own installer and no shadcn compatibility

Registry Items are written in shadcn's registry item format, typed and validated with `shadcn/schema`, and built with `shadcn build` into `{name}.json` files with their contents inlined, served from nativecn.dev/r/styles/<style>/. This is purely **internal tooling**: a free schema, validator and builder we don't maintain, in an item shape agents already recognise.

nativecn is **not** compatible with the stock shadcn CLI or the shadcn MCP, and is not listed in shadcn's registry directory:
- A project's `components.json` is nativecn's own. It carries the Preset, `structure`, extra aliases, `routes` and `agents`. shadcn's strict config schema rejects it, and that is accepted.
- Items follow no shadcn-only compatibility rules: no stubbed Tailwind fields, no `@/registry/<style>/…` output form, and `registryDependencies` use plain item names that our CLI resolves.
- There are no third-party or private registries. The CLI knows only nativecn's own Registry, and its address is built in.

nativecn-cli has its own installer for this JSON (it does not depend on `@shadcn/registry`). It adds the Expo-specific steps: `expo install` for SDK-matched versions, Config Plugins, Destination resolution per Structure, Preset ingredients and font downloads.

## Considered and rejected
- **Keeping items installable by the stock shadcn CLI**, which would need two config files or a dummy Tailwind section in every project.
- **Listing nativecn in shadcn's directory.** It was first deferred to 0.3, then dropped.
