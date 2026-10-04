import { render, screen } from "@testing-library/react-native";
import { Dimensions, StyleSheet, View } from "react-native";

import { Badge, type BadgeProps } from "@/registry/components/badge";
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

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale, { radiusBase: tokens.radiusBase });
const s = (v: number) => scaleValue(v, scale);

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

async function renderBadge(props: Partial<BadgeProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Badge testID="badge" label="New" {...props} />
    </ThemeProvider>,
  );
  return screen.getByTestId("badge");
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

afterEach(() => setActiveStyle("vega"));

test.each([
  ["default", colors.light.primary, colors.light.primaryForeground],
  ["secondary", colors.light.secondary, colors.light.secondaryForeground],
  ["outline", "transparent", colors.light.foreground],
  ["destructive", colors.light.destructive, colors.light.destructiveForeground],
  ["success", colors.light.success, colors.light.successForeground],
  ["warning", colors.light.warning, colors.light.warningForeground],
] as const)("%s maps to its Colour Roles", async (variant, background, foreground) => {
  const el = await renderBadge({ variant });
  expect(flat(el).backgroundColor).toBe(background);
  expect(screen.getByText("New")).toHaveStyle({ color: foreground });
});

test("outline has a border", async () => {
  expect(flat(await renderBadge({ variant: "outline" })).borderColor).toBe(colors.light.border);
});

test("Vega: badge.root h 22, radius 6, padX 8; label 12/16", async () => {
  expect(flat(await renderBadge())).toMatchObject({
    height: s(22),
    borderRadius: t.radius.sm,
    paddingHorizontal: t.spacing[2],
  });
  expect(screen.getByText("New")).toHaveStyle({
    fontSize: t.type.caption.fontSize,
    lineHeight: t.type.caption.lineHeight,
    fontFamily: t.type.label.fontFamily,
  });
});

test("Nova: badge.root h 20, radius 4, padX 6; label 11/14", async () => {
  setActiveStyle("nova");
  expect(flat(await renderBadge())).toMatchObject({
    height: s(20),
    borderRadius: s(4),
    paddingHorizontal: s(6),
  });
  expect(screen.getByText("New")).toHaveStyle({ fontSize: s(11), lineHeight: s(14) });
});

test("its label is the accessible text; it is not pressable", async () => {
  await renderBadge({ label: "3 new" });
  expect(screen.getByText("3 new")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});

test("style is merged last; ref and props pass through", async () => {
  const ref = { current: null as View | null };
  await render(
    <ThemeProvider scheme="light">
      <Badge ref={ref} testID="badge" label="New" style={{ alignSelf: "center" }} />
    </ThemeProvider>,
  );
  expect(ref.current).not.toBeNull();
  expect(screen.getByTestId("badge")).toHaveStyle({ alignSelf: "center" });
});
