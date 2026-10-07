// The whole Showcase App, rendered by Expo Router from src/app: every tab, every Registry Item's
// route (with its live examples), every Block, and the `nativecn://preset/<code>` deep link.
import path from "node:path";

import { router } from "expo-router";
import { store } from "expo-router/build/global-state/router-store";
import { act, renderRouter, screen } from "expo-router/testing-library";

import { showcaseHref } from "@/catalog";
import { DEFAULT_PRESET, encodePreset, type Preset } from "@/preset/preset";
import { setPreset, usePresetStore } from "@/preset/store";
import { registryIndex } from "@/registry-index";

// Jest can't run dynamic import() without --experimental-vm-modules: load each item with require.
jest.mock("@/registry-index", () => {
  const actual = jest.requireActual("@/registry-index");
  const index: Record<string, { module: string }> = actual.registryIndex;
  return {
    registryIndex: Object.fromEntries(
      Object.entries(index).map(([name, entry]) => [
        name,
        { ...entry, load: async () => jest.requireActual(entry.module) },
      ]),
    ),
  };
});

// expo-router/testing-library swaps Reanimated for its mock, which lacks useReducedMotion.
const reanimatedMock = jest.requireActual("react-native-reanimated/mock");
reanimatedMock.useReducedMotion ??= () => false;

// The first render compiles the whole app and every Registry Item.
jest.setTimeout(120_000);

const APP = path.resolve(__dirname, "..", "src", "app");

const NOVA_VIOLET: Preset = {
  style: "nova",
  baseColor: "zinc",
  accentColor: "violet",
  radius: "large",
  bodyFont: "lora",
  headingFont: "inter",
};

/** The current route's pathname (renderRouter's own helpers don't survive RNTL 14's async render). */
const pathname = () => store.getRouteInfo().pathname;

/** Render the app at a URL and let lazy-loaded Registry source and effects settle. */
async function open(url: string) {
  await renderRouter(APP, { initialUrl: url });
  // Lazy imports and the stored Preset resolve as microtasks (timers may be fake here).
  for (let i = 0; i < 5; i++) await act(async () => {});
}

const FAILED = /Couldn't load|No item named|No Block named/;

afterEach(async () => {
  await act(async () => setPreset(DEFAULT_PRESET));
});

test.each([
  ["/", "Components"],
  ["/blocks", "Blocks"],
  ["/theme", "Theme"],
  ["/ai", "Built for AI"],
])("the %s tab renders", async (url, title) => {
  await open(url);
  expect(screen.getAllByText(title).length).toBeGreaterThan(0);
  // One title per tab: the Screen's own h1, no navigator header above it (#153).
  expect(screen.getAllByRole("heading", { name: title })).toHaveLength(1);
});

test("the Components tab lists every Component", async () => {
  await open("/");
  for (const entry of Object.values(registryIndex).filter((e) => e.kind === "Component"))
    expect(screen.getAllByText(entry.title).length).toBeGreaterThan(0);
});

test("the Blocks tab lists every Block", async () => {
  await open("/blocks");
  for (const [name, entry] of Object.entries(registryIndex).filter(([, e]) => e.kind === "Block"))
    expect(screen.getByText(`${name}: ${entry.title}`)).toBeTruthy();
});

describe("every Registry Item opens on its route, examples included", () => {
  const items = Object.keys(registryIndex).filter(
    (name) => registryIndex[name]!.type !== "registry:example",
  );
  test.each(items)("%s", async (name) => {
    const href = showcaseHref(registryIndex, name)!;
    await open(href);
    expect(pathname()).toBe(href);
    expect(screen.queryByText(FAILED)).toBeNull();
    // A Block's route shows the Block itself, not the loading Spinner.
    if (registryIndex[name]!.kind === "Block") {
      expect(screen.queryByLabelText("Loading")).toBeNull();
    }
  });
});

test.each([
  "/feedback",
  "/starter",
  "/visual-qa",
  "/licenses",
  "/tabs-demo",
  "/drawers/drawer-demo",
  "/example/container-demo",
])("%s renders", async (url) => {
  await open(url);
  expect(pathname()).toBe(url);
  expect(screen.queryByText(FAILED)).toBeNull();
});

test("a drawer Block's items navigate inside the drawer Layout", async () => {
  await open("/inbox");
  expect(pathname()).toBe("/inbox");
  expect(screen.getAllByText("Inbox").length).toBeGreaterThan(0);
  expect(screen.getByText("Open the menu")).toBeTruthy();
});

test("a nativecn://preset/<code> link applies the Preset and opens the Theme tab", async () => {
  const code = encodePreset(NOVA_VIOLET);
  await open(`/preset/${code}`);
  expect(usePresetStore.getState().preset).toEqual(NOVA_VIOLET);
  expect(pathname()).toBe("/theme");
  expect(screen.getAllByText(`Preset ${code}`).length).toBeGreaterThan(0);
});

test("a link opened from cold start leaves the tabs, not a blank Screen, behind it", async () => {
  // The root Stack, under Expo Router's own __root route.
  const rootRoutes = () => store.state?.routes[0]?.state?.routes.map((r) => r.name);
  await open(`/preset/${encodePreset(NOVA_VIOLET)}`);
  expect(rootRoutes()).toEqual(["(tabs)"]);
  await open("/block/sign-in-01");
  expect(rootRoutes()).toEqual(["(tabs)", "block/[name]"]);
  await act(async () => router.back());
  expect(pathname()).toBe("/");
});

test("an invalid code leaves the Preset as it was", async () => {
  await open("/preset/not-a-code");
  expect(usePresetStore.getState().preset).toEqual(DEFAULT_PRESET);
  expect(pathname()).toBe("/theme");
});
