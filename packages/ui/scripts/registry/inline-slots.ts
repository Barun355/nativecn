import ts from "typescript";

/** Slot name → the fill's parameter name and its returned object expression (source text). */
export type SlotFills = Map<string, { param: string | null; body: string }>;

/** Read a Style file (`styles/<style>.ts`) and collect each Slot's fill without evaluating it. */
export function readSlotFills(styleSource: string, fileName = "style.ts"): SlotFills {
  const sf = ts.createSourceFile(
    fileName,
    styleSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const fills: SlotFills = new Map();
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "defineStyle"
    ) {
      let arg = node.arguments[0];
      while (
        arg &&
        (ts.isSatisfiesExpression(arg) ||
          ts.isAsExpression(arg) ||
          ts.isParenthesizedExpression(arg))
      ) {
        arg = arg.expression;
      }
      if (!arg || !ts.isObjectLiteralExpression(arg))
        throw new Error(`${fileName}: defineStyle() needs an object literal`);
      for (const prop of arg.properties) {
        if (!ts.isPropertyAssignment(prop) || !ts.isArrowFunction(prop.initializer)) {
          throw new Error(`${fileName}: every Slot must be "name": (t) => ({ ... })`);
        }
        const name =
          ts.isStringLiteral(prop.name) || ts.isIdentifier(prop.name)
            ? prop.name.text
            : prop.name.getText(sf);
        const fn = prop.initializer;
        let body: ts.Node = fn.body;
        while (ts.isParenthesizedExpression(body)) body = body.expression;
        if (!ts.isObjectLiteralExpression(body))
          throw new Error(`${fileName}: Slot "${name}" must return an object literal`);
        const param =
          fn.parameters[0] && ts.isIdentifier(fn.parameters[0].name)
            ? fn.parameters[0].name.text
            : null;
        fills.set(name, { param, body: renameParam(body, param, "__THEME__", sf) });
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (fills.size === 0) throw new Error(`${fileName}: no defineStyle({...}) found`);
  return fills;
}

/** Replace references to the fill's parameter (not property names) with a placeholder. */
function renameParam(body: ts.Node, param: string | null, to: string, sf: ts.SourceFile): string {
  const text = body.getText(sf);
  if (!param) return text;
  const start = body.getStart(sf);
  const edits: { pos: number; end: number }[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isIdentifier(n) && n.text === param) {
      const p = n.parent;
      const isPropertyName =
        (ts.isPropertyAccessExpression(p) && p.name === n) ||
        (ts.isPropertyAssignment(p) && p.name === n) ||
        ts.isShorthandPropertyAssignment(p);
      if (!isPropertyName) edits.push({ pos: n.getStart(sf) - start, end: n.getEnd() - start });
    }
    ts.forEachChild(n, visit);
  };
  visit(body);
  let out = text;
  for (const e of edits.sort((a, b) => b.pos - a.pos))
    out = out.slice(0, e.pos) + to + out.slice(e.end);
  return out;
}

/** Whether the source still calls `slot(...)` (comments and strings that mention it don't count). */
export function hasSlotCall(source: string, fileName = "file.tsx"): boolean {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "slot"
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

/**
 * Replace every `slot("name", arg)` call in a Component source with the active Style's literal
 * object, and drop the `slot` import. Throws on unknown Slots or a remaining slot() call.
 */
export function inlineSlots(source: string, fills: SlotFills, fileName: string): string {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: { pos: number; end: number; text: string }[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "slot"
    ) {
      const [nameArg, themeArg] = node.arguments;
      if (!nameArg || !ts.isStringLiteralLike(nameArg))
        throw new Error(`${fileName}: slot() needs a string literal Slot name`);
      const fill = fills.get(nameArg.text);
      if (!fill) throw new Error(`${fileName}: unknown Slot "${nameArg.text}"`);
      const themeText = themeArg ? themeArg.getText(sf) : "";
      if (fill.param && !themeText)
        throw new Error(`${fileName}: slot("${nameArg.text}") needs the theme argument`);
      edits.push({
        pos: node.getStart(sf),
        end: node.getEnd(),
        text: fill.body.replaceAll("__THEME__", themeText),
      });
      return;
    }
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "@/registry/styles"
    ) {
      const named = node.importClause?.namedBindings;
      const others =
        named && ts.isNamedImports(named)
          ? named.elements.filter((e) => e.name.text !== "slot")
          : [];
      const end = source[node.getEnd()] === "\n" ? node.getEnd() + 1 : node.getEnd();
      edits.push({
        pos: node.getStart(sf),
        end,
        text: others.length
          ? `import { ${others.map((e) => e.getText(sf)).join(", ")} } from "@/registry/styles";\n`
          : "",
      });
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  let out = source;
  for (const e of edits.sort((a, b) => b.pos - a.pos))
    out = out.slice(0, e.pos) + e.text + out.slice(e.end);
  if (hasSlotCall(out, fileName)) throw new Error(`${fileName}: slot() left after inlining`);
  if (out.includes("@/registry/styles") || out.includes("@/registry/presets")) {
    throw new Error(
      `${fileName}: imports repo-only code (@/registry/styles or @/registry/presets)`,
    );
  }
  return out;
}
