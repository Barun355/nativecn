import { render, screen } from "@testing-library/react-native";
import { createRef, type ReactNode } from "react";
import { Dimensions, Text, TextInput } from "react-native";
import type { KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import {
  KeyboardAwareScroll,
  KeyboardProvider,
  KeyboardStickyFooter,
} from "@/registry/components/primitives/keyboard";
import { ThemeProvider, computeScale, scaleTokens, useSchemeStore } from "@/registry/theme";

// Uses react-native-keyboard-controller's Jest mock (test/jest-setup.cjs): the scroll view is
// a plain ScrollView and the sticky view a plain View, so these tests check what we pass to
// the library. The keyboard motion itself can only be verified on a device.

// The pre-scaled Tokens ThemeProvider computes for the test window.
const { width, height } = Dimensions.get("window");
const { spacing } = scaleTokens(computeScale(width, height));

const INSETS = { top: 47, right: 0, bottom: 34, left: 0 };

async function renderWithTheme(ui: ReactNode) {
  return render(
    <SafeAreaInsetsContext value={INSETS}>
      <ThemeProvider scheme="light">
        <KeyboardProvider>{ui}</KeyboardProvider>
      </ThemeProvider>
    </SafeAreaInsetsContext>,
  );
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

describe("KeyboardProvider", () => {
  test("renders its children", async () => {
    await renderWithTheme(<Text>App</Text>);
    expect(screen.getByText("App")).toBeTruthy();
  });
});

describe("KeyboardAwareScroll", () => {
  test("renders its children in a scroll view", async () => {
    await renderWithTheme(
      <KeyboardAwareScroll testID="scroll">
        <TextInput testID="email" />
      </KeyboardAwareScroll>,
    );
    expect(screen.getByTestId("scroll")).toContainElement(screen.getByTestId("email"));
  });

  test("keeps a Token-sized gap above the keyboard and lets taps through by default", async () => {
    await renderWithTheme(<KeyboardAwareScroll testID="scroll" />);
    const scroll = screen.getByTestId("scroll");
    expect(scroll.props.bottomOffset).toBe(spacing[6]);
    expect(scroll.props.keyboardShouldPersistTaps).toBe("handled");
  });

  test("passes offsets, ref and other props through", async () => {
    const ref = createRef<KeyboardAwareScrollViewRef>();
    await renderWithTheme(
      <KeyboardAwareScroll
        ref={ref}
        testID="scroll"
        bottomOffset={8}
        extraKeyboardSpace={64}
        enabled={false}
        keyboardShouldPersistTaps="never"
      />,
    );
    const scroll = screen.getByTestId("scroll");
    expect(scroll.props.bottomOffset).toBe(8);
    expect(scroll.props.extraKeyboardSpace).toBe(64);
    expect(scroll.props.enabled).toBe(false);
    expect(scroll.props.keyboardShouldPersistTaps).toBe("never");
    expect(ref.current).not.toBeNull();
  });
});

describe("KeyboardStickyFooter", () => {
  test("wraps its content", async () => {
    await renderWithTheme(
      <KeyboardStickyFooter testID="footer">
        <Text>Sign in</Text>
      </KeyboardStickyFooter>,
    );
    expect(screen.getByTestId("footer")).toContainElement(screen.getByText("Sign in"));
  });

  test("pads by the gap Token plus the bottom safe area, and drops the inset when the keyboard opens", async () => {
    await renderWithTheme(<KeyboardStickyFooter testID="footer" />);
    const footer = screen.getByTestId("footer");
    const gap = spacing[3];
    expect(footer).toHaveStyle({ paddingTop: gap, paddingBottom: gap + INSETS.bottom });
    expect(footer.props.offset).toEqual({ closed: 0, opened: INSETS.bottom });
    expect(footer.props.enabled).toBe(true);
  });

  test("takes a custom gap, no safe area, disabled tracking and a layout style", async () => {
    await renderWithTheme(
      <KeyboardStickyFooter
        testID="footer"
        gap={4}
        safeArea={false}
        enabled={false}
        style={{ paddingHorizontal: 16 }}
      />,
    );
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveStyle({ paddingTop: 4, paddingBottom: 4, paddingHorizontal: 16 });
    expect(footer.props.offset).toEqual({ closed: 0, opened: 0 });
    expect(footer.props.enabled).toBe(false);
  });
});
