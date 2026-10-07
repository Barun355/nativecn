import { act, fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { useReducedMotion } from "react-native-reanimated";

import { FormFieldProvider } from "@/registry/components/primitives/form-field-context";
import { Slider, snapToStep, type SliderProps } from "@/registry/components/slider";
import { setActiveStyle } from "@/registry/styles";
import {
  ThemeProvider,
  colors,
  computeScale,
  config,
  scaleValue,
  useSchemeStore,
} from "@/registry/theme";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  ...jest.requireActual("react-native-reanimated"),
  useReducedMotion: jest.fn(() => false),
}));

// Gesture roots become marked Views, so the tests can see where they are and how big.
jest.mock("react-native-gesture-handler", () => {
  const actual = jest.requireActual("react-native-gesture-handler");
  const { View: RNView } = jest.requireActual("react-native");
  return {
    ...actual,
    GestureHandlerRootView: (props: object) => <RNView {...props} testID="gesture-root" />,
  };
});

const mutableConfig = config as { haptics: boolean };
const reducedMotion = jest.mocked(useReducedMotion);

const { width, height } = Dimensions.get("window");
const s = (v: number) => scaleValue(v, computeScale(width, height));

/** Track width used for gestures; the thumb is 24 (Vega), so x maps 1:1 onto 0..100 from 12. */
const WIDTH = 100 + s(24);

async function renderSlider(props: Partial<SliderProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Slider testID="slider" aria-label="Volume" {...props} />
    </ThemeProvider>,
  );
  const el = screen.getByTestId("slider");
  await fireEvent(el, "layout", { nativeEvent: { layout: { width: WIDTH, height: 48 } } });
  return el;
}

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
const now = () => screen.getByTestId("slider").props["aria-valuenow"];
const action = (actionName: string) =>
  fireEvent(screen.getByTestId("slider"), "accessibilityAction", { nativeEvent: { actionName } });

