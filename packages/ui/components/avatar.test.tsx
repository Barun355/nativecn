import { fireEvent, render, screen } from "@testing-library/react-native";
import { Dimensions, StyleSheet } from "react-native";

import { Avatar, type AvatarProps } from "@/registry/components/avatar";
import { setActiveStyle } from "@/registry/styles";
import { ThemeProvider, colors, computeScale, scaleValue, useSchemeStore } from "@/registry/theme";

// expo-image is a native view; in Jest it becomes a plain View that keeps its props.
jest.mock("expo-image", () => {
  const { View } = jest.requireActual("react-native");
  return { Image: (props: Record<string, unknown>) => <View {...props} /> };
});

const { width, height } = Dimensions.get("window");
const s = (v: number) => scaleValue(v, computeScale(width, height));
const hidden = { includeHiddenElements: true } as const;

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

async function renderAvatar(props: AvatarProps = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Avatar testID="avatar" {...props} />
    </ThemeProvider>,
  );
  return screen.getByTestId("avatar", hidden);
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

afterEach(() => setActiveStyle("vega"));

describe("Avatar: sizes per Style", () => {
  test.each([
    ["sm", 32],
    ["md", 40],
    ["lg", 64],
  ] as const)("Vega %s is %i", async (size, side) => {
    expect(flat(await renderAvatar({ size }))).toMatchObject({ width: s(side), height: s(side) });
  });

  test.each([
    ["sm", 24],
    ["md", 32],
    ["lg", 48],
  ] as const)("Nova %s is %i", async (size, side) => {
    setActiveStyle("nova");
    expect(flat(await renderAvatar({ size }))).toMatchObject({ width: s(side), height: s(side) });
  });

  test("round, on the muted Colour Role", async () => {
    expect(flat(await renderAvatar())).toMatchObject({
      borderRadius: 9999,
      backgroundColor: colors.light.muted,
    });
  });
});

describe("Avatar: image and fallback", () => {
  test("without src, shows the fallback initials", async () => {
    await renderAvatar({ fallback: "JD" });
    expect(screen.getByText("JD", hidden)).toBeTruthy();
    expect(screen.queryByTestId("avatar-image", hidden)).toBeNull();
  });

  test("with src, draws the image over the fallback", async () => {
    await renderAvatar({ src: "https://example.com/a.png", fallback: "JD" });
    const image = screen.getByTestId("avatar-image", hidden);
    expect(image.props.source).toEqual(
      expect.objectContaining({ uri: "https://example.com/a.png" }),
    );
    expect(screen.getByText("JD", hidden)).toBeTruthy();
  });

  test("when the image fails, only the fallback remains", async () => {
    await renderAvatar({ src: "https://example.com/broken.png", fallback: "JD" });
    await fireEvent(screen.getByTestId("avatar-image", hidden), "error", { error: "404" });
    expect(screen.queryByTestId("avatar-image", hidden)).toBeNull();
    expect(screen.getByText("JD", hidden)).toBeTruthy();
  });

  test("the fallback is muted and scales with the size", async () => {
    await renderAvatar({ fallback: "JD", size: "lg" });
    expect(screen.getByText("JD", hidden)).toHaveStyle({
      color: colors.light.mutedForeground,
      fontSize: s(64) * 0.4,
    });
  });
});

describe("Avatar: accessibility", () => {
  test("decorative without alt: hidden from screen readers", async () => {
    const el = await renderAvatar({ fallback: "JD" });
    expect(el).not.toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
  });

  test("with alt: an image named by it", async () => {
    await renderAvatar({ fallback: "JD", alt: "Jane Doe" });
    expect(screen.getByRole("img", { name: "Jane Doe" })).toBeTruthy();
  });

  test("style is merged last", async () => {
    expect(flat(await renderAvatar({ style: { marginEnd: 8 } }))).toMatchObject({ marginEnd: 8 });
  });
});
