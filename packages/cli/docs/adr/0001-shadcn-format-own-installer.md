# shadcn's registry format, our own installer

Registry Items follow shadcn's format exactly:
- item definitions are written in TS and validated with `shadcn/schema`;
- `shadcn build` emits `{name}.json` with each file's contents inlined, served from nativecn.dev/r/;
- source files import registry-internal paths (`@/registry/<style>/…`), which are rewritten to the user's aliases on install;
- the registry is always "latest", and updates come through `add --diff` / `add --overwrite`.

That keeps `npx shadcn add @nativecn-cli/…`, shadcn's registry directory and shadcn's MCP working as extra ways in. It also lets the Showcase App and nativecn.dev import source straight from `packages/ui` through the `@/registry/*` alias.

nativecn-cli does **not** depend on `@shadcn/registry` to fetch, resolve, rewrite imports or write files. It has its own small installer for the same JSON. The reasons:
- `@shadcn/registry` assumes a Tailwind-shaped `components.json` that we'd have to fill with dummy values.
- It applies web-only transformers we'd have to switch off.
- shadcn moves its internals around: this code was recently split out of the CLI into a separate package.

Our installer adds the Expo-specific steps: `expo install` for dependency versions matched to the SDK, Config Plugins, and Expo Router targets for Blocks.

## Consequences
- We maintain resolution and import rewriting ourselves. CI must check that the stock shadcn CLI still installs our items, so the two paths don't drift apart.
- Web-only fields (`tailwind`, `cssVars`, `css`) stay empty in every item.
