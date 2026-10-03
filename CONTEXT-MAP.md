# Context Map

nativecn is a copy-into-your-project component system for Expo apps (iOS and Android first), distributed from nativecn.dev, and built so that AI agents can build and verify whole mobile apps with it.

## Contexts

- [Design System](./packages/ui/CONTEXT.md): the Components, Theme and Blocks that users copy into their apps
- [Distribution](./packages/cli/CONTEXT.md): how Registry Items reach a user's app through the Registry and nativecn-cli
- [Agent Kit](./packages/agent-kit/CONTEXT.md): the artefacts that teach AI agents to build and verify apps with nativecn

## Apps

These apps use the contexts' language and don't yet need a glossary of their own.

**Showcase App** (`apps/showcase`):
The complete mobile app built with nativecn and published to the App Store and Play Store to demonstrate every Component.

**nativecn.dev** (`apps/web`):
The website that shows Components through screenshots and videos (captured on physical devices) and hosts the Registry, MCP server, Skills and Plugin.

## Relationships

- **Design System → Distribution**: Components, Themes and Blocks are packaged as Registry Items; Distribution owns how they are fetched and installed, never what they contain
- **Distribution → Design System**: A Block is installed as a Screen, a term owned by Distribution
- **Agent Kit → Design System, Distribution**: The nativecn MCP server describes Components, Blocks, Block Variants and Themes, and Skills drive nativecn-cli; Agent Kit uses both vocabularies and defines neither
- **nativecn.dev → Distribution, Agent Kit**: nativecn.dev hosts the Registry, the nativecn MCP server, Skills and Plugin

## Decisions

System-wide ADRs live in [`docs/adr/`](./docs/adr/). Context-specific ADRs live in each context's own `docs/adr/`.
