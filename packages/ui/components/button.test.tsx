import { fireEvent, render, screen } from "@testing-library/react-native";
import { ArrowRight, Trash } from "lucide-react-native";
import { Dimensions, StyleSheet, View } from "react-native";

import { Button, type ButtonProps } from "@/registry/components/button";
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
import { announce } from "@/registry/utils/announce";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

// Status and spinner icons become marked Views, so the icon slot's content can be found.
jest.mock("lucide-react-native", () => {
  const actual = jest.requireActual("lucide-react-native");
  const { View: RNView } = jest.requireActual("react-native");
  return {
    ...actual,
    Check: () => <RNView testID="status-success" />,
    CircleAlert: () => <RNView testID="status-error" />,
    LoaderCircle: () => <RNView testID="spinner" />,
  };
});

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale, { radiusBase: tokens.radiusBase });
const s = (v: number) => scaleValue(v, scale);
const hidden = { includeHiddenElements: true } as const;

async function renderButton(props: Partial<ButtonProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Button testID="btn" label="Save" {...(props as ButtonProps)} />
    </ThemeProvider>,
  );
  return screen.getByTestId("btn");
}

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("Button: Variants", () => {
  test.each([
    ["primary", colors.light.primary, colors.light.primaryForeground],
    ["secondary", colors.light.secondary, colors.light.secondaryForeground],
    ["outline", colors.light.background, colors.light.foreground],
    ["ghost", "transparent", colors.light.foreground],
    ["destructive", colors.light.destructive, colors.light.destructiveForeground],
    ["link", "transparent", colors.light.primary],
  ] as const)("%s maps to its Colour Roles", async (variant, background, foreground) => {
    const el = await renderButton({ variant });
    expect(flat(el).backgroundColor).toBe(background);
    expect(screen.getByText("Save")).toHaveStyle({ color: foreground });
  });

  test("defaults to primary", async () => {
    expect(flat(await renderButton()).backgroundColor).toBe(colors.light.primary);
  });

  test("outline has a border; link is underlined", async () => {
    expect(flat(await renderButton({ variant: "outline" })).borderColor).toBe(colors.light.border);
    await renderButton({ variant: "link" });
    expect(screen.getByText("Save")).toHaveStyle({ textDecorationLine: "underline" });
  });
});

describe("Button: Sizes and Style Slots", () => {
  const vega = {
    sm: { height: t.controlHeight.sm, paddingHorizontal: t.spacing[3] },
    md: { height: t.controlHeight.md, paddingHorizontal: t.spacing[4], borderRadius: t.radius.md },
    lg: { height: t.controlHeight.lg, paddingHorizontal: t.spacing[6] },
  };
  const nova = {
    sm: { height: s(32), paddingHorizontal: s(10) },
    md: { height: t.controlHeight.sm, paddingHorizontal: t.spacing[3], borderRadius: t.radius.sm },
    lg: { height: t.controlHeight.md, paddingHorizontal: t.spacing[4] },
  };

  test.each(["sm", "md", "lg"] as const)("Vega %s", async (size) => {
    expect(flat(await renderButton({ size }))).toMatchObject(vega[size]);
  });

  test.each(["sm", "md", "lg"] as const)("Nova %s", async (size) => {
    setActiveStyle("nova");
    expect(flat(await renderButton({ size }))).toMatchObject(nova[size]);
  });

  test("the label uses the button.label Slot in each Style", async () => {
    await renderButton();
    expect(screen.getByText("Save")).toHaveStyle(t.type.button);
    setActiveStyle("nova");
    await renderButton();
    expect(screen.getByText("Save")).toHaveStyle({ fontSize: s(14), lineHeight: s(20) });
  });

  test("the pressed look comes from the button.pressed Slot", async () => {
    expect(flat(await renderButton({ testOnly_pressed: true } as never))).toMatchObject({
      filter: [{ brightness: 0.88 }],
    });
    setActiveStyle("nova");
    expect(flat(await renderButton({ testOnly_pressed: true } as never))).toMatchObject({
      transform: [{ scale: 0.98 }],
    });
  });

  test("style is merged last (full width)", async () => {
    expect(flat(await renderButton({ style: { alignSelf: "stretch", height: 60 } }))).toMatchObject(
      { alignSelf: "stretch", height: 60 },
    );
  });
});

