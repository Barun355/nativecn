import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        Try the search (⌘K), or start from the{" "}
        <Link href="/docs" className="underline">
          docs
        </Link>
        .
      </p>
    </main>
  );
}
