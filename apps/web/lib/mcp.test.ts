import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

// The CLI's MCP fixture Registry (a local folder works wherever a Registry URL does).
process.env.NATIVECN_REGISTRY_URL = path.resolve(
  import.meta.dirname,
  "../../../packages/cli/src/mcp/__fixtures__/r",
);

const { DELETE, GET, POST } = await import("../app/mcp/route.ts");

let id = 0;
const rpc = (method: string, params: Record<string, unknown> = {}) =>
  new Request("https://nativecn.dev/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });

type RpcResponse = { id: number; result?: Record<string, unknown>; error?: unknown };

test("/mcp answers initialize", async () => {
  const res = await POST(
    rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "0.0.0" },
    }),
  );
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("mcp-session-id"), null, "stateless: no session");
  const body = (await res.json()) as RpcResponse;
  const result = body.result as { serverInfo: { name: string }; instructions: string };
  assert.equal(result.serverInfo.name, "nativecn");
  assert.match(result.instructions, /No project here/);
});

test("/mcp lists the remote tools: everything but get_project_config (#19)", async () => {
  const res = await POST(rpc("tools/list"));
  assert.equal(res.status, 200);
  const { result } = (await res.json()) as RpcResponse;
  const names = (result!.tools as { name: string }[]).map((t) => t.name).sort();
  assert.deepEqual(names, [
    "build_preset_code",
    "get_add_command",
    "get_audit_checklist",
    "get_item_examples",
    "list_block_variants",
    "list_items",
    "list_preset_options",
    "search_items",
    "view_items",
  ]);
});

test("/mcp tools read the Registry", async () => {
  const res = await POST(
    rpc("tools/call", { name: "search_items", arguments: { query: "button" } }),
  );
  const { result } = (await res.json()) as RpcResponse;
  const text = (result!.content as { text: string }[])[0]!.text;
  assert.equal(JSON.parse(text).items[0].name, "button");
});

test("/mcp shows code with the default aliases, never @/registry/ (#137)", async () => {
  const calls = [
    { name: "view_items", arguments: { items: ["button", "sign-in-01"] } },
    { name: "get_item_examples", arguments: { query: "button" } },
  ];
  for (const call of calls) {
    const { result } = (await (await POST(rpc("tools/call", call))).json()) as RpcResponse;
    const text = (result!.content as { text: string }[]).map((c) => c.text).join("\n");
    assert.doesNotMatch(text, /@\/registry\//, call.name);
    assert.match(text, /from "@\/components\//, call.name);
  }
});

test("/mcp has no GET stream or DELETE (stateless)", async () => {
  assert.equal(GET().status, 405);
  assert.equal(DELETE().status, 405);
});
