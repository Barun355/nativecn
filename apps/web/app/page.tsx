import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { CopyCommand } from "@/components/copy-command";
import { ReducedMotion } from "@/components/reduced-motion";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { Spotlight } from "@/components/ui/spotlight-new";
import {
  ACCENT_COLORS,
  ACCENT_SWATCHES,
  BASE_COLORS,
  CREATE_COMMAND,
  DEFAULT_PRESET_CODE,
  EXAMPLE_PRESET_CODE,
  FONT_GROUPS,
  GITHUB_URL,
  MCP_TOOLS,
  SKILLS,
  STYLE_OPTIONS,
} from "@/lib/landing";

// The nativecn.dev landing page (issue #61, decision #27), built from free Aceternity UI
// components in components/ui. The Showcase App screens are a TODO until the app exists.
export default function HomePage() {
  return (
    <ReducedMotion>
      <main id="main" className="overflow-x-clip">
        <Hero />
        <Ownership />
        <Presets />
        <AgentKit />
        <ExpoFirst />
        <Showcase />
        <GetStarted />
      </main>
      <SiteFooter />
    </ReducedMotion>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden border-b bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:48px_48px]"
    >
      {/* Fades the grid out towards the edges so the copy stays readable. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black_75%)]"
      />
      <Spotlight
        gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 70%, .12) 0, hsla(210, 100%, 55%, .04) 50%, hsla(210, 100%, 45%, 0) 80%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 70%, .08) 0, hsla(210, 100%, 55%, .03) 80%, transparent 100%)"
        gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 70%, .06) 0, hsla(210, 100%, 45%, .02) 80%, transparent 100%)"
      />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 pb-24 pt-20 text-center sm:pt-28">
        <p className="rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          Expo SDK 57+ · iOS &amp; Android · Open source
        </p>
        <h1
          id="hero-title"
          className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl"
        >
          shadcn for Expo,
          <br className="hidden sm:block" /> built for AI agents
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          Components and Screens you copy into your Expo app and own, the same on iOS and Android.
          Every project ships with Rules, Skills and an MCP server, so your agent can build a whole
          mobile app and check it on a real device.
        </p>
        <div className="mt-10 w-full max-w-lg">
          <CopyCommand command={CREATE_COMMAND} />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs"
            className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Read the docs
          </Link>
          <a
            href={GITHUB_URL}
            className="inline-flex items-center gap-2 rounded-md border bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <GitHubIcon />
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-pretty text-muted-foreground">{children}</p>
    </div>
  );
}

const OWNERSHIP = [
  {
    title: "Your code, not a dependency",
    description:
      "nativecn-cli copies each Component's source into your app. Edit any line; there is no runtime package to upgrade around.",
    link: "/docs",
  },
  {
    title: "Plain React Native",
    description:
      "StyleSheet plus a TypeScript Theme. No Tailwind, NativeWind or className, and no build-time CSS step.",
    link: "/docs/theming",
  },
  {
    title: "One Theme, both platforms",
    description:
      "Every Component reads Tokens from your Theme and never hard-codes a colour or size, so iOS and Android match.",
    link: "/docs/theming",
  },
  {
    title: "Whole Screens as Blocks",
    description:
      "Pre-designed Screens such as sign-in, in several Block Variants, installed at the route you choose.",
    link: "/docs/cli#screen-blocks",
  },
  {
    title: "Its own Primitives",
    description:
      "Dialogs, sheets, pickers and menus are written by nativecn, so they follow your Theme and you can edit them.",
    link: "/docs",
  },
  {
    title: "Your folder structure",
    description:
      "Flat or feature folders, recorded in components.json. add writes every file where it belongs.",
    link: "/docs/folder-structure",
  },
];

function Ownership() {
  return (
    <section aria-labelledby="ownership-title" className="mx-auto max-w-6xl px-4 py-24">
      <SectionHeading id="ownership-title" eyebrow="Copy, paste, own it" title="Not a library">
        Like shadcn, nativecn is a way to build your own components. You run the CLI and the source
        lands in your project, ready to change.
      </SectionHeading>
      <HoverEffect items={OWNERSHIP} />
    </section>
  );
}

function Presets() {
  return (
    <section aria-labelledby="presets-title" className="border-y bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHeading id="presets-title" eyebrow="Presets" title="Your look, chosen once">
          A Preset is a Style, a Base Colour, an Accent Colour, a Radius and fonts. You pick it at
          create, it is baked into your code, and it stays fixed for the life of the project.
        </SectionHeading>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {STYLE_OPTIONS.map((style) => (
                <div key={style.id} className="rounded-xl border bg-background p-5">
                  <h3 className="font-semibold">{style.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{style.summary}</p>
                  <StyleSample compact={style.id === "nova"} />
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-background p-5">
              <h3 className="font-semibold">Colours</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {BASE_COLORS.length} Base Colours × {ACCENT_COLORS.length} Accent Colours, every
                pairing checked for WCAG AA contrast in light and dark.
              </p>
              <ul
                className="mt-4 grid grid-cols-8 gap-2 sm:grid-cols-12"
                aria-label="Accent Colours"
              >
                {ACCENT_COLORS.map((accent) => (
                  <li key={accent} title={accent}>
                    <span
                      className="block aspect-square rounded-full border border-black/10 bg-(--swatch-light) dark:border-white/15 dark:bg-(--swatch-dark)"
                      style={
                        {
                          "--swatch-light": ACCENT_SWATCHES[accent].light,
                          "--swatch-dark": ACCENT_SWATCHES[accent].dark,
                        } as CSSProperties
                      }
                    />
                    <span className="sr-only">{accent}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                Base Colours: {BASE_COLORS.join(", ")}.
              </p>
            </div>

            <div className="rounded-xl border bg-background p-5">
              <h3 className="font-semibold">Fonts</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A Body Font and an optional Heading Font. Only the fonts you choose are added to
                your app.
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                {FONT_GROUPS.map((group) => (
                  <div key={group.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </dt>
                    <dd className="mt-1 text-sm">{group.fonts.join(", ")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="flex min-w-0 flex-col rounded-xl border bg-neutral-950 p-5 text-neutral-100 dark:bg-neutral-900">
            <h3 className="font-semibold">One short code</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Share a Preset as a code, or spell it out as flags. Settings you leave out take their
              defaults.
            </p>
            <pre
              tabIndex={0}
              aria-label="Preset examples"
              className="mt-5 flex-1 overflow-x-auto rounded-lg bg-black/40 p-4 font-mono text-[13px] leading-6"
            >
              <code>
                <span className="text-neutral-500">
                  # Vega · neutral · neutral · Inter (the default)
                </span>
                {`\nnpx nativecn-cli@latest create my-app --preset ${DEFAULT_PRESET_CODE}\n\n`}
                <span className="text-neutral-500"># Nova · violet accent · Lora headings</span>
                {`\nnpx nativecn-cli@latest create my-app --preset ${EXAMPLE_PRESET_CODE}\n\n`}
                <span className="text-neutral-500"># the same Preset, as long flags</span>
                {
                  "\nnpx nativecn-cli@latest create my-app \\\n  --style nova --accent violet --heading-font lora"
                }
              </code>
            </pre>
            <Link
              href="/docs/presets"
              className="mt-5 self-start rounded-md text-sm font-medium underline underline-offset-4 hover:text-white"
            >
              Presets &amp; Styles in the docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A tiny sketch of a form in each Style: Nova is denser than Vega. */
function StyleSample({ compact }: { compact: boolean }) {
  const field = compact ? "h-7 rounded-md" : "h-9 rounded-lg";
  return (
    <div aria-hidden="true" className={`mt-4 flex flex-col ${compact ? "gap-1.5" : "gap-2.5"}`}>
      <div className={`${field} border bg-muted/50`} />
      <div className={`${field} border bg-muted/50`} />
      <div className={`${field} bg-foreground`} />
    </div>
  );
}

function AgentKit() {
  return (
    <section aria-labelledby="agents-title" className="mx-auto max-w-6xl px-4 py-24">
      <SectionHeading id="agents-title" eyebrow="AI-native" title="The Agent Kit">
        create and init write the Agent Kit for Claude Code, Codex, Cursor and Antigravity, so your
        agent knows what exists, how to add it and how to check the result.
      </SectionHeading>
      <BentoGrid className="mt-14">
        <BentoGridItem
          title="Rules"
          description="Twelve Rules in AGENTS.md: Tokens only, no platform alerts, Expo Router navigation, safe storage, the placement rule and accessibility."
          header={
            <CardHeader>
              <p className="text-muted-foreground"># AGENTS.md</p>
              <p>1. Tokens only, via createStyles</p>
              <p>3. Never Alert.alert, use toast()</p>
              <p>8. The Preset is fixed</p>
              <p className="text-muted-foreground">…</p>
            </CardHeader>
          }
          icon={<KitIcon d="M9 12h6M9 16h6M9 8h2M6 3h9l3 3v15H6z" />}
        />
        <BentoGridItem
          className="md:col-span-2"
          title="Five Skills"
          description="Task-sized instructions for setting up a project, building a Screen, theming, authoring Components and running Visual QA."
          header={
            <CardHeader>
              <ul className="flex flex-wrap gap-2" aria-label="Skills">
                {SKILLS.map((skill) => (
                  <li key={skill} className="rounded-md border bg-background px-2 py-1">
                    {skill}
                  </li>
                ))}
              </ul>
            </CardHeader>
          }
          icon={<KitIcon d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8l5.5-.8z" />}
        />
        <BentoGridItem
          className="md:col-span-2"
          title="The nativecn MCP server"
          description="Read-only tools that list and search Components, Blocks and Block Variants, give the exact add command, build Preset codes and return a post-change audit checklist. Local over stdio, or remote at nativecn.dev/mcp."
          header={
            <CardHeader>
              <ul className="flex flex-wrap gap-2" aria-label="MCP tools">
                {MCP_TOOLS.map((tool) => (
                  <li key={tool} className="rounded-md border bg-background px-2 py-1">
                    {tool}
                  </li>
                ))}
              </ul>
            </CardHeader>
          }
          icon={<KitIcon d="M4 7h16M4 12h16M4 17h10M18 15l3 2-3 2" />}
        />
        <BentoGridItem
          title="Visual QA Loop"
          description="Your agent opens each Screen on a device, screenshots it, judges it against your design, fixes small visual problems and reports the rest."
          header={
            <CardHeader>
              <ol className="flex flex-wrap items-center gap-1.5" aria-label="Visual QA steps">
                {["navigate", "screenshot", "judge", "fix or report"].map((step, i) => (
                  <li key={step} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span aria-hidden="true" className="text-muted-foreground">
                        →
                      </span>
                    )}
                    <span className="rounded-md border bg-background px-2 py-1">{step}</span>
                  </li>
                ))}
              </ol>
            </CardHeader>
          }
          icon={
            <KitIcon d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M8 12l3 3 5-6" />
          }
        />
      </BentoGrid>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Read{" "}
        <Link
          href="/docs/ai-agents"
          className="font-medium text-foreground underline underline-offset-4"
        >
          AI agents
        </Link>{" "}
        for the full Rules, Skills and tools.
      </p>
    </section>
  );
}

function CardHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-28 flex-col gap-1 rounded-lg border bg-muted/50 p-3 font-mono text-xs">
      {children}
    </div>
  );
}

function KitIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 text-muted-foreground"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const EXPO_FACTS = [
  { title: "Expo SDK 57+", body: "SDK 57 is the support floor, with Expo Router for navigation." },
  { title: "iOS & Android", body: "One Theme and one set of Components, the same on both." },
  { title: "Expo's own layout", body: "src/components, src/hooks and your app/ routes." },
  { title: "Few dependencies", body: "The Expo SDK's pinned modules, plus a short recorded list." },
];

function ExpoFirst() {
  return (
    <section aria-labelledby="expo-title" className="border-y bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHeading id="expo-title" eyebrow="Expo-first" title="Made for Expo apps">
          nativecn follows shadcn wherever it can and Expo&apos;s conventions wherever it must. Bare
          React Native apps are not supported.
        </SectionHeading>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPO_FACTS.map((fact) => (
            <li key={fact.title} className="rounded-xl border bg-background p-5">
              <h3 className="font-semibold">{fact.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{fact.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Showcase() {
  // TODO(#27): replace these placeholders with real Showcase App screenshots (captured on
  // physical devices, light and dark, with alt text) once apps/showcase has its screens.
  return (
    <section aria-labelledby="showcase-title" className="mx-auto max-w-6xl px-4 py-24">
      <SectionHeading id="showcase-title" eyebrow="Showcase App" title="See it on a phone">
        The Showcase App is a complete app built with nativecn, demonstrating every Component.
      </SectionHeading>
      <div className="mt-14 rounded-2xl border-2 border-dashed p-6 sm:p-10">
        <p className="text-center text-sm font-medium text-muted-foreground">
          <span className="mr-2 rounded bg-foreground px-1.5 py-0.5 text-xs font-semibold text-background">
            TODO
          </span>
          Showcase App screenshots are coming soon.
        </p>
        <div aria-hidden="true" className="mt-8 flex justify-center gap-4 sm:gap-8">
          {["sm:block", "", "sm:block"].map((visibility, i) => (
            <div
              key={i}
              className={`${visibility ? `hidden ${visibility}` : ""} aspect-[9/19] w-36 rounded-[2rem] border-4 bg-muted/60 sm:w-44`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function GetStarted() {
  return (
    <section aria-labelledby="start-title" className="border-t">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        <h2 id="start-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
          Start a new app
        </h2>
        <p className="mt-4 text-muted-foreground">
          Or set nativecn up in an existing Expo app with{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">init</code>.
        </p>
        <div className="mt-8 w-full max-w-lg">
          <CopyCommand command={CREATE_COMMAND} />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs/installation"
            className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Installation
          </Link>
          <a
            href={GITHUB_URL}
            className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <GitHubIcon />
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          nativecn is open source under the MIT licence.{" "}
          <a href={GITHUB_URL} className="underline underline-offset-4 hover:text-foreground">
            Source on GitHub
          </a>
          .
        </p>
        <p>
          Landing page built with{" "}
          <a
            href="https://ui.aceternity.com"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Aceternity UI
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
