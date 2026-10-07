import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, screen, waitFor } from "@testing-library/react-native";
import * as SystemUI from "expo-system-ui";
import { Text } from "react-native";

import { colors } from "./colors";
import { ThemeProvider, createStyles, useTheme } from "./provider";
import { useSchemeStore } from "./scheme-store";

function Probe() {
  const t = useTheme();
  return <Text testID="probe">{`${t.scheme}|${t.colors.background}|${t.scale}`}</Text>;
}

describe("ThemeProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSchemeStore.setState({ scheme: "system", hydrated: true });
  });

  test("useTheme throws a clear error outside the provider", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<Probe />)).rejects.toThrow(/inside <ThemeProvider>/);
  });

  test("provides pre-scaled Tokens and Colour Roles", async () => {
    await render(
      <ThemeProvider scheme="light">
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("probe")).toBeTruthy());
    expect(screen.getByTestId("probe").props.children).toMatch(/^light\|#ffffff\|/);
  });

  test("setScheme switches Scheme and persists it under nativecn-theme", async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => useSchemeStore.getState().setScheme("dark"));
    await waitFor(() =>
      expect(screen.getByTestId("probe").props.children).toMatch(/^dark\|#0a0a0a\|/),
    );
    await waitFor(async () =>
      expect(await AsyncStorage.getItem("nativecn-theme")).toContain('"scheme":"dark"'),
    );
  });

  test("renders nothing until the persisted Scheme has loaded", async () => {
    useSchemeStore.setState({ hydrated: false });
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId("probe")).toBeNull();
  });
});

// #153: the window behind the app (the status bar and gesture bar strips on Android) follows the
// Theme's background; otherwise it stays white in dark mode.
describe("ThemeProvider: the window background", () => {
  const setBackground = jest.spyOn(SystemUI, "setBackgroundColorAsync");

  beforeEach(async () => {
    await AsyncStorage.clear();
    useSchemeStore.setState({ scheme: "light", hydrated: true });
    setBackground.mockClear().mockResolvedValue(undefined);
  });

  test("is the Scheme's background, and follows a Scheme change", async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(setBackground).toHaveBeenLastCalledWith(colors.light.background);
    await act(async () => useSchemeStore.getState().setScheme("dark"));
    expect(setBackground).toHaveBeenLastCalledWith(colors.dark.background);
  });

  test("a nested ThemeProvider (a dark hero, a preview) leaves it alone", async () => {
    await render(
      <ThemeProvider>
        <ThemeProvider scheme="dark">
          <Probe />
        </ThemeProvider>
      </ThemeProvider>,
    );
    expect(setBackground).toHaveBeenCalledWith(colors.light.background);
    expect(setBackground).not.toHaveBeenCalledWith(colors.dark.background);
  });
});

describe("createStyles", () => {
  test("builds styles once per (Scale, Scheme) and reuses them across renders", async () => {
    let calls = 0;
    const useStyles = createStyles((t) => {
      calls += 1;
      return { root: { padding: t.spacing[4], backgroundColor: t.colors.primary } };
    });
    useSchemeStore.setState({ scheme: "system", hydrated: true });
    const seen: object[] = [];
    function Box() {
      const s = useStyles();
      seen.push(s);
      return <Text>box</Text>;
    }
    const { rerender } = await render(
      <ThemeProvider scheme="light">
        <Box />
      </ThemeProvider>,
    );
    await rerender(
      <ThemeProvider scheme="light">
        <Box />
      </ThemeProvider>,
    );
    expect(calls).toBe(1);
    expect(seen[0]).toBe(seen[seen.length - 1]);
  });
});
