import assert from "node:assert/strict";
import { test } from "node:test";

import { componentsJsonSchema } from "./schema.ts";

type Schema = {
  $schema: string;
  $id: string;
  type: string;
  required: string[];
  properties: Record<string, { enum?: unknown[]; const?: unknown; items?: { enum?: unknown[] } }>;
};

const schema = componentsJsonSchema() as Schema;

test("the components.json schema is JSON Schema with nativecn's $id", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.$id, "https://nativecn.dev/schema/components.json");
  assert.equal(schema.type, "object");
});

test("it follows the CLI's zod schema (#14)", () => {
  assert.deepEqual(
    Object.keys(schema.properties).sort(),
    ["$schema", "agents", "aliases", "preset", "routes", "structure", "version"].sort(),
  );
  // agents has a default, so a hand-written file may leave it out.
  assert.deepEqual(
    [...schema.required].sort(),
    ["aliases", "preset", "routes", "structure", "version"].sort(),
  );
  assert.equal(schema.properties.version?.const, 1);
  assert.deepEqual(schema.properties.structure?.enum, ["flat", "feature"]);
  assert.deepEqual(schema.properties.agents?.items?.enum, [
    "claude",
    "codex",
    "cursor",
    "antigravity",
  ]);
});
