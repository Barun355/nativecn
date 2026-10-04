import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { Separator, type SeparatorProps } from "@/registry/components/separator";
import { ThemeProvider, colors, useSchemeStore } from "@/registry/theme";

const hidden = { includeHiddenElements: true } as const;

async function renderSeparator(props: SeparatorProps = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Separator testID="sep" {...props} />
    </ThemeProvider>,
  );
  return screen.getByTestId("sep", hidden);
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

test("horizontal by default: a hairline in the border Colour Role", async () => {
  expect(await renderSeparator()).toHaveStyle({
    height: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: colors.light.border,
  });
});

test("vertical: a hairline-wide line that stretches", async () => {
  expect(await renderSeparator({ orientation: "vertical" })).toHaveStyle({
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  });
});

test("decorative by default: hidden from screen readers", async () => {
  const el = await renderSeparator();
  expect(el).not.toBeVisible();
  expect(screen.queryByRole("separator")).toBeNull();
});

test("decorative={false}: exposed with role separator", async () => {
  await renderSeparator({ decorative: false });
  expect(screen.getByRole("separator")).toBeTruthy();
});

test("style is merged last", async () => {
  expect(await renderSeparator({ style: { marginVertical: 8 } })).toHaveStyle({
    marginVertical: 8,
  });
});
