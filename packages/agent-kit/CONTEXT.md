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
The agent-driven review of a running app: it navigates screens and User Flows on a device, captures screenshots, judges them against the Reference Design (or the user's stated expectations) at the design-system level, and traces each problem to its root in the code. Small, safe problems are fixed directly; anything risky is explained with recommended fixes and changed only on request. nativecn provides only the Skill and Rules; the agent drives devices with raw platform tools (adb, and `xcrun simctl` for the iOS Simulator) within an allowlist.
_Avoid_: AI testing, screenshot testing

**Reference Design**:
What a screen is meant to look like: an exported image in `design/screens/` when one exists, otherwise the user's description recorded in `design/expectations.md`. The Visual QA Loop judges against its design system (spacing, typography, layout, Components), not pixel by pixel.
_Avoid_: Mockup, golden image

**User Flow**:
A confirmed sequence of screens and actions (e.g. sign up → verify code → home), derived by the agent from code and docs and approved by the user, kept in `design/flows.md`.
_Avoid_: Journey, scenario, test case
