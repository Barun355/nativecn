import { docMarkdown } from "@/lib/docs";
import { allDocs } from "@/lib/docs-config";

// The `.md` twin of every docs page. next.config.ts rewrites /docs.md and /docs/<page>.md here;
// each twin is generated at build time from the same source as the page.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allDocs.map((page) => ({ slug: page.slug ? [page.slug] : [] }));
}

export async function GET(_request: Request, ctx: RouteContext<"/docs-md/[[...slug]]">) {
  const { slug } = await ctx.params;
  const markdown = await docMarkdown(slug?.join("/") ?? "");
  if (markdown === undefined) return new Response("Not found\n", { status: 404 });
  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
