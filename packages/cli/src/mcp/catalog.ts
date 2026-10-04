// Pure helpers over a Style's registry.json index: kinds, search, examples and Block Variants.
import type { RegistryIndexItem, RegistryItem } from "../registry.ts";

export type Kind = "Component" | "Primitive" | "Block" | "Helper" | "Theme" | "Example";

const targets = (item: RegistryIndexItem | RegistryItem) => (item.files ?? []).map((f) => f.target);

/** What an item is, in nativecn's language (Registry layout, #13). */
export function kindOf(item: RegistryIndexItem | RegistryItem): Kind {
  const kind = item.meta?.kind;
  if (
    typeof kind === "string" &&
    ["Component", "Primitive", "Block", "Helper", "Theme"].includes(kind)
  )
    return kind as Kind;
  switch (item.type) {
    case "registry:block":
      return "Block";
    case "registry:example":
      return "Example";
    case "registry:hook":
      return "Primitive";
    case "registry:theme":
    case "registry:style":
      return "Theme";
    case "registry:lib":
      return item.name === "theme" || targets(item).some((t) => t.startsWith("{theme}"))
        ? "Theme"
        : "Helper";
    default:
      return targets(item).some((t) => t.startsWith("{components}/primitives/"))
        ? "Primitive"
        : "Component";
  }
}

/** A Screen Block installs into {screens} and gets a route; a Drawer Block installs into {components}. */
export function isScreenBlock(item: RegistryIndexItem | RegistryItem): boolean {
  return targets(item).some((t) => t.startsWith("{screens}"));
}

export type ItemSummary = {
  name: string;
  kind: Kind;
  type: string;
  title?: string;
  description?: string;
  categories?: string[];
};

export function summarize(item: RegistryIndexItem): ItemSummary {
  return {
    name: item.name,
    kind: kindOf(item),
    type: item.type,
    ...(item.title ? { title: item.title } : {}),
    ...(item.description ? { description: item.description } : {}),
    ...(item.categories?.length ? { categories: item.categories } : {}),
  };
}

const words = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0);

const keywordsOf = (item: RegistryIndexItem): string[] =>
  Array.isArray(item.meta?.keywords) ? (item.meta.keywords as unknown[]).map(String) : [];

/** Score an item against a free-text query: name hits count most, then title, keywords, categories, description. */
export function score(item: RegistryIndexItem, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  if (item.name === q.replace(/\s+/g, "-")) return 100;
  const name = words(item.name);
  const fields: [string[], number][] = [
    [name, 4],
    [words(item.title ?? ""), 3],
    [keywordsOf(item).flatMap(words), 3],
    [(item.categories ?? []).flatMap(words), 2],
    [words(item.description ?? ""), 1],
  ];
  let total = 0;
  for (const token of words(q)) {
    let best = 0;
    for (const [list, weight] of fields) {
      if (list.includes(token)) best = Math.max(best, weight);
      else if (
        token.length >= 3 &&
        list.some((w) => w.startsWith(token) || (w.length >= 3 && token.startsWith(w)))
      )
        best = Math.max(best, weight / 2);
    }
    total += best;
  }
  if (item.name.includes(q.replace(/\s+/g, "-"))) total += 5;
  return total;
}

export function search(items: RegistryIndexItem[], query: string): RegistryIndexItem[] {
  return items
    .map((item) => ({ item, s: score(item, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.item.name.localeCompare(b.item.name))
    .map((x) => x.item);
}

/**
 * Example items for a query. Examples are `registry:example` items (shadcn's `<item>-demo`
 * convention), or an item's `meta.examples` list of example item names.
 */
export function findExamples(items: RegistryIndexItem[], query: string): string[] {
  const q = query.trim().toLowerCase();
  const examples = items.filter((i) => kindOf(i) === "Example");
  const byName = new Map(items.map((i) => [i.name, i]));
  const out: string[] = [];
  const push = (n: string) => {
    if (byName.has(n) && !out.includes(n)) out.push(n);
  };
  // An item named directly (or with "demo"/"example" words around it).
  const stripped = words(q)
    .filter((w) => !["demo", "demos", "example", "examples", "usage"].includes(w))
    .join("-");
  for (const candidate of [q, stripped]) {
    const item = byName.get(candidate);
    if (!item) continue;
    if (kindOf(item) === "Example") push(item.name);
    const listed = item.meta?.examples;
    if (Array.isArray(listed)) for (const n of listed) if (typeof n === "string") push(n);
    for (const e of examples) if (e.name.startsWith(`${item.name}-`)) push(e.name);
  }
  for (const e of search(examples, q)) push(e.name);
  return out;
}

const PURPOSE_ALIASES: Record<string, string> = {
  login: "sign-in",
  signin: "sign-in",
  "log-in": "sign-in",
  signup: "sign-up",
  register: "sign-up",
  registration: "sign-up",
  "create-account": "sign-up",
  menu: "drawer",
  sidebar: "drawer",
  "side-menu": "drawer",
  navigation: "drawer",
};

/** The purpose a Block serves: its name without the variant number (sign-in-02 → sign-in). */
export const purposeOf = (item: RegistryIndexItem) => item.name.replace(/-\d+$/, "");

export function blockPurposes(items: RegistryIndexItem[]): string[] {
  return [...new Set(items.filter((i) => kindOf(i) === "Block").map(purposeOf))].sort();
}

/** Blocks serving a purpose: matched on the purpose itself (sign-in), its category (auth) or an alias (login). */
export function blockVariants(items: RegistryIndexItem[], purpose: string): RegistryIndexItem[] {
  const p = words(purpose).join("-");
  const wanted = PURPOSE_ALIASES[p] ?? p;
  const blocks = items.filter((i) => kindOf(i) === "Block");
  const byPurpose = blocks.filter((b) => purposeOf(b) === wanted);
  if (byPurpose.length) return byPurpose;
  const byCategory = blocks.filter((b) => (b.categories ?? []).includes(wanted));
  if (byCategory.length) return byCategory;
  return search(blocks, purpose);
}

function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        prev[j]! + 1,
        row[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    prev = row;
  }
  return prev[b.length]!;
}

/** Names close to a mistyped one: small edit distance first, then search hits. */
export function suggest(items: RegistryIndexItem[], name: string, max = 3): string[] {
  const pool = items.filter((i) => kindOf(i) !== "Example");
  const near = pool
    .map((i) => ({ n: i.name, d: distance(i.name, name) }))
    .filter((x) => x.d <= 2)
    .sort((a, b) => a.d - b.d)
    .map((x) => x.n);
  const hits = search(pool, name.replace(/-/g, " ")).map((i) => i.name);
  return [...new Set([...near, ...hits])].slice(0, max);
}

/** Screenshot links for a Block: `meta.screenshots` (list or { light, dark }) or `meta.screenshot`. */
export function screenshotsOf(item: RegistryIndexItem): Record<string, string> | undefined {
  const meta = item.meta ?? {};
  const out: Record<string, string> = {};
  const shots = meta.screenshots;
  if (Array.isArray(shots)) {
    for (const [i, s] of shots.entries()) if (typeof s === "string") out[`${i + 1}`] = s;
  } else if (shots && typeof shots === "object")
    for (const [k, v] of Object.entries(shots)) if (typeof v === "string") out[k] = v;
  if (typeof meta.screenshot === "string") out.default = meta.screenshot;
  return Object.keys(out).length ? out : undefined;
}
