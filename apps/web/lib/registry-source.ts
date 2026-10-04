// The Registry item definitions, read straight from packages/ui's `_registry.ts` files. They are
// plain data (their only import is a type), so the docs navigation can list every item without
// a Registry build, and the docs coverage test sees the same pages the site renders.
//
// One import per `_registry.ts`: registry-source.test.ts fails, naming the file, when the
// Registry build finds an item that is not listed here (e.g. a new `screens/_registry.ts`).
import type { RegistryItem } from "../../../packages/cli/src/registry.ts";
import components from "../../../packages/ui/components/_registry.ts";
import primitives from "../../../packages/ui/components/primitives/_registry.ts";
import hooks from "../../../packages/ui/hooks/_registry.ts";
import screens from "../../../packages/ui/screens/_registry.ts";
import theme from "../../../packages/ui/theme/_registry.ts";
import utils from "../../../packages/ui/utils/_registry.ts";

/** Every Registry item definition (without built file contents), in definition order. */
export const sourceItems: RegistryItem[] = [
  ...components,
  ...primitives,
  ...hooks,
  ...screens,
  ...theme,
  ...utils,
] as RegistryItem[];
