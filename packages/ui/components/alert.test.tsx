import { render, screen } from "@testing-library/react-native";
import { Terminal } from "lucide-react-native";
import { Dimensions, StyleSheet, View } from "react-native";

import { Alert, AlertDescription, AlertTitle, type AlertProps } from "@/registry/components/alert";
import { FormField } from "@/registry/components/form-field";
import { Input } from "@/registry/components/input";
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

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(announce).mockClear();
});
afterEach(() => setActiveStyle("vega"));

/** One Alert in a ThemeProvider, for render and rerender. */
const alertUI = (props: Partial<AlertProps>, title: string, description?: string) => (
  <ThemeProvider scheme="light">
    <Alert testID="alert" {...props}>
      <AlertTitle>{title}</AlertTitle>
      {description ? <AlertDescription>{description}</AlertDescription> : null}
    </Alert>
  </ThemeProvider>
);

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

describe("Alert announcements", () => {
  test.each([
    ["destructive", "Error: Wrong password. Check it and try again."],
    ["success", "Success: Wrong password. Check it and try again."],
    ["warning", "Warning: Wrong password. Check it and try again."],
  ] as const)("%s is announced once when it appears", async (variant, spoken) => {
    await render(alertUI({ variant }, "Wrong password", "Check it and try again."));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(spoken);
  });

  test.each(["default", "info"] as const)("%s is not announced", async (variant) => {
    await render(alertUI({ variant }, "Heads up", "Your session expires soon."));
    expect(announce).not.toHaveBeenCalled();
  });

  test("announced again when its text changes, never on unrelated re-renders", async () => {
    const { rerender } = await render(alertUI({ variant: "destructive" }, "Wrong password"));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenLastCalledWith("Error: Wrong password");

    // Same text, new props that do not change what is said: silent.
    await rerender(alertUI({ variant: "destructive", style: { marginTop: 8 } }, "Wrong password"));
    await rerender(alertUI({ variant: "destructive", icon: null }, "Wrong password"));
    expect(announce).toHaveBeenCalledTimes(1);

    await rerender(alertUI({ variant: "destructive" }, "Too many attempts", "Try again later."));
    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenLastCalledWith("Error: Too many attempts. Try again later.");
  });

  test("announced when it changes to error, success or warning, silent when it changes away", async () => {
    const { rerender } = await render(alertUI({ variant: "default" }, "Saving"));
    expect(announce).not.toHaveBeenCalled();
    await rerender(alertUI({ variant: "success" }, "Saved"));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenLastCalledWith("Success: Saved");
    await rerender(alertUI({ variant: "info" }, "Saved"));
    expect(announce).toHaveBeenCalledTimes(1);
    await rerender(alertUI({ variant: "warning" }, "Saved"));
    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenLastCalledWith("Warning: Saved");
  });

  test("announced again when it is shown again after being removed", async () => {
    const { rerender } = await render(alertUI({ variant: "destructive" }, "Wrong password"));
    await rerender(<ThemeProvider scheme="light">{null}</ThemeProvider>);
    await rerender(alertUI({ variant: "destructive" }, "Wrong password"));
    expect(announce).toHaveBeenCalledTimes(2);
  });

  test("text in nested elements and numbers is read in order; punctuation is kept", async () => {
    await render(
      <ThemeProvider scheme="light">
        <Alert variant="destructive">
          <AlertTitle>Upload failed!</AlertTitle>
          <AlertDescription>
            {3} of {5} files were too large
          </AlertDescription>
        </Alert>
      </ThemeProvider>,
    );
    expect(announce).toHaveBeenCalledWith("Error: Upload failed! 3 of 5 files were too large");
  });

  test("aria-label replaces the text it says", async () => {
    await render(alertUI({ variant: "success", "aria-label": "Profile saved" }, "Saved"));
    expect(announce).toHaveBeenCalledWith("Success: Profile saved");
  });

  test("an Alert with no text is not announced", async () => {
    await render(
      <ThemeProvider scheme="light">
        <Alert variant="destructive" />
      </ThemeProvider>,
    );
    expect(announce).not.toHaveBeenCalled();
  });

  test("an Alert inside another Alert is announced only by the outer one", async () => {
    await render(
      <ThemeProvider scheme="light">
        <Alert variant="destructive">
          <AlertTitle>Payment failed</AlertTitle>
          <Alert variant="destructive">
            <AlertDescription>Card declined</AlertDescription>
          </Alert>
        </Alert>
      </ThemeProvider>,
    );
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Error: Payment failed. Card declined");
  });

  test("inside a FormField with an error, only the FormField announces", async () => {
    await render(
      <ThemeProvider scheme="light">
        <FormField label="Email" error="Enter a valid email">
          <Input />
          <Alert variant="destructive">
            <AlertTitle>Enter a valid email</AlertTitle>
          </Alert>
        </FormField>
      </ThemeProvider>,
    );
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Enter a valid email");
  });

  test("inside a FormField without an error, the Alert announces itself", async () => {
    await render(
      <ThemeProvider scheme="light">
        <FormField label="Email">
          <Input />
          <Alert variant="success">
            <AlertTitle>Email verified</AlertTitle>
          </Alert>
        </FormField>
      </ThemeProvider>,
    );
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Success: Email verified");
  });
});
