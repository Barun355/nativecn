import { componentsJsonSchema } from "@/lib/schema";

// The `$schema` that every components.json points at, generated at build time from the CLI's zod
// schema and served as a static file (short cache, set in next.config.ts).
export const dynamic = "force-static";

export function GET() {
  return Response.json(componentsJsonSchema(), {
    headers: { "Content-Type": "application/schema+json" },
  });
}
