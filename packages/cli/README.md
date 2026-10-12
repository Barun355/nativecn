# nativecn-cli

Copy-paste components, Blocks and a Theme for Expo and React Native, built for AI agents. The code is copied into your app, so you own it and can change it freely.

Docs, the component list and the Preset builder: **[nativecn.dev](https://nativecn.dev)**

## Quick start

Create a new Expo app with nativecn:

```sh
npx nativecn-cli@latest create my-app
```

Pick a look first on [nativecn.dev/create](https://nativecn.dev/create) and pass its code:

```sh
npx nativecn-cli@latest create my-app --preset <code>
```

Already have an Expo app? Set it up, then add what you need:

```sh
npx nativecn-cli@latest init
npx nativecn-cli@latest add button input sign-in-01
```

## Commands

| Command | What it does |
| --- | --- |
| `create [name] [items...]` | Create a new Expo app with nativecn |
| `init [items...]` | Set up nativecn in an existing Expo app |
| `add [items...]` | Add Components, Primitives and Blocks to your app |
| `agents` | Write or refresh the Agent Kit: Rules, Skills, MCP config and Plugin hints |
| `mcp` | Run the read-only nativecn MCP server over stdio |

Run `npx nativecn-cli@latest <command> --help` for each command's options.

## License

MIT
