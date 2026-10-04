import { render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Dimensions, StyleSheet, Text } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { Container } from "@/registry/components/container";
import { KeyboardProvider } from "@/registry/components/primitives/keyboard";
import { ThemeProvider, colors, computeScale, scaleTokens, useSchemeStore } from "@/registry/theme";

// Uses react-native-keyboard-controller's Jest mock: KeyboardAwareScroll renders a plain
// ScrollView, so these tests check the props Container passes to it.

const { width, height } = Dimensions.get("window");
const { spacing } = scaleTokens(computeScale(width, height));
const INSETS = { top: 47, right: 10, bottom: 34, left: 12 };

async function renderContainer(ui: ReactNode) {
  await render(
    <SafeAreaInsetsContext value={INSETS}>
      <ThemeProvider scheme="light">
        <KeyboardProvider>{ui}</KeyboardProvider>
      </ThemeProvider>
    </SafeAreaInsetsContext>,
  );
}

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;
const scrollView = () =>
  screen.getByTestId("root").children[0] as unknown as {
    props: Record<string, unknown>;
  };

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

describe("Container: safe area", () => {
  test("keeps clear of the top and bottom edges by default, on the background colour", async () => {
    await renderContainer(<Container testID="root" />);
    expect(screen.getByTestId("root")).toHaveStyle({
      flex: 1,
      backgroundColor: colors.light.background,
      paddingTop: INSETS.top,
      paddingBottom: INSETS.bottom,
      paddingLeft: 0,
      paddingRight: 0,
    });
  });

  test("takes custom edges", async () => {
    await renderContainer(<Container testID="root" edges={["top", "left", "right"]} />);
    expect(screen.getByTestId("root")).toHaveStyle({
      paddingTop: INSETS.top,
      paddingBottom: 0,
      paddingLeft: INSETS.left,
      paddingRight: INSETS.right,
    });
  });

  test("no edges: no safe-area padding; style is merged last", async () => {
    await renderContainer(<Container testID="root" edges={[]} style={{ paddingTop: 5 }} />);
    expect(screen.getByTestId("root")).toHaveStyle({ paddingTop: 5, paddingBottom: 0 });
  });
});

describe("Container: scroll and keyboard", () => {
  test("scrolls with keyboard avoidance by default", async () => {
    await renderContainer(
      <Container testID="root">
        <Text>Content</Text>
      </Container>,
    );
    const scroll = scrollView();
    expect(scroll.props.enabled).toBe(true);
    expect(scroll.props.bottomOffset).toBe(spacing[6]);
    expect(screen.getByTestId("root")).toContainElement(screen.getByText("Content"));
  });

  test("keyboard={false} maps to the scroll view's enabled; extraKeyboardSpace passes through", async () => {
    await renderContainer(<Container testID="root" keyboard={false} extraKeyboardSpace={72} />);
    expect(scrollView().props.enabled).toBe(false);
    expect(scrollView().props.extraKeyboardSpace).toBe(72);
  });

  test("Token padding and gap, and a 640 max width, centred", async () => {
    await renderContainer(<Container testID="root" />);
    expect(flat(scrollView().props.contentContainerStyle)).toMatchObject({
      flexGrow: 1,
      maxWidth: 640,
      width: "100%",
      alignSelf: "center",
      gap: spacing[4],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    });
  });

  test("custom maxWidth, unpadded", async () => {
    await renderContainer(<Container testID="root" maxWidth={480} padded={false} />);
    const content = flat(scrollView().props.contentContainerStyle);
    expect(content.maxWidth).toBe(480);
    expect(content.paddingHorizontal).toBeUndefined();
  });

  test("scroll={false} lays the content out in a plain View with the same rules", async () => {
    await renderContainer(
      <Container testID="root" scroll={false} maxWidth={500}>
        <Text>Static</Text>
      </Container>,
    );
    const inner = scrollView();
    expect(inner.props.enabled).toBeUndefined();
    expect(flat(inner.props.style)).toMatchObject({
      flex: 1,
      maxWidth: 500,
      gap: spacing[4],
      paddingHorizontal: spacing[4],
    });
    expect(screen.getByText("Static")).toBeTruthy();
  });
});