/** Drag from x to each following x, then release. */
async function drag(...xs: number[]) {
  const [first, ...rest] = xs;
  await act(async () => {
    fireGestureHandler(getByGestureTestId("slider-pan"), [
      { state: State.BEGAN, x: first },
      { state: State.ACTIVE, x: first },
      ...rest.map((x) => ({ x })),
      { state: State.END, x: rest.at(-1) ?? first },
    ]);
  });
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  mutableConfig.haptics = true;
  reducedMotion.mockReturnValue(false);
  jest.mocked(Haptics.selectionAsync).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("snapToStep", () => {
  test("clamps to the range and snaps to the nearest step from min", () => {
    expect(snapToStep(47, 0, 100, 10)).toBe(50);
    expect(snapToStep(-5, 0, 100, 1)).toBe(0);
    expect(snapToStep(120, 0, 100, 1)).toBe(100);
    expect(snapToStep(4, 1, 10, 3)).toBe(4);
    expect(snapToStep(0.3, 0, 1, 0.1)).toBe(0.3);
    expect(snapToStep(9.9, 0, 10, 3)).toBe(9);
  });
});

describe("Slider: accessibility", () => {
  test("adjustable with aria-valuemin/max/now and increment/decrement actions", async () => {
    const el = await renderSlider({ defaultValue: 30 });
    // iOS: `role="slider"` sets no trait there, so the adjustable trait is set directly.
    expect(el.props.accessibilityRole).toBe("adjustable");
    expect(el.props.accessible).toBe(true);
    expect(el.props["aria-label"]).toBe("Volume");
    expect(el.props["aria-valuemin"]).toBe(0);
    expect(el.props["aria-valuemax"]).toBe(100);
    expect(el.props["aria-valuenow"]).toBe(30);
    expect(el.props.accessibilityActions).toEqual([{ name: "increment" }, { name: "decrement" }]);
    expect(screen.getByRole("adjustable")).toBe(el);
  });

  test("increment and decrement move one step and report the value", async () => {
    const onValueChange = jest.fn();
    const onSlidingComplete = jest.fn();
    await renderSlider({ defaultValue: 50, step: 5, onValueChange, onSlidingComplete });
    await action("increment");
    expect(now()).toBe(55);
    expect(onValueChange).toHaveBeenLastCalledWith(55);
    expect(onSlidingComplete).toHaveBeenLastCalledWith(55);
    await action("decrement");
    await action("decrement");
    expect(now()).toBe(45);
  });

  test("actions stop at min and max", async () => {
    const onValueChange = jest.fn();
    await renderSlider({ defaultValue: 100, onValueChange });
    await action("increment");
    expect(onValueChange).not.toHaveBeenCalled();
    await renderSlider({ min: 0, defaultValue: 0, onValueChange });
    await action("decrement");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("disabled blocks actions and is announced", async () => {
    const onValueChange = jest.fn();
    const el = await renderSlider({ disabled: true, defaultValue: 10, onValueChange });
    expect(el.props["aria-disabled"]).toBe(true);
    await action("increment");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(now()).toBe(10);
  });

  test("inside FormField: label, hint and disabled", async () => {
    await render(
      <ThemeProvider scheme="light">
        <FormFieldProvider label="Brightness" description="Applies to all screens" disabled>
          <Slider testID="slider" />
        </FormFieldProvider>
      </ThemeProvider>,
    );
    const el = screen.getByTestId("slider");
    expect(el.props["aria-label"]).toBe("Brightness");
    expect(el.props.accessibilityHint).toBe("Applies to all screens");
    expect(el.props["aria-disabled"]).toBe(true);
  });

  test("a hint and aria-valuetext pass through", async () => {
    const el = await renderSlider({ accessibilityHint: "Swipe up", "aria-valuetext": "Loud" });
    expect(el.props.accessibilityHint).toBe("Swipe up");
    expect(el.props["aria-valuetext"]).toBe("Loud");
  });
});

describe("Slider: controlled and uncontrolled", () => {
  test("defaults: 0..100 starting at min", async () => {
    await renderSlider();
    expect(now()).toBe(0);
    await renderSlider({ min: 20 });
    expect(now()).toBe(20);
  });

  test("controlled: shows `value`; changes go through onValueChange", async () => {
    const onValueChange = jest.fn();
    await renderSlider({ value: 40, onValueChange });
    await action("increment");
    expect(onValueChange).toHaveBeenCalledWith(41);
    expect(now()).toBe(40);

    function Parent() {
      const [v, setV] = useState(10);
      return <Slider testID="slider" value={v} onValueChange={setV} step={10} />;
    }
    await render(
      <ThemeProvider scheme="light">
        <Parent />
      </ThemeProvider>,
    );
    await action("increment");
    expect(now()).toBe(20);
  });

  test("an off-step value snaps to the nearest step", async () => {
    await renderSlider({ value: 47, step: 10 });
    expect(now()).toBe(50);
  });
});

describe("Slider: dragging and step snapping", () => {
  test("a drag reports each stepped value and completes once", async () => {
    const onValueChange = jest.fn();
    const onSlidingComplete = jest.fn();
    await renderSlider({ step: 10, onValueChange, onSlidingComplete });
    const left = s(24) / 2;
    await drag(left + 12, left + 14, left + 33, left + 61);
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual([10, 30, 60]);
    expect(now()).toBe(60);
    expect(onSlidingComplete).toHaveBeenCalledTimes(1);
    expect(onSlidingComplete).toHaveBeenCalledWith(60);
  });

  test("one haptic tick per step, none when config.haptics is off", async () => {
    await renderSlider({ step: 10 });
    const left = s(24) / 2;
    await drag(left + 10, left + 20, left + 22, left + 30);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(3);

    jest.mocked(Haptics.selectionAsync).mockClear();
    mutableConfig.haptics = false;
    await renderSlider({ step: 10 });
    await drag(left + 10, left + 50);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  test("dragging past the ends clamps to min and max", async () => {
    await renderSlider({ defaultValue: 50 });
    await drag(WIDTH + 50);
    expect(now()).toBe(100);
    await drag(-40);
    expect(now()).toBe(0);
  });

  test("disabled: the gestures are off", async () => {
    await renderSlider({ disabled: true });
    expect(getByGestureTestId("slider-pan").config.enabled).toBe(false);
    expect(getByGestureTestId("slider-tap").config.enabled).toBe(false);
  });
});

describe("Slider: motion and Style Slots", () => {
  test("under Reduce Motion the thumb moves instantly", async () => {
    reducedMotion.mockReturnValue(true);
    await renderSlider({ defaultValue: 0 });
    await action("increment");
    await action("increment");
    // translateX = fraction × (width − thumb) = 0.02 × 100.
    expect(screen.getByTestId("slider-thumb")).toHaveAnimatedStyle({
      transform: [{ translateX: 2 }],
    });
  });

  test.each([
    ["vega", s(6), s(24)],
    ["nova", s(4), s(20)],
  ] as const)("%s fills slider.track and slider.thumb", async (style, track, thumb) => {
    setActiveStyle(style);
    await renderSlider();
    const thumbStyle = flat(screen.getByTestId("slider-thumb"));
    expect(thumbStyle).toMatchObject({ width: thumb, height: thumb });
    expect(thumbStyle.borderColor).toBe(colors.light.primary);
    const trackEl = screen.getByTestId("slider-thumb").parent!.children[0] as never;
    expect(flat(trackEl).height).toBe(track);
  });

  test("the root is at least the 48 touch target tall; style is merged last", async () => {
    const el = await renderSlider({ style: { width: 200, flex: 1 } });
    expect(flat(el).height).toBeGreaterThanOrEqual(48);
    // `style` lays out the outermost box, the Slider's own gesture root.
    const root = screen.getByTestId("gesture-root");
    expect(flat(root).width).toBe(200);
    expect(flat(root).flex).toBe(1);
  });
});

// #153: an app made by `create`/`init` has no GestureHandlerRootView in its root Layout, and
// without one GestureDetector throws "must be used as a descendant of GestureHandlerRootView".
describe("Slider: its own gesture root", () => {
  type Node = ReturnType<typeof screen.getByTestId>;
  const ancestorIds = (el: Node) => {
    const ids: string[] = [];
    for (let p = el.parent; p; p = p.parent) if (p.props?.testID) ids.push(p.props.testID);
    return ids;
  };

  test("wraps the Slider in one gesture root sized to it, never the screen", async () => {
    const el = await renderSlider();
    const roots = screen.getAllByTestId("gesture-root");
    expect(roots).toHaveLength(1);
    expect(ancestorIds(el)).toContain("gesture-root");
    const style = flat(roots[0]!);
    // GestureHandlerRootView defaults to flex: 1; the Slider's must not grow to fill its parent.
    expect(style.flex).toBe(0);
    expect(style.position).not.toBe("absolute");
    expect(roots[0]!.props.pointerEvents).toBeUndefined();
  });
});
