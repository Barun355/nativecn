import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, type ViewStyle } from "react-native";

import {
  Pressable,
  touchTargetHitSlop,
  type PressableProps,
} from "@/registry/components/primitives/pressable";
import { setActiveStyle, slot } from "@/registry/styles";
import { ThemeProvider, config, createStyles, useSchemeStore } from "@/registry/theme";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

const mutableConfig = config as { haptics: boolean };

const base = { backgroundColor: "#000000" };
const pressed = { opacity: 0.5 };

async function renderPressable(props: Partial<PressableProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Pressable testID="p" style={base} pressedStyle={pressed} {...props}>
        <Text>Tap</Text>
      </Pressable>
    </ThemeProvider>,
  );
  return screen.getByTestId("p");
}

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

const layout = (width: number, height: number) => ({
  nativeEvent: { layout: { x: 0, y: 0, width, height } },
});

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  mutableConfig.haptics = true;
  jest.clearAllMocks();
});

afterEach(() => {
  mutableConfig.haptics = true;
  setActiveStyle("vega");
});

describe("Pressable: pressed look", () => {
  test("applies pressedStyle on top of style only while pressed", async () => {
    const idle = await renderPressable();
    expect(flat(idle)).toEqual(base);

    await screen.rerender(
      <ThemeProvider scheme="light">
        <Pressable testID="p" style={base} pressedStyle={pressed} testOnly_pressed>
          <Text>Tap</Text>
        </Pressable>
      </ThemeProvider>,
    );
    expect(flat(screen.getByTestId("p"))).toEqual({ ...base, ...pressed });
  });

  test("style may be a function of the press state", async () => {
    const el = await renderPressable({
      testOnly_pressed: true,
      style: ({ pressed: p }) => ({ borderWidth: p ? 2 : 1 }),
    });
    expect(flat(el)).toEqual({ borderWidth: 2, ...pressed });
  });

  test("no pressed look while disabled or loading", async () => {
    expect(flat(await renderPressable({ testOnly_pressed: true, disabled: true }))).toEqual(base);
    expect(flat(await renderPressable({ testOnly_pressed: true, loading: true }))).toEqual(base);
  });

  test("the button.pressed Style Slot differs between Vega and Nova", async () => {
    const useStyles = createStyles((t) => ({ pressed: slot("button.pressed", t) as ViewStyle }));
    function Button() {
      const styles = useStyles();
      return <Pressable testID="p" pressedStyle={styles.pressed} testOnly_pressed />;
    }
    const tree = (
      <ThemeProvider scheme="light">
        <Button />
      </ThemeProvider>
    );

    await render(tree);
    const vega = flat(screen.getByTestId("p"));
    expect(vega).toEqual({ filter: [{ brightness: 0.88 }] });

    setActiveStyle("nova");
    await render(tree);
    const nova = flat(screen.getByTestId("p"));
    expect(nova).toEqual({ filter: [{ brightness: 0.88 }], transform: [{ scale: 0.98 }] });
    expect(nova).not.toEqual(vega);
  });
});

