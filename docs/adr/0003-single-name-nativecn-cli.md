# `nativecn-cli` is the only published name

The `nativecn` npm package and the `@nativecn` scope belong to other, dormant projects. Rather than split the brand across several names (`create-nativecn`, a scope, a CLI package), every published artefact uses `nativecn-cli`: the npm package, the command, the Registry namespace and the MCP server name. The website stays at nativecn.dev. The cost is that there's no `npm create nativecn` shortcut; the Starter is created with `npx nativecn-cli create`.
