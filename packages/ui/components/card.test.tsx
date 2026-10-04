import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
} from "@/registry/components/card";
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

async function renderCard(props: Partial<CardProps> = {}, children?: ReactNode) {
  await render(
    <ThemeProvider scheme="light">
      <Card testID="card" {...props}>
        {children ?? (
          <>
            <CardHeader testID="header">
              <CardTitle>Pro plan</CardTitle>
              <CardDescription>Unlimited projects</CardDescription>
            </CardHeader>
            <CardContent testID="content" />
            <CardFooter testID="footer" />
          </>
        )}
      </Card>
    </ThemeProvider>,
  );
  return screen.getByTestId("card");
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

afterEach(() => setActiveStyle("vega"));

describe("Card: Style Slots", () => {
  test("Vega: card.root (radius 14, pad 24, gap 16, border and shadow)", async () => {
    expect(flat(await renderCard())).toMatchObject({
      borderRadius: t.radius.xl,
      padding: t.spacing[6],
      gap: t.spacing[4],
      borderWidth: 1,
      boxShadow: tokens.elevation.light.sm,
      backgroundColor: colors.light.card,
      borderColor: colors.light.border,
    });
    expect(screen.getByText("Pro plan")).toHaveStyle(t.type.h4);
    expect(screen.getByTestId("header")).toHaveStyle({ gap: s(6) });
  });

  test("Nova: card.root (radius 10, pad 16, gap 12, border only)", async () => {
    setActiveStyle("nova");
    const style = flat(await renderCard());
    expect(style).toMatchObject({
      borderRadius: t.radius.lg,
      padding: t.spacing[4],
      gap: t.spacing[3],
      borderWidth: 1,
    });
    expect(style.boxShadow).toBeUndefined();
    expect(screen.getByText("Pro plan")).toHaveStyle({ fontSize: s(15), lineHeight: s(20) });
  });

  test("CardDescription is muted; CardFooter is a row", async () => {
    await renderCard();
    expect(screen.getByText("Unlimited projects")).toHaveStyle({
      color: colors.light.mutedForeground,
    });
    expect(screen.getByTestId("footer")).toHaveStyle({ flexDirection: "row" });
  });

  test("style is merged last", async () => {
    expect(flat(await renderCard({ style: { padding: 0, flex: 1 } }))).toMatchObject({
      padding: 0,
      flex: 1,
    });
  });
});

describe("Card: accessibility and pressing", () => {
  test("CardTitle is a heading", async () => {
    await renderCard();
    expect(screen.getByRole("heading", { name: "Pro plan" })).toBeTruthy();
  });

  test("a plain Card is not a button", async () => {
    await renderCard();
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("onPress makes the whole card a button named by its text", async () => {
    const onPress = jest.fn();
    await renderCard({ onPress });
    const button = screen.getByRole("button", { name: /Pro plan/ });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("the pressed look comes from the card.pressed Slot in each Style", async () => {
    expect(
      flat(await renderCard({ onPress: () => {}, testOnly_pressed: true } as never)),
    ).toMatchObject({ filter: [{ brightness: 0.96 }] });
    setActiveStyle("nova");
    expect(
      flat(await renderCard({ onPress: () => {}, testOnly_pressed: true } as never)),
    ).toMatchObject({ transform: [{ scale: 0.98 }] });
  });

  test("disabled: aria-disabled, dimmed, no press", async () => {
    const onPress = jest.fn();
    const el = await renderCard({ onPress, disabled: true });
    expect(el).toBeDisabled();
    expect(flat(el).opacity).toBe(tokens.opacity.disabled);
    await fireEvent.press(el);
    expect(onPress).not.toHaveBeenCalled();
  });

  test("passes a ref, testID and React Native props through", async () => {
    const ref = { current: null as View | null };
    await render(
      <ThemeProvider scheme="light">
        <Card ref={ref} onPress={() => {}} accessibilityHint="Opens the order">
          <CardTitle>Order</CardTitle>
        </Card>
      </ThemeProvider>,
    );
    expect(ref.current).not.toBeNull();
    expect(screen.getByRole("button").props.accessibilityHint).toBe("Opens the order");
  });
});
