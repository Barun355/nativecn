/**
 * The callback props (`onSomething`) of the component a Block exports, read from its
 * `<Component>Props` type in the Block's source, so the Showcase can wire a demo handler to each.
 */
export function callbackProps(source: string, component: string): string[] {
  const type = new RegExp(`export type ${component}Props\\b[\\s\\S]*?\\n};`).exec(source)?.[0];
  if (!type) return [];
  return [...new Set([...type.matchAll(/^\s+(on[A-Z]\w*)\??:/gm)].map((m) => m[1]!))];
}
