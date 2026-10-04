import { buildLlmsTxt } from "@/lib/docs";

// Generated once at build time from the docs sources and the Registry index (llmstxt.org format).
export const dynamic = "force-static";

export async function GET() {
  return new Response(await buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
