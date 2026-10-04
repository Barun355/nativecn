import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState, type ReactElement } from "react";
import { Dimensions, StyleSheet } from "react-native";

import { FormField } from "@/registry/components/form-field";
import { Textarea, type TextareaProps } from "@/registry/components/textarea";
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
const pad = t.spacing[2];

async function renderUI(ui: ReactElement) {
  await render(<ThemeProvider scheme="light">{ui}</ThemeProvider>);
}

async function renderTextarea(props: Partial<TextareaProps> = {}) {
  await renderUI(<Textarea testID="textarea" aria-label="Notes" {...props} />);
  return screen.getByTestId("textarea");
}

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("Textarea: auto-grow", () => {
  test("is multiline and grows from 3 to 8 rows by default", async () => {
    const el = await renderTextarea();
    const line = t.type.body.lineHeight!;
    expect(el.props.multiline).toBe(true);
    expect(flat(el.props.style)).toMatchObject({
      minHeight: 3 * line + 2 * pad,
      maxHeight: 8 * line + 2 * pad,
      lineHeight: line,
      textAlignVertical: "top",
    });
  });

  test("minRows and maxRows set the bounds, with the Style's line height", async () => {
    setActiveStyle("nova");
    const el = await renderTextarea({ minRows: 2, maxRows: 5 });
    const line = scaleValue(20, scale);
    expect(flat(el.props.style)).toMatchObject({
      minHeight: 2 * line + 2 * pad,
      maxHeight: 5 * line + 2 * pad,
    });
  });

  test("the frame is not fixed-height and uses the Input's Colour Roles", async () => {
    const el = await renderTextarea();
    expect(flat(el.parent!.props.style)).toMatchObject({
      height: "auto",
      borderColor: colors.light.input,
      borderRadius: t.radius.md,
    });
  });
});

describe("Textarea: counter", () => {
  test("appears with maxLength and counts as you type (uncontrolled)", async () => {
    const onChangeText = jest.fn();
    const el = await renderTextarea({ maxLength: 10, defaultValue: "Hi", onChangeText });
    expect(el.props.maxLength).toBe(10);
    expect(screen.getByText("2/10")).toBeTruthy();
    expect(screen.getByLabelText("2 of 10 characters")).toBeTruthy();

    await fireEvent.changeText(el, "Hello");
    expect(onChangeText).toHaveBeenCalledWith("Hello");
    expect(screen.getByText("5/10")).toBeTruthy();
  });

  test("follows a controlled value", async () => {
    function Controlled() {
      const [value, setValue] = useState("abc");
      return <Textarea testID="textarea" value={value} onChangeText={setValue} maxLength={20} />;
    }
    await renderUI(<Controlled />);
    expect(screen.getByText("3/20")).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId("textarea"), "abcdef");
    expect(screen.getByText("6/20")).toBeTruthy();
  });

  test("no counter without maxLength", async () => {
    await renderTextarea({ defaultValue: "Hi" });
    expect(screen.queryByText(/\/\d+/)).toBeNull();
  });
});

describe("Textarea: states", () => {
  test("inside FormField it reads the label and error and shows the error colour", async () => {
    await renderUI(
      <FormField label="Bio" error="Too short">
        <Textarea testID="textarea" />
      </FormField>,
    );
    const el = screen.getByTestId("textarea");
    expect(el.props["aria-label"]).toBe("Bio");
    expect(el.props.accessibilityHint).toBe("Too short");
    expect(flat(el.parent!.props.style).borderColor).toBe(colors.light.destructive);
  });

  test("disabled: not editable and dimmed", async () => {
    const el = await renderTextarea({ disabled: true });
    expect(el.props.editable).toBe(false);
    expect(el.props["aria-disabled"]).toBe(true);
  });

  test("style is merged last onto the root", async () => {
    const el = await renderTextarea({ maxLength: 5, style: { marginTop: 12 } });
    expect(flat(el.parent!.parent!.props.style)).toMatchObject({ marginTop: 12 });
  });
});
