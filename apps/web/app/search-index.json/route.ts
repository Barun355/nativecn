import { buildSearchIndex } from "@/lib/docs";

// Generated once at build time and served as a static file: ⌘K search needs no external service.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await buildSearchIndex());
}
