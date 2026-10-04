import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer, type CreateServerOptions } from "./server.ts";

export {
  createServer,
  DEFAULT_CACHE_MS,
  DEFAULT_STYLE,
  type CreateServerOptions,
} from "./server.ts";

/** `nativecn-cli mcp`: serve the project in `cwd` over stdio. stdout carries only MCP messages. */
export async function runStdio(options: CreateServerOptions & { cwd: string }): Promise<void> {
  const server = createServer(options);
  await server.connect(new StdioServerTransport());
}
