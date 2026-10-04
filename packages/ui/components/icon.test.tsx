import { render, screen } from "@testing-library/react-native";
import { Camera, type LucideIcon } from "lucide-react-native";
import { Dimensions } from "react-native";

import { Icon } from "@/registry/components/icon";
import { ThemeProvider, colors, computeScale, scaleTokens, useSchemeStore } from "@/registry/theme";

const { width, height } = Dimensions.get("window");
const { iconSize } = scaleTokens(computeScale(width, height));

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

async function renderIcon(ui: React.ReactElement) {
  await render(<ThemeProvider scheme="light">{ui}</ThemeProvider>);
}

// A stand-in Lucide icon that records the props the Icon passes to the glyph.
const Glyph = jest.fn((_props: Record<string, unknown>) => null);
const Spy = Glyph as unknown as LucideIcon;
const glyph = () => ({ props: Glyph.mock.lastCall![0] });

beforeEach(() => Glyph.mockClear());

describe("Icon", () => {
  test("renders a real Lucide glyph", async () => {
    await renderIcon(<Icon icon={Camera} testID="icon" />);
    expect(screen.getByTestId("icon", { includeHiddenElements: true }).children).toHaveLength(1);
  });

  test("defaults: md size, foreground colour, stroke 2", async () => {
    await renderIcon(<Icon icon={Spy} testID="icon" />);
    expect(screen.getByTestId("icon", { includeHiddenElements: true })).toHaveStyle({
      width: iconSize.md,
      height: iconSize.md,
    });
    expect(glyph().props).toMatchObject({
      size: iconSize.md,
      color: colors.light.foreground,
      strokeWidth: 2,
    });
  });

  test.each(["sm", "md", "lg"] as const)("size %s comes from the scaled Tokens", async (size) => {
    await renderIcon(<Icon icon={Spy} size={size} testID="icon" />);
    expect(glyph().props.size).toBe(iconSize[size]);
    expect(screen.getByTestId("icon", { includeHiddenElements: true })).toHaveStyle({
      width: iconSize[size],
    });
  });

  test("takes a Colour Role and a stroke width", async () => {
    await renderIcon(<Icon icon={Spy} color="destructive" strokeWidth={1.5} />);
    expect(glyph().props).toMatchObject({ color: colors.light.destructive, strokeWidth: 1.5 });
  });

  test("decorative by default: hidden from screen readers", async () => {
    await renderIcon(<Icon icon={Camera} testID="icon" />);
    expect(screen.queryByTestId("icon")).toBeNull();
    const el = screen.getByTestId("icon", { includeHiddenElements: true });
    expect(el).not.toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
  });

  test("with aria-label it is an image with that name", async () => {
    await renderIcon(<Icon icon={Camera} aria-label="Camera" />);
    expect(screen.getByRole("img", { name: "Camera" })).toBeTruthy();
  });

  test("style is merged last", async () => {
    await renderIcon(<Icon icon={Camera} testID="icon" style={{ marginEnd: 4 }} />);
    expect(screen.getByTestId("icon", { includeHiddenElements: true })).toHaveStyle({
      marginEnd: 4,
      width: iconSize.md,
    });
  });
});
