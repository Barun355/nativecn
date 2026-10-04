import { act, render, screen } from "@testing-library/react-native";
import { Dimensions, StyleSheet } from "react-native";
import { getAnimatedStyle, useReducedMotion } from "react-native-reanimated";

import { Skeleton, type SkeletonProps } from "@/registry/components/skeleton";
import { setActiveStyle } from "@/registry/styles";
import {
  ThemeProvider,
  colors,
  computeScale,
  scaleTokens,
  tokens,
  useSchemeStore,
} from "@/registry/theme";

jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return { __esModule: true, ...actual, useReducedMotion: jest.fn(() => false) };
});

const { width, height } = Dimensions.get("window");
const t = scaleTokens(computeScale(width, height), { radiusBase: tokens.radiusBase });
const hidden = { includeHiddenElements: true } as const;

async function renderSkeleton(props: SkeletonProps = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Skeleton testID="skeleton" {...props} />
    </ThemeProvider>,
  );
  return screen.getByTestId("skeleton", hidden);
}

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
const opacity = (el: unknown) => (getAnimatedStyle(el as never) as { opacity?: number }).opacity;

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(useReducedMotion).mockReturnValue(false);
});

afterEach(() => {
  setActiveStyle("vega");
  jest.useRealTimers();
});

describe("Skeleton", () => {
  test("a muted block with the skeleton.root radius in each Style", async () => {
    expect(flat(await renderSkeleton({ width: 120, height: 16 }))).toMatchObject({
      width: 120,
      height: 16,
      backgroundColor: colors.light.muted,
      borderRadius: t.radius.md,
    });
    setActiveStyle("nova");
    expect(flat(await renderSkeleton())).toMatchObject({ borderRadius: t.radius.sm });
  });

  test("takes percentages", async () => {
    expect(flat(await renderSkeleton({ width: "60%", height: 12 }))).toMatchObject({
      width: "60%",
    });
  });

  test("circle: fully rounded and square from one side", async () => {
    expect(flat(await renderSkeleton({ circle: true, height: 40 }))).toMatchObject({
      width: 40,
      height: 40,
      borderRadius: t.radius.full,
    });
  });

  test("hidden from screen readers", async () => {
    const el = await renderSkeleton({ width: 40, height: 40 });
    expect(screen.queryByTestId("skeleton")).toBeNull();
    expect(el).not.toBeVisible();
  });

  test("pulses", async () => {
    jest.useFakeTimers();
    const el = await renderSkeleton({ height: 20 });
    await act(() => jest.advanceTimersByTime(tokens.motion.duration.slow / 2));
    expect(opacity(el)).toBeLessThan(1);
    expect(opacity(el)).toBeGreaterThanOrEqual(0.5);
  });

  test("Reduce Motion: stays still", async () => {
    jest.useFakeTimers();
    jest.mocked(useReducedMotion).mockReturnValue(true);
    const el = await renderSkeleton({ height: 20 });
    await act(() => jest.advanceTimersByTime(tokens.motion.duration.slow / 2));
    expect(opacity(el)).toBe(1);
  });

  test("style is merged last", async () => {
    expect(flat(await renderSkeleton({ height: 20, style: { borderRadius: 0 } }))).toMatchObject({
      borderRadius: 0,
    });
  });
});
