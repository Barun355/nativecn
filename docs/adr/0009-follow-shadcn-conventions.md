# nativecn is shadcn for the Expo ecosystem: follow shadcn's conventions by default

nativecn is not compatible with shadcn's CLI, MCP or registry directory (CLI ADR 0001). It is still deliberately **shadcn for mobile apps in the Expo ecosystem**. Whenever a question comes up, the default answer is "do what shadcn does". That covers:
- command names, flags and the init/create flow
- the Preset model and builder
- copy-paste ownership
- the registry item format and build
- multi-part exports
- form stack
- MCP tool shape
- docs structure

We deviate only where shadcn's choice conflicts with React Native, with Expo's own conventions, or with an earlier recorded nativecn decision. Every such deviation gets its own ADR, so the default never has to be re-argued. Examples:
- StyleSheet instead of Tailwind (ADR 0001)
- Expo's folder layout instead of `components/ui` (ADR 0008)
- our own `components.json` shape (CLI ADR 0001)

## Consequences
- Developers and agents who know shadcn can predict how nativecn behaves.
- When designing something new, the first step is to check how shadcn does it, in its source and not from memory.
