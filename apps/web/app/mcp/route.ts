// nativecn.dev/mcp: the remote, read-only MCP server (decision #19). Never cached.
// Relative import (not "@/") so the route can be loaded directly by `node --test`.
import { handleMcpRequest, methodNotAllowed } from "../../lib/mcp.ts";

// The MCP server reads the Registry with Node APIs; it is not an Edge function.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: Request): Promise<Response> {
  return handleMcpRequest(request);
}

export function GET(): Response {
  return methodNotAllowed();
}

export function DELETE(): Response {
  return methodNotAllowed();
}
