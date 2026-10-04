import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { Dimensions, StyleSheet } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { FormField } from "@/registry/components/form-field";
import { Switch, type SwitchProps } from "@/registry/components/switch";
import { setActiveStyle } from "@/registry/styles";
import {
  ThemeProvider,
  colors,
  computeScale,
  config,
  scaleValue,
  tokens,
  useSchemeStore,
} from "@/registry/theme";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  ...jest.requireActual("react-native-reanimated"),
  useReducedMotion: jest.fn(() => false),
}));

const reducedMotion = jest.mocked(useReducedMotion);
const mutableConfig = config as { haptics: boolean };
const { width, height } = Dimensions.get("window");
const s = (v: number) => scaleValue(v, computeScale(width, height));

type Node = { props: Record<string, unknown>; children: unknown[] };
const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

async function renderSwitch(props: Partial<SwitchProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Switch testID="sw" label="Wi-Fi" {...props} />
    </ThemeProvider>,
  );
  return screen.getByTestId("sw");
}

const trackOf = (root: Node) => root.children[0] as Node;
const thumbOf = (root: Node) => trackOf(root).children[0] as Node;

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  mutableConfig.haptics = true;
  reducedMotion.mockReturnValue(false);
  jest.clearAllMocks();
});

afterEach(() => {
  mutableConfig.haptics = true;
  setActiveStyle("vega");
});

describe("Switch: state", () => {
  test("uncontrolled: starts at defaultChecked and toggles itself", async () => {
    const onCheckedChange = jest.fn();
    await renderSwitch({ defaultChecked: true, onCheckedChange });
    const sw = screen.getByRole("switch", { name: "Wi-Fi" });
    expect(sw).toBeChecked();
    await fireEvent.press(sw);
    expect(sw).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  test("controlled: follows checked and only reports changes", async () => {
    const onCheckedChange = jest.fn();
    await renderSwitch({ checked: false, onCheckedChange });
    const sw = screen.getByRole("switch");
    await fireEvent.press(sw);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(sw).not.toBeChecked();
  });

  test("the track turns primary when on", async () => {
    const root = (await renderSwitch()) as never as Node;
    expect(flat(trackOf(root)).backgroundColor).toBe(colors.light.input);
    await fireEvent.press(root as never);
    expect(flat(trackOf(root)).backgroundColor).toBe(colors.light.primary);
  });
});

describe("Switch: thumb motion", () => {
  const travel = (w: number, h: number) =>
    w - 2 * tokens.spacing[0.5] - (h - 2 * tokens.spacing[0.5]);

  test("starts in place: off at 0, on at the end of the track", async () => {
    let root = (await renderSwitch()) as never as Node;
    expect(thumbOf(root)).toHaveAnimatedStyle({ transform: [{ translateX: 0 }] });
    root = (await renderSwitch({ defaultChecked: true })) as never as Node;
    const expected = s(52) - 2 * s(2) - (s(32) - 2 * s(2));
    expect(thumbOf(root)).toHaveAnimatedStyle({ transform: [{ translateX: expected }] });
    expect(expected).toBeCloseTo(travel(s(52), s(32)));
  });

  test("Reduce Motion: the thumb jumps to the end instantly", async () => {
    reducedMotion.mockReturnValue(true);
    const root = (await renderSwitch()) as never as Node;
    await fireEvent.press(root as never);
    const expected = s(52) - 2 * s(2) - (s(32) - 2 * s(2));
    expect(thumbOf(root)).toHaveAnimatedStyle({ transform: [{ translateX: expected }] });
  });

  test("without Reduce Motion the thumb slides (it has not arrived on the next frame)", async () => {
    const root = (await renderSwitch()) as never as Node;
    await fireEvent.press(root as never);
    const expected = s(52) - 2 * s(2) - (s(32) - 2 * s(2));
    expect(thumbOf(root)).not.toHaveAnimatedStyle({ transform: [{ translateX: expected }] });
  });

  test("Nova's track is 44 × 26", async () => {
    setActiveStyle("nova");
    const root = (await renderSwitch()) as never as Node;
    expect(flat(trackOf(root))).toMatchObject({ width: s(44), height: s(26) });
    expect(flat(thumbOf(root))).toMatchObject({ width: s(26) - 2 * s(2) });
  });
});

describe("Switch: accessibility", () => {
  test("disabled: aria-disabled, dimmed, no change, no haptic", async () => {
    const onCheckedChange = jest.fn();
    const root = await renderSwitch({ disabled: true, onCheckedChange });
    expect(root).toBeDisabled();
    expect(flat(root).opacity).toBe(tokens.opacity.disabled);
    await fireEvent.press(root);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  test("without a label the track reaches 48 through hitSlop", async () => {
    setActiveStyle("nova");
    const root = await renderSwitch({ label: undefined, "aria-label": "Wi-Fi" });
    expect(screen.getByRole("switch", { name: "Wi-Fi" })).toBeTruthy();
    expect(s(26) + root.props.hitSlop.top + root.props.hitSlop.bottom).toBeCloseTo(48);
  });

  test("style is merged last; the pressed look comes from switch.pressed", async () => {
    expect(flat(await renderSwitch({ style: { alignSelf: "stretch" } })).alignSelf).toBe("stretch");
    expect(flat(await renderSwitch({ testOnly_pressed: true } as never)).opacity).toBe(0.7);
  });
});

describe("Switch: inside a FormField", () => {
  test("takes the field's label, description and disabled", async () => {
    const onCheckedChange = jest.fn();
    await render(
      <ThemeProvider scheme="light">
        <FormField label="Backups" description="Daily at 2am" disabled>
          <Switch testID="sw" onCheckedChange={onCheckedChange} />
        </FormField>
      </ThemeProvider>,
    );
    const root = screen.getByTestId("sw");
    expect(screen.getByRole("switch", { name: "Backups" })).toBe(root);
    expect(root.props.accessibilityHint).toBe("Daily at 2am");
    expect(root).toBeDisabled();
    await fireEvent.press(root);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe("Switch: haptics", () => {
  test("a light tick on toggle", async () => {
    await fireEvent.press(await renderSwitch());
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  test("none when config.haptics is off", async () => {
    mutableConfig.haptics = false;
    await fireEvent.press(await renderSwitch());
    expect(screen.getByRole("switch")).toBeChecked();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
