import { render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { Dimensions, StyleSheet } from "react-native";

import { FormField } from "@/registry/components/form-field";
import { Input } from "@/registry/components/input";
import { Label } from "@/registry/components/label";
import { setActiveStyle } from "@/registry/styles";
import {
  ThemeProvider,
  colors,
  computeScale,
  scaleTokens,
  scaleValue,
  useSchemeStore,
} from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale);
const hidden = { includeHiddenElements: true } as const;

async function renderUI(ui: ReactElement) {
  await render(<ThemeProvider scheme="light">{ui}</ThemeProvider>);
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("Label", () => {
  test("uses the label Variant; required adds a hidden * and says required", async () => {
    await renderUI(
      <Label testID="label" required>
        Email
      </Label>,
    );
    const label = screen.getByTestId("label");
    expect(label).toHaveStyle({ ...t.type.label, color: colors.light.foreground });
    expect(label.props["aria-label"]).toBe("Email, required");
    expect(screen.getByText("*", { ...hidden, exact: false })).toHaveStyle({
      color: colors.light.destructive,
    });
  });

  test("without required it reads its text", async () => {
    await renderUI(<Label testID="label">Name</Label>);
    expect(screen.getByTestId("label").props["aria-label"]).toBeUndefined();
    expect(screen.getByText("Name")).toBeTruthy();
  });
});

describe("FormField", () => {
  test("lays out the label, control and description with the form-field.root gap", async () => {
    await renderUI(
      <FormField testID="field" label="Email" description="We never share it.">
        <Input testID="input" />
      </FormField>,
    );
    const root = screen.getByTestId("field");
    expect(StyleSheet.flatten(root.props.style)).toMatchObject({ gap: t.spacing[2] });
    expect(screen.getByText("Email", hidden)).toBeTruthy();
    expect(screen.getByText("We never share it.", hidden)).toHaveStyle({
      color: colors.light.mutedForeground,
    });

    setActiveStyle("nova");
    await renderUI(<FormField testID="field" label="Email" />);
    expect(StyleSheet.flatten(screen.getByTestId("field").props.style)).toMatchObject({
      gap: scaleValue(6, scale),
    });
  });

  test("the error replaces the description", async () => {
    await renderUI(
      <FormField label="Email" description="We never share it." error="Enter a valid email">
        <Input />
      </FormField>,
    );
    expect(screen.queryByText("We never share it.", hidden)).toBeNull();
    expect(screen.getByText("Enter a valid email", hidden)).toBeTruthy();
  });

  test('spoken output: "Email, required" + the error as the hint, announced once', async () => {
    const { rerender } = await render(
      <ThemeProvider scheme="light">
        <FormField label="Email" required>
          <Input testID="input" />
        </FormField>
      </ThemeProvider>,
    );
    expect(screen.getByTestId("input").props.accessibilityHint).toBeUndefined();
    expect(announce).not.toHaveBeenCalled();

    await rerender(
      <ThemeProvider scheme="light">
        <FormField label="Email" required error="Enter a valid email">
          <Input testID="input" />
        </FormField>
      </ThemeProvider>,
    );
    const input = screen.getByTestId("input");
    expect(input.props["aria-label"]).toBe("Email, required");
    expect(input.props.accessibilityHint).toBe("Enter a valid email");
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Enter a valid email");
  });

  test("the visible label, description and error are hidden from screen readers", async () => {
    await renderUI(
      <FormField label="Email" description="Helper">
        <Input />
      </FormField>,
    );
    expect(screen.queryByText("Email")).toBeNull();
    expect(screen.queryByText("Helper")).toBeNull();
  });

  test("status success passes down and is announced by the control", async () => {
    await renderUI(
      <FormField label="Username" status="success">
        <Input testID="input" />
      </FormField>,
    );
    expect(StyleSheet.flatten(screen.getByTestId("input").parent!.props.style)).toMatchObject({
      borderColor: colors.light.success,
    });
    expect(announce).toHaveBeenCalledWith("Username: success");
  });

  test("style is merged last", async () => {
    await renderUI(<FormField testID="field" label="A" style={{ gap: 2, marginTop: 4 }} />);
    expect(StyleSheet.flatten(screen.getByTestId("field").props.style)).toMatchObject({
      gap: 2,
      marginTop: 4,
    });
  });
});
