// The JSON Schema served at /schema/components.json (decision #14), generated from the CLI's own
// zod schema so the editor hint and what `nativecn-cli` accepts can never drift apart.
import { z } from "zod";

import { CONFIG_SCHEMA_URL, configSchema } from "../../../packages/cli/src/config.ts";

export function componentsJsonSchema(): Record<string, unknown> {
  // "input": what a hand-written file may contain (fields with defaults, like agents, are optional).
  const generated = z.toJSONSchema(configSchema, { io: "input", target: "draft-2020-12" });
  const { $schema, ...rest } = generated as Record<string, unknown>;
  return {
    $schema,
    $id: CONFIG_SCHEMA_URL,
    title: "nativecn components.json",
    description:
      "nativecn's project file: the Preset (fixed for the project), Structure, aliases for the Destinations, the routes folder and the AI agents. See https://nativecn.dev/docs/components-json.",
    ...rest,
  };
}
