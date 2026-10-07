import fs from "node:fs";
import path from "node:path";

// #153: on Android a GestureHandlerRootView ignores `pointerEvents` (its view manager is not
// React Native's View manager), so one that fills the screen takes every tap, even "box-none".
// Registry code (overlays and Portal content above all) may only use a gesture root sized to what
// it wraps; the app-wide one belongs in the app's root Layout.
const root = path.resolve(__dirname, "..");
const folders = ["components", "primitives", "hooks", "screens", "theme", "utils"];

function sourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [file] : [];
  });
}

const files = folders.flatMap((folder) => sourceFiles(path.join(root, folder)));

test("finds the Registry sources", () => {
  expect(files.some((f) => f.endsWith(path.join("components", "toast.tsx")))).toBe(true);
});

test.each(files.map((f) => [path.relative(root, f), f]))(
  "%s: no full-screen or pointerEvents gesture root",
  (_name, file) => {
    const source = fs.readFileSync(file, "utf8");
    const tags = source.match(/<GestureHandlerRootView\b[^>]*>/g) ?? [];
    for (const tag of tags) {
      expect(tag).not.toMatch(/pointerEvents|absoluteFill|position:\s*["']absolute/);
    }
  },
);