describe("Button: touch target", () => {
  test("the Style's height reaches 48 via hitSlop before layout", async () => {
    setActiveStyle("nova");
    const el = await renderButton();
    const slop = el.props.hitSlop;
    expect(t.controlHeight.sm + slop.top + slop.bottom).toBeCloseTo(48);
    expect(slop.left).toBe(0);
  });

  test("an icon-only Button is square and extends both axes", async () => {
    setActiveStyle("nova");
    const el = await renderButton({ label: undefined, icon: Trash, "aria-label": "Delete" });
    const side = t.controlHeight.sm;
    expect(flat(el)).toMatchObject({ width: side, height: side, paddingHorizontal: 0 });
    expect(el.props.hitSlop.left).toBeCloseTo((48 - side) / 2);
    expect(el.props.hitSlop.top).toBeCloseTo((48 - side) / 2);
  });
});

describe("Button: accessibility and states", () => {
  test("is a button named by its label", async () => {
    await renderButton({ icon: ArrowRight, iconPosition: "end" });
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  test("icon-only is named by aria-label", async () => {
    await renderButton({ label: undefined, icon: Trash, "aria-label": "Delete" });
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  test("icon-only requires aria-label (types)", () => {
    // @ts-expect-error an icon-only Button needs an aria-label
    const iconOnly = <Button icon={Trash} />;
    // @ts-expect-error a Button needs a label or an icon
    const empty = <Button />;
    const ok = <Button icon={Trash} aria-label="Delete" />;
    expect([iconOnly, empty, ok]).toHaveLength(3);
  });

  test("calls onPress when enabled", async () => {
    const onPress = jest.fn();
    await fireEvent.press(await renderButton({ onPress }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("disabled: aria-disabled, dimmed, no press", async () => {
    const onPress = jest.fn();
    const el = await renderButton({ disabled: true, onPress });
    expect(el).toBeDisabled();
    expect(flat(el).opacity).toBe(tokens.opacity.disabled);
    await fireEvent.press(el);
    await fireEvent(el, "press");
    expect(onPress).not.toHaveBeenCalled();
  });

  test("loading: busy, spinner in the icon slot, label stays, no press", async () => {
    const onPress = jest.fn();
    const el = await renderButton({ loading: true, icon: ArrowRight, onPress });
    expect(el).toBeBusy();
    expect(el.props.accessibilityState.disabled).toBe(false);
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    // The Spinner replaces the icon (start), stays silent (the Button is busy) and the label stays.
    expect(screen.getByTestId("spinner", hidden)).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(el.children).toHaveLength(2);
    await fireEvent.press(el);
    await fireEvent(el, "press");
    expect(onPress).not.toHaveBeenCalled();
  });

  test.each(["error", "success"] as const)(
    "status %s shows its icon in the icon slot and is announced",
    async (status) => {
      await renderButton({ status, icon: ArrowRight });
      expect(screen.getByTestId(`status-${status}`, hidden)).toBeTruthy();
      expect(announce).toHaveBeenCalledWith(`Save: ${status}`);
    },
  );

  test("precedence: disabled > loading > status", async () => {
    const el = await renderButton({ disabled: true, loading: true, status: "error" });
    expect(el).toBeDisabled();
    expect(el).not.toBeBusy();
    expect(screen.queryByTestId("status-error", hidden)).toBeNull();

    const busy = await renderButton({ loading: true, status: "error" });
    expect(busy).toBeBusy();
    expect(screen.queryByTestId("status-error", hidden)).toBeNull();
    expect(announce).not.toHaveBeenCalled();
  });

  test("passes a ref and React Native props through", async () => {
    const ref = { current: null as View | null };
    await render(
      <ThemeProvider scheme="light">
        <Button ref={ref} label="Go" accessibilityHint="Opens the next step" />
      </ThemeProvider>,
    );
    expect(ref.current).not.toBeNull();
    expect(screen.getByRole("button").props.accessibilityHint).toBe("Opens the next step");
  });
});
