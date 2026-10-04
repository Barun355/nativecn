import { act, render, screen } from "@testing-library/react-native";
import { Dimensions, StyleSheet } from "react-native";
import { getAnimatedStyle, useReducedMotion } from "react-native-reanimated";

import { Progress, type ProgressProps } from "@/registry/components/progress";
import { setActiveStyle } from "@/registry/styles";
import {
  ThemeProvider,
  colors,
  computeScale,
  scaleTokens,
  scaleValue,
  tokens,
  useSchemeStore,
} from "@/registry/theme";

jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return { __esModule: true, ...actual, useReducedMotion: jest.fn(() => false) };
});

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale, { radiusBase: tokens.radiusBase });

function ui(props: ProgressProps) {
  return (
    <ThemeProvider scheme="light">
      <Progress testID="progress" {...props} />
    </ThemeProvider>
  );
}

async function renderProgress(props: ProgressProps = {}) {
  const result = await render(ui(props));
  return { el: screen.getByTestId("progress"), rerender: result.rerender };
}

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
type Host = { props: Record<string, unknown>; children: unknown[] };
const indicator = (el: Host) =>
  getAnimatedStyle(el.children[0] as never) as { width?: string; left?: string };

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(useReducedMotion).mockReturnValue(false);
});

afterEach(() => {
  setActiveStyle("vega");
  jest.useRealTimers();
});

describe("Progress", () => {
  test("is a progress bar with its value", async () => {
    await renderProgress({ value: 40 });
    const el = screen.getByRole("progressbar");
    expect(el).toHaveAccessibilityValue({ min: 0, max: 100, now: 40 });
    expect(el).not.toBeBusy();
  });

  test("clamps the value to 0–100", async () => {
    await renderProgress({ value: 140 });
    expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ now: 100 });
    await renderProgress({ value: -5 });
    expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ now: 0 });
  });

  test("the track uses the progress.track Slot in each Style", async () => {
    const vega = await renderProgress();
    expect(flat(vega.el)).toMatchObject({
      height: scaleValue(8, scale),
      borderRadius: t.radius.full,
      backgroundColor: colors.light.muted,
    });
    setActiveStyle("nova");
    expect(flat((await renderProgress()).el)).toMatchObject({ height: scaleValue(4, scale) });
  });

  test("the indicator is primary and animates to the value", async () => {
    jest.useFakeTimers();
    const { el, rerender } = await renderProgress({ value: 25 });
    expect(flat(el.children[0] as Host)).toMatchObject({ backgroundColor: colors.light.primary });
    expect(indicator(el as Host).width).toBe("25%");
    await rerender(ui({ value: 75 }));
    await act(() => jest.advanceTimersByTime(tokens.motion.duration.base / 2));
    const mid = parseFloat(indicator(el as Host).width!);
    expect(mid).toBeGreaterThan(25);
    expect(mid).toBeLessThan(75);
    await act(() => jest.advanceTimersByTime(tokens.motion.duration.base));
    expect(indicator(el as Host).width).toBe("75%");
  });

  test("indeterminate: busy, no value, a bar sweeps along the track", async () => {
    jest.useFakeTimers();
    const { el } = await renderProgress({ value: 30, indeterminate: true });
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeBusy();
    expect(bar.props["aria-valuenow"]).toBeUndefined();
    expect(indicator(el as Host).width).toBe("40%");
    const start = indicator(el as Host).left;
    await act(() => jest.advanceTimersByTime(tokens.motion.duration.slow));
    expect(indicator(el as Host).left).not.toBe(start);
  });

  test("Reduce Motion: indeterminate stays still, values jump", async () => {
    jest.useFakeTimers();
    jest.mocked(useReducedMotion).mockReturnValue(true);
    const { el, rerender } = await renderProgress({ indeterminate: true });
    await act(() => jest.advanceTimersByTime(tokens.motion.duration.slow));
    expect(indicator(el as Host).left).toBe("0%");
    await rerender(ui({ value: 60 }));
    await act(() => jest.advanceTimersByTime(16));
    expect(indicator(el as Host).width).toBe("60%");
  });

  test("style is merged last; props pass through", async () => {
    const { el } = await renderProgress({
      style: { width: "50%" },
      accessibilityHint: "Upload progress",
    });
    expect(flat(el)).toMatchObject({ width: "50%" });
    expect(el.props.accessibilityHint).toBe("Upload progress");
  });
});
