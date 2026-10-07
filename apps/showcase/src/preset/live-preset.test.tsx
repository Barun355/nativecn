import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, screen } from "@testing-library/react-native";
import * as SystemUI from "expo-system-ui";
import { StyleSheet, Text } from "react-native";

import { Button } from "@/registry/components/button";
import { getActiveStyle } from "@/registry/styles";
import { ThemeProvider, tokens, useTheme } from "@/registry/theme";

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

test("the Preset is kept on the device as its short code", async () => {
  await renderLive();
  await act(async () => setPreset(NOVA_VIOLET));
  const stored = JSON.parse((await AsyncStorage.getItem("nativecn-showcase-preset")) ?? "{}");
  expect(stored.state).toEqual({ code: encodePreset(NOVA_VIOLET) });
  expect(usePresetStore.getState().preset).toEqual(NOVA_VIOLET);
});
