# Agent Kit

The agent-facing artefacts nativecn ships so that AI agents can discover Registry Items, build apps with them, and verify the result on real devices. The nativecn MCP server lives here too.

## Language

**Agent Kit**:
The set of agent-facing artefacts nativecn ships: the nativecn MCP server, Skills, Rules, `llms.txt`, and Plugin.

**nativecn MCP server**:
The discovery service that tells an agent which Components, Blocks, Block Variants and Themes exist and what they contain, like shadcn's MCP. It has nothing to do with devices or the Visual QA Loop.
_Avoid_: Device MCP, QA server

**Skill**:
A packaged set of instructions teaching an agent how to do one mobile task with nativecn.

**Rule**:
A project-level instruction file that constrains how an agent writes code in a nativecn app (e.g. `AGENTS.md`).

**Plugin**:
An agent-host package (Claude Code, Cursor, and others) that bundles the Agent Kit for one-step installation.
_Avoid_: Extension

**Visual QA Loop**:
The agent-driven cycle of running the app on a device, capturing screenshots, comparing them with the Reference Design, and fixing differences. nativecn provides only the Skill and Rules for it; the agent reaches devices through existing platform command-line tools (adb for Android, `xcrun simctl` for the iOS Simulator).
_Avoid_: AI testing, screenshot testing

**Reference Design**:
An image of the intended appearance of a screen, kept in the app's `design/` folder, that the Visual QA Loop compares against.