describe("Pressable: blocked handlers", () => {
  test("calls onPress and onLongPress when enabled", async () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    const el = await renderPressable({ onPress, onLongPress });
    await fireEvent.press(el);
    await fireEvent(el, "longPress");
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["disabled", { disabled: true }],
    ["loading", { loading: true }],
  ])("never calls a handler while %s", async (_, state) => {
    const handlers = {
      onPress: jest.fn(),
      onLongPress: jest.fn(),
      onPressIn: jest.fn(),
      onPressOut: jest.fn(),
    };
    const el = await renderPressable({ ...handlers, ...state, haptic: "selection" });
    await fireEvent.press(el);
    // Even if the press reaches the element (e.g. a host event), the guards hold.
    await fireEvent(el, "press");
    await fireEvent(el, "longPress");
    await fireEvent(el, "pressIn");
    await fireEvent(el, "pressOut");
    for (const handler of Object.values(handlers)) expect(handler).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});

describe("Pressable: accessibility", () => {
  test("defaults to the button role, overridable", async () => {
    await renderPressable();
    expect(screen.getByRole("button")).toBeTruthy();
    await render(
      <ThemeProvider scheme="light">
        <Pressable role="checkbox" aria-checked testID="c" />
      </ThemeProvider>,
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  test("enabled: not disabled, not busy", async () => {
    const el = await renderPressable();
    expect(el).toBeEnabled();
    expect(el).not.toBeBusy();
  });

  test("disabled sets aria-disabled", async () => {
    const el = await renderPressable({ disabled: true });
    expect(el).toBeDisabled();
    expect(el).not.toBeBusy();
  });

  test("loading sets aria-busy and is not announced as disabled", async () => {
    const el = await renderPressable({ loading: true });
    expect(el).toBeBusy();
    expect(el.props.accessibilityState.disabled).toBe(false);
  });
});

describe("Pressable: touch target", () => {
  test("touchTargetHitSlop extends each axis to the minimum", () => {
    expect(touchTargetHitSlop(36, 20, 48)).toEqual({ top: 14, bottom: 14, left: 6, right: 6 });
    expect(touchTargetHitSlop(100, 44, 48)).toEqual({ top: 2, bottom: 2, left: 0, right: 0 });
    expect(touchTargetHitSlop(48, 60, 48)).toBeUndefined();
    expect(touchTargetHitSlop(undefined, 30, 48)).toEqual({
      top: 9,
      bottom: 9,
      left: 0,
      right: 0,
    });
  });

  test("a declared size reaches 48 without a layout pass", async () => {
    const el = await renderPressable({ size: { width: 20, height: 20 } });
    expect(el.props.hitSlop).toEqual({ top: 14, bottom: 14, left: 14, right: 14 });
    expect(20 + el.props.hitSlop.top + el.props.hitSlop.bottom).toBe(48);
  });

  test("measures with onLayout when no size is declared, and forwards onLayout", async () => {
    const onLayout = jest.fn();
    const el = await renderPressable({ onLayout });
    expect(el.props.hitSlop).toBeUndefined();
    await fireEvent(el, "layout", layout(120, 36));
    expect(onLayout).toHaveBeenCalledTimes(1);
    const slop = screen.getByTestId("p").props.hitSlop;
    expect(slop).toEqual({ top: 6, bottom: 6, left: 0, right: 0 });
    expect(36 + slop.top + slop.bottom).toBe(48);
  });

  test("declared dimensions win over measured ones", async () => {
    const el = await renderPressable({ size: { height: 32 } });
    await fireEvent(el, "layout", layout(24, 40));
    expect(screen.getByTestId("p").props.hitSlop).toEqual({
      top: 8,
      bottom: 8,
      left: 12,
      right: 12,
    });
  });

  test("no hitSlop when already at least 48", async () => {
    const el = await renderPressable();
    await fireEvent(el, "layout", layout(200, 48));
    expect(screen.getByTestId("p").props.hitSlop).toBeUndefined();
  });

  test("an explicit hitSlop overrides the computed one", async () => {
    const el = await renderPressable({ hitSlop: 4, size: { width: 10, height: 10 } });
    expect(el.props.hitSlop).toBe(4);
  });
});

describe("Pressable: haptics", () => {
  test("no haptic unless requested", async () => {
    await fireEvent.press(await renderPressable());
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test("selection fires a selection tick on press", async () => {
    await fireEvent.press(await renderPressable({ haptic: "selection" }));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  test("light fires a light impact on press", async () => {
    await fireEvent.press(await renderPressable({ haptic: "light" }));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  test("never fires when config.haptics is off", async () => {
    mutableConfig.haptics = false;
    const onPress = jest.fn();
    await fireEvent.press(await renderPressable({ haptic: "selection", onPress }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  test("a failing haptic never breaks the press", async () => {
    jest
      .mocked(Haptics.selectionAsync)
      .mockImplementationOnce(() => Promise.reject(new Error("nope")));
    const onPress = jest.fn();
    await fireEvent.press(await renderPressable({ haptic: "selection", onPress }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
