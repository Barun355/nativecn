import { act, render, screen } from "@testing-library/react-native";
import { Dimensions } from "react-native";
import { getAnimatedStyle, useReducedMotion } from "react-native-reanimated";

import { Spinner } from "@/registry/components/spinner";
import { ThemeProvider, colors, computeScale, scaleTokens, useSchemeStore } from "@/registry/theme";

jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  return { __esModule: true, ...actual, useReducedMotion: jest.fn(() => false) };
});

// The mockGlyph becomes a marked View that records its props.
const mockGlyph = jest.fn();
jest.mock("lucide-react-native", () => {
  const actual = jest.requireActual("lucide-react-native");
  const { View: RNView } = jest.requireActual("react-native");
  return {
    ...actual,
    LoaderCircle: (props: Record<string, unknown>) => {
      mockGlyph(props);
      return <RNView testID="glyph" />;
    },
  };
});

const { width, height } = Dimensions.get("window");
const { iconSize } = scaleTokens(computeScale(width, height));
const hidden = { includeHiddenElements: true } as const;

async function renderSpinner(ui: React.ReactElement) {
  await render(<ThemeProvider scheme="light">{ui}</ThemeProvider>);
}

const rotation = (el: unknown) =>
  (getAnimatedStyle(el as never) as { transform?: { rotate: string }[] }).transform?.[0]?.rotate;

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(useReducedMotion).mockReturnValue(false);
  mockGlyph.mockClear();
});

afterEach(() => jest.useRealTimers());

describe("Spinner", () => {
  test("is a busy progress bar named Loading by default", async () => {
    await renderSpinner(<Spinner />);
    const el = screen.getByRole("progressbar", { name: "Loading" });
    expect(el).toBeBusy();
  });

  test("aria-label names what is loading", async () => {
    await renderSpinner(<Spinner aria-label="Loading messages" />);
    expect(screen.getByRole("progressbar", { name: "Loading messages" })).toBeTruthy();
  });

  test("aria-hidden silences it inside a busy parent", async () => {
    await renderSpinner(<Spinner aria-hidden testID="spinner" />);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByTestId("spinner", hidden)).not.toBeVisible();
  });

  test("defaults: md size, foreground colour", async () => {
    await renderSpinner(<Spinner testID="spinner" />);
    expect(screen.getByTestId("spinner")).toHaveStyle({
      width: iconSize.md,
      height: iconSize.md,
    });
    expect(mockGlyph).toHaveBeenLastCalledWith(
      expect.objectContaining({ size: iconSize.md, color: colors.light.foreground }),
    );
  });

  test.each(["sm", "md", "lg"] as const)("size %s comes from the iconSize Tokens", async (size) => {
    await renderSpinner(<Spinner size={size} testID="spinner" />);
    expect(screen.getByTestId("spinner")).toHaveStyle({ width: iconSize[size] });
    expect(mockGlyph).toHaveBeenLastCalledWith(expect.objectContaining({ size: iconSize[size] }));
  });

  test("takes a Colour Role", async () => {
    await renderSpinner(<Spinner color="primary" />);
    expect(mockGlyph).toHaveBeenLastCalledWith(
      expect.objectContaining({ color: colors.light.primary }),
    );
  });

  test("turns continuously", async () => {
    jest.useFakeTimers();
    await renderSpinner(<Spinner testID="spinner" />);
    const el = screen.getByTestId("spinner");
    await act(() => jest.advanceTimersByTime(200));
    const first = rotation(el);
    expect(first).not.toBe("0deg");
    await act(() => jest.advanceTimersByTime(200));
    expect(rotation(el)).not.toBe(first);
  });

  test("Reduce Motion: stays still", async () => {
    jest.useFakeTimers();
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await renderSpinner(<Spinner testID="spinner" />);
    await act(() => jest.advanceTimersByTime(500));
    expect(rotation(screen.getByTestId("spinner"))).toBe("0deg");
  });

  test("style is merged last; props pass through", async () => {
    await renderSpinner(
      <Spinner testID="spinner" style={{ marginEnd: 4 }} accessibilityHint="Please wait" />,
    );
    const el = screen.getByTestId("spinner");
    expect(el).toHaveStyle({ marginEnd: 4, width: iconSize.md });
    expect(el.props.accessibilityHint).toBe("Please wait");
  });
});
