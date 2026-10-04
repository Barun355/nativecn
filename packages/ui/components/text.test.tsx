import { render, screen } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import { Text, type TextVariant } from "@/registry/components/text";
import {
  ThemeProvider,
  colors,
  computeScale,
  config,
  scaleTokens,
  useSchemeStore,
} from "@/registry/theme";

const mutableConfig = config as { fontScaling: boolean };
const { width, height } = Dimensions.get("window");
const { type } = scaleTokens(computeScale(width, height));

async function renderText(ui: React.ReactElement, scheme: "light" | "dark" = "light") {
  await render(<ThemeProvider scheme={scheme}>{ui}</ThemeProvider>);
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  mutableConfig.fontScaling = false;
});

afterEach(() => {
  mutableConfig.fontScaling = false;
});

describe("Text: Variants and colours", () => {
  test("defaults to the body Variant in the foreground Colour Role", async () => {
    await renderText(<Text>Hello</Text>);
    expect(screen.getByText("Hello")).toHaveStyle({ ...type.body, color: colors.light.foreground });
  });

  test.each(Object.keys(type) as TextVariant[])(
    "applies the %s step of the type ramp",
    async (v) => {
      await renderText(<Text variant={v}>Hello</Text>);
      expect(screen.getByText("Hello")).toHaveStyle(type[v]);
    },
  );

  test("takes a text Colour Role and follows the Scheme", async () => {
    await renderText(<Text color="mutedForeground">Hint</Text>, "dark");
    expect(screen.getByText("Hint")).toHaveStyle({ color: colors.dark.mutedForeground });
  });

  test("aligns and merges style last", async () => {
    await renderText(
      <Text align="center" style={{ marginTop: 4, color: "red" }}>
        Hi
      </Text>,
    );
    expect(screen.getByText("Hi")).toHaveStyle({ textAlign: "center", marginTop: 4, color: "red" });
  });

  test("headings get the heading role", async () => {
    await renderText(<Text variant="h1">Title</Text>);
    expect(screen.getByRole("heading", { name: "Title" })).toBeTruthy();
  });

  test("only colour roles meant for text are accepted", () => {
    // @ts-expect-error `background` is a surface Colour Role, not a text one
    const el = <Text color="background">x</Text>;
    expect(el).toBeTruthy();
  });
});

describe("Text: selectable", () => {
  test.each([
    ["body", true],
    ["small", true],
    ["h2", false],
    ["label", false],
  ] as const)("%s selectable by default: %s", async (variant, selectable) => {
    await renderText(<Text variant={variant}>x</Text>);
    expect(screen.getByText("x").props.selectable).toBe(selectable);
  });

  test("can be overridden", async () => {
    await renderText(<Text selectable={false}>x</Text>);
    expect(screen.getByText("x").props.selectable).toBe(false);
  });
});

describe("Text: font-scaling switch (ADR 0004)", () => {
  test("off by default: ignores the OS font size", async () => {
    await renderText(<Text variant="button">Go</Text>);
    const el = screen.getByText("Go");
    expect(el.props.allowFontScaling).toBe(false);
    expect(el.props.maxFontSizeMultiplier).toBeUndefined();
  });

  test.each(["button", "label", "caption"] as const)(
    "on: the chrome Variant %s is capped at 1.5×",
    async (variant) => {
      mutableConfig.fontScaling = true;
      await renderText(<Text variant={variant}>x</Text>);
      const el = screen.getByText("x");
      expect(el.props.allowFontScaling).toBe(true);
      expect(el.props.maxFontSizeMultiplier).toBe(1.5);
    },
  );

  test.each(["body", "h1", "display", "small"] as const)(
    "on: %s scales without a cap",
    async (variant) => {
      mutableConfig.fontScaling = true;
      await renderText(<Text variant={variant}>x</Text>);
      const el = screen.getByText("x");
      expect(el.props.allowFontScaling).toBe(true);
      expect(el.props.maxFontSizeMultiplier).toBeUndefined();
    },
  );
});
