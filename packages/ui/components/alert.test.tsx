import { render, screen } from "@testing-library/react-native";
import { Terminal } from "lucide-react-native";
import { Dimensions, StyleSheet, View } from "react-native";

import { Alert, AlertDescription, AlertTitle, type AlertProps } from "@/registry/components/alert";
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

// Default icons become marked Views that record their colour, so the Variant's icon can be found.
jest.mock("lucide-react-native", () => {
  const actual = jest.requireActual("lucide-react-native");
  const { View: RNView } = jest.requireActual("react-native");
  const marked = (id: string) =>
    function MarkedIcon(p: { color: string }) {
      return <RNView testID={id} accessibilityHint={p.color} />;
    };
  return {
    ...actual,
    Info: marked("icon-info"),
    CircleAlert: marked("icon-circle-alert"),
    CircleCheck: marked("icon-circle-check"),
    TriangleAlert: marked("icon-triangle-alert"),
    Terminal: marked("icon-terminal"),
  };
});

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale, { radiusBase: tokens.radiusBase });
const hidden = { includeHiddenElements: true } as const;

async function renderAlert(props: Partial<AlertProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Alert testID="alert" {...props}>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Your session expires soon.</AlertDescription>
      </Alert>
    </ThemeProvider>,
  );
  return screen.getByTestId("alert");
}

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

beforeEach(() => useSchemeStore.setState({ scheme: "system", hydrated: true }));
afterEach(() => setActiveStyle("vega"));

describe("Alert", () => {
  test("has the alert role and is read as one element", async () => {
    await renderAlert();
    const el = screen.getByRole("alert");
    expect(el).toHaveAccessibleName(/Heads up/);
    expect(el).toHaveAccessibleName(/Your session expires soon\./);
  });

  test("the root uses the alert.root Slot in each Style", async () => {
    expect(flat(await renderAlert())).toMatchObject({
      borderRadius: t.radius.lg,
      padding: t.spacing[4],
      gap: t.spacing[3],
      borderWidth: 1,
      backgroundColor: colors.light.card,
    });
    setActiveStyle("nova");
    expect(flat(await renderAlert())).toMatchObject({
      borderRadius: t.radius.md,
      padding: t.spacing[3],
      gap: scaleValue(10, scale),
    });
  });

  test.each([
    ["default", "icon-info", "border", "foreground", "mutedForeground"],
    ["destructive", "icon-circle-alert", "destructive", "destructive", "destructive"],
    ["success", "icon-circle-check", "success", "success", "success"],
    ["warning", "icon-triangle-alert", "warning", "warning", "warning"],
    ["info", "icon-info", "info", "info", "info"],
  ] as const)(
    "%s: default icon, border, title and description colours",
    async (variant, icon, border, accent, description) => {
      const el = await renderAlert({ variant });
      expect(flat(el).borderColor).toBe(colors.light[border]);
      expect(screen.getByTestId(icon, hidden).props.accessibilityHint).toBe(colors.light[accent]);
      expect(screen.getByText("Heads up")).toHaveStyle({ color: colors.light[accent] });
      expect(screen.getByText("Your session expires soon.")).toHaveStyle({
        color: colors.light[description],
      });
    },
  );

  test("icon replaces the default; null removes it", async () => {
    await renderAlert({ icon: Terminal });
    expect(screen.getByTestId("icon-terminal", hidden)).toBeTruthy();
    expect(screen.queryByTestId("icon-info", hidden)).toBeNull();
    await renderAlert({ icon: null });
    expect(screen.queryByTestId("icon-info", hidden)).toBeNull();
  });

  test("the icon is decorative", async () => {
    await renderAlert();
    expect(screen.queryByTestId("icon-info")).toBeNull();
  });

  test("title and description use the label and small type", async () => {
    await renderAlert();
    expect(screen.getByText("Heads up")).toHaveStyle(t.type.label);
    expect(screen.getByText("Your session expires soon.")).toHaveStyle(t.type.small);
  });

  test("style is merged last; ref and props pass through", async () => {
    const ref = { current: null as View | null };
    await render(
      <ThemeProvider scheme="light">
        <Alert ref={ref} testID="alert" style={{ marginTop: 8 }} accessibilityHint="Dismissable">
          <AlertTitle>Saved</AlertTitle>
        </Alert>
      </ThemeProvider>,
    );
    const el = screen.getByTestId("alert");
    expect(ref.current).not.toBeNull();
    expect(flat(el).marginTop).toBe(8);
    expect(el.props.accessibilityHint).toBe("Dismissable");
  });
});
