import { buildLlmsFullTxt } from "@/lib/docs";

// Every docs page and the Registry item list in one file, generated once at build time.
export const dynamic = "force-static";

export async function GET() {
  return new Response(await buildLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
