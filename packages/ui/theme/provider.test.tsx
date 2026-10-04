import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

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
