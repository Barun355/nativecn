import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Appearance, StyleSheet, Text } from "react-native";

import { SchemeSwitcher, type SchemeSwitcherProps } from "@/registry/components/scheme-switcher";
import { ThemeProvider, useSchemeStore, useTheme } from "@/registry/theme";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light" },
}));

// The Scheme icons become marked Views, so the shown icon can be identified.
jest.mock("lucide-react-native", () => {
  const actual = jest.requireActual("lucide-react-native");
  const { View: RNView } = jest.requireActual("react-native");
  return {
    ...actual,
    Smartphone: () => <RNView testID="icon-system" />,
    Sun: () => <RNView testID="icon-light" />,
    Moon: () => <RNView testID="icon-dark" />,
  };
});

const hidden = { includeHiddenElements: true } as const;

/** Shows the resolved Scheme the rest of the app sees. */
function SchemeProbe() {
  const { scheme, schemePreference } = useTheme();
  return <Text testID="probe">{`${schemePreference}:${scheme}`}</Text>;
}

async function renderSwitcher(props: SchemeSwitcherProps = {}) {
  await render(
    <ThemeProvider>
      <SchemeSwitcher testID="switcher" {...props} />
      <SchemeProbe />
    </ThemeProvider>,
  );
}

const persisted = async () => {
  const raw = await AsyncStorage.getItem("nativecn-theme");
  return raw ? (JSON.parse(raw) as { state: { scheme: string } }).state.scheme : undefined;
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.spyOn(Appearance, "setColorScheme");
});

afterEach(() => jest.mocked(Appearance.setColorScheme).mockRestore());

describe("SchemeSwitcher: segmented (default)", () => {
  test("System, Light and Dark tabs, the current preference selected", async () => {
    useSchemeStore.setState({ scheme: "dark" });
    await renderSwitcher();
    expect(screen.getByLabelText("Theme").props.role).toBe("tablist");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Dark" })).toBeSelected();
    expect(screen.getByRole("tab", { name: "System" })).not.toBeSelected();
    for (const icon of ["icon-system", "icon-light", "icon-dark"])
      expect(screen.getByTestId(icon, hidden)).toBeTruthy();
  });

  test("picking a Scheme sets it app-wide, persists it and updates native chrome", async () => {
    await renderSwitcher();
    expect(screen.getByRole("tab", { name: "System" })).toBeSelected();

    await fireEvent.press(screen.getByRole("tab", { name: "Dark" }));
    expect(useSchemeStore.getState().scheme).toBe("dark");
    expect(screen.getByRole("tab", { name: "Dark" })).toBeSelected();
    expect(screen.getByTestId("probe")).toHaveTextContent("dark:dark");
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith("dark");
    await waitFor(async () => expect(await persisted()).toBe("dark"));

    await fireEvent.press(screen.getByRole("tab", { name: "Light" }));
    expect(screen.getByTestId("probe")).toHaveTextContent("light:light");
    await waitFor(async () => expect(await persisted()).toBe("light"));
  });

  test("follows a Scheme set elsewhere", async () => {
    await renderSwitcher();
    await act(() => useSchemeStore.getState().setScheme("light"));
    expect(screen.getByRole("tab", { name: "Light" })).toBeSelected();
  });

  test("disabled blocks changes", async () => {
    await renderSwitcher({ disabled: true });
    await fireEvent.press(screen.getByRole("tab", { name: "Dark" }));
    expect(useSchemeStore.getState().scheme).toBe("system");
  });

  test("style is merged onto the root", async () => {
    await renderSwitcher({ style: { marginTop: 5 } });
    expect(StyleSheet.flatten(screen.getByTestId("switcher").props.style)).toMatchObject({
      marginTop: 5,
    });
  });
});

describe("SchemeSwitcher: icon", () => {
  test("one icon-only button named after the current Scheme", async () => {
    await renderSwitcher({ variant: "icon" });
    const button = screen.getByRole("button", { name: "Theme: System" });
    expect(button).toBeOnTheScreen();
    expect(screen.queryByLabelText("Theme")).toBeNull();
    expect(screen.getByTestId("icon-system", hidden)).toBeTruthy();
    expect(screen.queryByTestId("icon-light", hidden)).toBeNull();
  });

  test("each press cycles System → Light → Dark → System and persists it", async () => {
    await renderSwitcher({ variant: "icon" });
    const press = () => fireEvent.press(screen.getByTestId("switcher"));

    await press();
    expect(useSchemeStore.getState().scheme).toBe("light");
    expect(screen.getByRole("button", { name: "Theme: Light" })).toBeOnTheScreen();
    expect(screen.getByTestId("icon-light", hidden)).toBeTruthy();
    await waitFor(async () => expect(await persisted()).toBe("light"));

    await press();
    expect(useSchemeStore.getState().scheme).toBe("dark");
    expect(screen.getByRole("button", { name: "Theme: Dark" })).toBeOnTheScreen();
    expect(screen.getByTestId("probe")).toHaveTextContent("dark:dark");

    await press();
    expect(useSchemeStore.getState().scheme).toBe("system");
    expect(screen.getByRole("button", { name: "Theme: System" })).toBeOnTheScreen();
    await waitFor(async () => expect(await persisted()).toBe("system"));
  });

  test("disabled blocks the cycle", async () => {
    await renderSwitcher({ variant: "icon", disabled: true });
    expect(screen.getByTestId("switcher")).toBeDisabled();
    await fireEvent.press(screen.getByTestId("switcher"));
    expect(useSchemeStore.getState().scheme).toBe("system");
  });
});
