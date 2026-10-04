// The docs navigation: one list drives the sidebar, the pager, the search index and the routes.
// The hand-written pages are listed here; every Registry item adds its own page (item-pages.ts).
// No Node.js imports, but it carries every item's metadata: client components get the
// navigation as props from a server component rather than importing this module.
import { itemDocSections } from "./item-pages.ts";

export type DocPage = {
  /** URL segment under /docs; "" is the Introduction at /docs. */
  slug: string;
  title: string;
  description: string;
  /** The Registry item this page documents (generated pages only). */
  item?: string;
};

export type DocSection = { title: string; pages: DocPage[] };

/** The hand-written pages (MDX in content/docs, plus the generated changelog). */
export const guideNav: DocSection[] = [
  {
    title: "Getting Started",
    pages: [
      {
        slug: "",
        title: "Introduction",
        description:
          "nativecn is shadcn for Expo apps: Components you copy into your app and own, built so AI agents can build and verify whole mobile apps.",
      },
      {
        slug: "installation",
        title: "Installation",
        description: "Create a new Expo app with nativecn, or add nativecn to an existing one.",
      },
      {
        slug: "components-json",
        title: "components.json",
        description: "The project file that records your Preset, Structure, aliases and agents.",
      },
      {
        slug: "cli",
        title: "CLI",
        description: "Every nativecn-cli command and flag: init, create, add, agents and mcp.",
      },
      {
        slug: "changelog",
        title: "Changelog",
        description: "What changed in each nativecn release.",
      },
    ],
  },
  {
    title: "Concepts",
    pages: [
      {
        slug: "theming",
        title: "Theming",
        description: "Tokens, Colour Roles, Scale, Scheme, createStyles and fonts.",
      },
      {
        slug: "presets",
        title: "Presets & Styles",
        description:
          "Style, Base Colour, Accent Colour, Radius and fonts: chosen once, baked into your code.",
      },
      {
        slug: "folder-structure",
        title: "Folder structure",
        description: "Flat and feature Structures, Destinations and the placement rule.",
      },
      {
        slug: "ai-agents",
        title: "AI agents",
        description: "Rules, Skills, the nativecn MCP server, the Plugin and the Visual QA Loop.",
      },
    ],
  },
];

export const docsNav: DocSection[] = [...guideNav, ...itemDocSections];

/** The hand-written pages only. */
export const guideDocs: DocPage[] = guideNav.flatMap((section) => section.pages);

export const allDocs: DocPage[] = docsNav.flatMap((section) => section.pages);

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

export function findDoc(slug: string): DocPage | undefined {
  return allDocs.find((page) => page.slug === slug);
}

/** The previous and next pages in sidebar order, for the pager under each page. */
export function neighbours(slug: string): { prev?: DocPage; next?: DocPage } {
  const index = allDocs.findIndex((page) => page.slug === slug);
  if (index === -1) return {};
  return { prev: allDocs[index - 1], next: allDocs[index + 1] };
}
