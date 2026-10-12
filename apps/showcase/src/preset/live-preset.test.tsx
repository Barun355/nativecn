import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, screen } from "@testing-library/react-native";
import * as SystemUI from "expo-system-ui";
import { StyleSheet, Text } from "react-native";

import { Button } from "@/registry/components/button";
import { getActiveStyle } from "@/registry/styles";
import { ThemeProvider, createStyles, tokens, useTheme } from "@/registry/theme";

import { LivePreset } from "./live-preset";
import { DEFAULT_PRESET, encodePreset, presetTheme, type Preset } from "./preset";
import { setPreset, usePresetStore } from "./store";

const NOVA_VIOLET: Preset = {
  style: "nova",
  baseColor: "zinc",
  accentColor: "violet",
  radius: "large",
  bodyFont: "lora",
  headingFont: "inter",
};

/** Shows the Theme values a Preset changes. */
function Probe() {
  const t = useTheme();
  return (
    <Text testID="probe">
      {[t.colors.primary, t.radius.lg / t.scale, t.type.body.fontFamily, t.type.h1.fontFamily].join(
        " ",
      )}
    </Text>
  );
}

async function renderLive() {
  await render(
    <ThemeProvider scheme="light">
      <LivePreset>
        <Probe />
      </LivePreset>
    </ThemeProvider>,
  );
  await screen.findByTestId("probe");
}

const probe = () => String(screen.getByTestId("probe").props.children).split(" ");

afterEach(async () => {
  await act(async () => setPreset(DEFAULT_PRESET));
});

test("the default Preset is the Theme's own", async () => {
  await renderLive();
  const [primary, radius, body, heading] = probe();
  expect(primary).toBe(presetTheme(DEFAULT_PRESET).colors.light.primary);
  expect(Number(radius)).toBeCloseTo(tokens.radiusBase, 0);
  expect(body).toBe("Inter-Regular");
  expect(heading).toBe("Inter-Bold");
});

test("a new Preset re-themes the app at once: colours, radius, fonts and Style", async () => {
  await renderLive();
  await act(async () => setPreset(NOVA_VIOLET));
  const [primary, radius, body, heading] = probe();
  expect(primary).toBe(presetTheme(NOVA_VIOLET).colors.light.primary);
  expect(Number(radius)).toBeCloseTo(14, 0);
  expect(body).toBe("Lora-Regular");
  expect(heading).toBe("Inter-Bold");
  expect(getActiveStyle()).toBe("nova");
});

test("Components rebuild their cached styles for the new Preset", async () => {
  await render(
    <ThemeProvider scheme="light">
      <LivePreset>
        <Button label="Save" />
      </LivePreset>
    </ThemeProvider>,
  );
  const radius = () =>
    StyleSheet.flatten(screen.getByRole("button", { name: "Save" }).props.style).borderRadius;
  const before = radius();
  await act(async () => setPreset({ ...DEFAULT_PRESET, radius: "large" }));
  // Vega's Button uses radius.md, the radius base less 2: 10 - 2, then 14 - 2 (before Scale).
  expect(radius()).toBeGreaterThan(before);
  expect(radius() / before).toBeCloseTo(12 / 8, 1);
});

// #153: the window behind the app (status and navigation bar strips) follows the Preset's
// background, not only the Scheme's.
test("the window background follows the Preset's base colour", async () => {
  await render(
    <ThemeProvider scheme="dark">
      <LivePreset>
        <Probe />
      </LivePreset>
    </ThemeProvider>,
  );
  await screen.findByTestId("probe");
  const zinc: Preset = { ...DEFAULT_PRESET, baseColor: "zinc" };
  await act(async () => setPreset(zinc));
  const background = presetTheme(zinc).colors.dark.background;
  expect(background).not.toBe(presetTheme(DEFAULT_PRESET).colors.dark.background);
  expect(SystemUI.setBackgroundColorAsync).toHaveBeenLastCalledWith(background);
});

// #156: the app is built with the React Compiler (jest.config.cjs runs this file with it too).
test("switching the Scheme after a colour change shows that Preset's colours for the new Scheme", async () => {
  const violet: Preset = { ...DEFAULT_PRESET, baseColor: "zinc", accentColor: "violet" };
  const yellow: Preset = { ...violet, accentColor: "yellow" };
  const app = (scheme: "light" | "dark") => (
    <ThemeProvider scheme={scheme}>
      <LivePreset>
        <Probe />
      </LivePreset>
    </ThemeProvider>
  );
  await render(app("light"));
  await screen.findByTestId("probe");
  await act(async () => setPreset(violet));
  expect(probe()[0]).toBe(presetTheme(violet).colors.light.primary);
  await act(async () => setPreset(yellow));
  expect(probe()[0]).toBe(presetTheme(yellow).colors.light.primary);
  await screen.rerender(app("dark"));
  expect(probe()[0]).toBe(presetTheme(yellow).colors.dark.primary);
});

test("cached Component styles are kept while neither the Preset nor the Theme changes", async () => {
  let builds = 0;
  const useStyles = createStyles((t) => {
    builds += 1;
    return { box: { borderRadius: t.radius.md } };
  });
  function Styled({ label }: { label: string }) {
    const styles = useStyles();
    return <Text style={styles.box}>{label}</Text>;
  }
  const app = (label: string) => (
    <ThemeProvider scheme="light">
      <LivePreset>
        <Styled label={label} />
      </LivePreset>
    </ThemeProvider>
  );
  await render(app("one"));
  await screen.findByText("one");
  const first = builds;
  // A re-render with the same Preset and Theme: the styles built for them still hold.
  await screen.rerender(app("two"));
  await screen.findByText("two");
  expect(builds).toBe(first);
  // A new Preset: rebuilt before the Component renders with it.
  await act(async () => setPreset({ ...DEFAULT_PRESET, radius: "large" }));
  expect(builds).toBe(first + 1);
});

// The compiler skips a component it cannot compile (a ref read during render, say), which would
// hide what the test above checks.
test("LivePreset is compiled whenever this file is", () => {
  const compiled = (fn: (...args: never[]) => unknown) => /\$\[\d+\]/.test(String(fn));
  expect(compiled(LivePreset)).toBe(compiled(Probe));
});

test("the Preset is kept on the device as its short code", async () => {
  await renderLive();
  await act(async () => setPreset(NOVA_VIOLET));
  const stored = JSON.parse((await AsyncStorage.getItem("nativecn-showcase-preset")) ?? "{}");
  expect(stored.state).toEqual({ code: encodePreset(NOVA_VIOLET) });
  expect(usePresetStore.getState().preset).toEqual(NOVA_VIOLET);
});
