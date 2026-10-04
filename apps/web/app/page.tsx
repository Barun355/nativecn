import Link from "next/link";

import { CopyCommand } from "@/components/copy-command";

// A placeholder home page. The landing page (Aceternity UI) is its own issue.
export default function HomePage() {
  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">nativecn</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        shadcn for Expo apps. Components you copy into your app and own, the same on iOS and
        Android, built so AI agents can build and verify whole mobile apps.
      </p>
      <div className="mt-8 w-full max-w-md">
        <CopyCommand command="npx nativecn-cli@latest create my-app" />
      </div>
      <div className="mt-8 flex gap-3">
        <Link
          href="/docs"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Read the docs
        </Link>
        <Link
          href="/docs/installation"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Installation
        </Link>
      </div>
    </main>
  );
}
