// The remote MCP endpoint (nativecn.dev/mcp, decision #19): the CLI's read-only MCP server with
// no project (so no get_project_config, default Style), over stateless Streamable HTTP. Each
// request gets a fresh server and transport, so it runs on any number of serverless instances.
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { createServer } from "../../../packages/cli/src/mcp/server.ts";

/**
 * The Registry the endpoint reads: NATIVECN_REGISTRY_URL when set (a URL or a local folder),
 * otherwise this deployment's own /r, so a preview answers from the Registry it deployed.
 */
export function registryUrlFor(request: Request): string {
  return process.env.NATIVECN_REGISTRY_URL ?? new URL("/r", request.url).href;
}

const NO_STORE = { "Cache-Control": "no-store" };

export async function handleMcpRequest(request: Request): Promise<Response> {
  const server = createServer({ registryUrl: registryUrlFor(request) });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    // One JSON answer per POST: nothing here streams, and plain JSON suits curl and serverless.
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(NO_STORE)) headers.set(k, v);
    // Read the body before closing, so closing the transport can't cut the answer short.
    const body = await response.arrayBuffer();
    return new Response(response.status === 202 || body.byteLength === 0 ? null : body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } finally {
    await transport.close();
    await server.close();
  }
}

/** Stateless: there is no session to open a GET stream on or to DELETE. */
export function methodNotAllowed(): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed: POST JSON-RPC messages to /mcp." },
      id: null,
    },
    { status: 405, headers: { ...NO_STORE, Allow: "POST" } },
  );
}
