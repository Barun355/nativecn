import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Dimensions, StyleSheet, TextInput } from "react-native";

import { InputOTP, sanitizeCode, type InputOTPProps } from "@/registry/components/input-otp";
import { FocusChain } from "@/registry/components/primitives/focus-chain";
import { FormFieldProvider } from "@/registry/components/primitives/form-field-context";
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

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale, { radiusBase: tokens.radiusBase });
const s = (v: number) => scaleValue(v, scale);
const hidden = { includeHiddenElements: true } as const;

async function renderOTP(props: Partial<InputOTPProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <InputOTP testID="otp" {...props} />
    </ThemeProvider>,
  );
  return screen.getByTestId("otp-input");
}

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
const cell = (i: number) => screen.getByTestId(`otp-cell-${i}`, hidden);
const cellText = (i: number) =>
  (cell(i).children[0] as { props: { children?: string } } | undefined)?.props.children;
const type = (text: string) => fireEvent.changeText(screen.getByTestId("otp-input"), text);

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("sanitizeCode", () => {
  test("keeps digits only, up to the length", () => {
    expect(sanitizeCode("12a3 4-56789", 6)).toBe("123456");
    expect(sanitizeCode("", 4)).toBe("");
  });
});

describe("InputOTP: cells and typing", () => {
  test("renders 6 cells by default and `length` cells when set", async () => {
    await renderOTP();
    expect(screen.getAllByTestId(/^otp-cell-/, hidden)).toHaveLength(6);
    await renderOTP({ length: 4 });
    expect(screen.getAllByTestId(/^otp-cell-/, hidden)).toHaveLength(4);
  });

  test("typing fills the cells in order and reports digits", async () => {
    const onChangeText = jest.fn();
    await renderOTP({ onChangeText });
    await type("12");
    expect(onChangeText).toHaveBeenLastCalledWith("12");
    expect([cellText(0), cellText(1), cellText(2)]).toEqual(["1", "2", undefined]);
    await type("1");
    expect(onChangeText).toHaveBeenLastCalledWith("1");
    expect(cellText(1)).toBeUndefined();
  });

  test("non-digits are ignored", async () => {
    const onChangeText = jest.fn();
    await renderOTP({ onChangeText });
    await type("a");
    expect(onChangeText).not.toHaveBeenCalled();
  });

  test("a paste fills every cell, dropping separators and extra digits", async () => {
    const onChangeText = jest.fn();
    const onComplete = jest.fn();
    await renderOTP({ onChangeText, onComplete });
    await type("123 456 789");
    expect(onChangeText).toHaveBeenCalledWith("123456");
    expect([0, 1, 2, 3, 4, 5].map(cellText)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  test("onComplete fires when the last cell is filled, and again after an edit", async () => {
    const onComplete = jest.fn();
    await renderOTP({ length: 4, onComplete });
    await type("123");
    expect(onComplete).not.toHaveBeenCalled();
    await type("1234");
    expect(onComplete).toHaveBeenCalledWith("1234");
    await type("12345"); // already full: nothing changes
    expect(onComplete).toHaveBeenCalledTimes(1);
    await type("123");
    await type("1239");
    expect(onComplete).toHaveBeenLastCalledWith("1239");
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  test("numeric keyboard and one-time-code autofill on the hidden input", async () => {
    const input = await renderOTP();
    expect(input.props.keyboardType).toBe("number-pad");
    expect(input.props.inputMode).toBe("numeric");
    expect(input.props.autoComplete).toBe("one-time-code");
    expect(input.props.textContentType).toBe("oneTimeCode");
    expect(input.props.caretHidden).toBe(true);
  });

  test("the focused empty cell gets the active border", async () => {
    await renderOTP();
    expect(flat(cell(0)).borderColor).toBe(colors.light.input);
    await fireEvent(screen.getByTestId("otp-input"), "focus");
    expect(flat(cell(0)).borderColor).toBe(colors.light.ring);
    await type("1");
    expect(flat(cell(0)).borderColor).toBe(colors.light.input);
    expect(flat(cell(1)).borderColor).toBe(colors.light.ring);
    await fireEvent(screen.getByTestId("otp-input"), "blur");
    expect(flat(cell(1)).borderColor).toBe(colors.light.input);
  });
});

describe("InputOTP: controlled and uncontrolled", () => {
  test("uncontrolled: starts at defaultValue", async () => {
    await renderOTP({ defaultValue: "42" });
    expect([cellText(0), cellText(1)]).toEqual(["4", "2"]);
    expect(screen.getByTestId("otp-input").props.value).toBe("42");
  });

  test("controlled: shows `value` and only changes when the parent applies it", async () => {
    const onChangeText = jest.fn();
    await renderOTP({ value: "11", onChangeText });
    await type("119");
    expect(onChangeText).toHaveBeenCalledWith("119");
    expect(cellText(2)).toBeUndefined();

    function Parent() {
      const [code, setCode] = useState("");
      return <InputOTP testID="otp" value={code} onChangeText={setCode} />;
    }
    await render(
      <ThemeProvider scheme="light">
        <Parent />
      </ThemeProvider>,
    );
    await type("7");
    expect(cellText(0)).toBe("7");
  });
});

describe("InputOTP: status, secure and disabled", () => {
  test.each([
    ["error", colors.light.destructive],
    ["success", colors.light.success],
  ] as const)("%s colours every cell and is announced", async (status, color) => {
    await renderOTP({ status });
    for (const i of [0, 5]) expect(flat(cell(i)).borderColor).toBe(color);
    expect(announce).toHaveBeenCalledWith(`Code: ${status}`);
  });

  test("secure shows dots and hides the digits from screen readers", async () => {
    const input = await renderOTP({ secure: true, defaultValue: "12" });
    expect([cellText(0), cellText(1)]).toEqual(["•", "•"]);
    expect(screen.queryByText("1", hidden)).toBeNull();
    expect(input.props.secureTextEntry).toBe(true);
  });

  test("disabled blocks typing, hides status and is announced", async () => {
    const onChangeText = jest.fn();
    const input = await renderOTP({ disabled: true, status: "error", onChangeText });
    expect(input.props.editable).toBe(false);
    expect(input).toBeDisabled();
    await type("1");
    expect(onChangeText).not.toHaveBeenCalled();
    expect(flat(cell(0)).borderColor).toBe(colors.light.input);
    expect(announce).not.toHaveBeenCalled();
  });
});

describe("InputOTP: accessibility, FormField and FocusChain", () => {
  test('reads as one field: "Code, 6 digits"; the cells are hidden', async () => {
    await renderOTP();
    expect(screen.getByLabelText("Code, 6 digits")).toBe(screen.getByTestId("otp-input"));
    expect(screen.queryByTestId("otp-cell-0")).toBeNull();
    await renderOTP({ length: 4, "aria-label": "PIN", accessibilityHint: "From your bank" });
    const input = screen.getByLabelText("PIN, 4 digits");
    expect(input.props.accessibilityHint).toBe("From your bank");
  });

  test("inside FormField: label, required, error hint and status; the field announces", async () => {
    await render(
      <ThemeProvider scheme="light">
        <FormFieldProvider label="Verification code" required error="Wrong code">
          <InputOTP testID="otp" />
        </FormFieldProvider>
      </ThemeProvider>,
    );
    const input = screen.getByLabelText("Verification code, required, 6 digits");
    expect(input.props.accessibilityHint).toBe("Wrong code");
    expect(flat(cell(0)).borderColor).toBe(colors.light.destructive);
    // FormField announces its error text; the field does not repeat a bare "error".
    expect(announce).toHaveBeenCalledWith("Wrong code");
    expect(announce).not.toHaveBeenCalledWith(expect.stringMatching(/: error$/));
  });

  test("inside a disabled FormField it is disabled", async () => {
    await render(
      <ThemeProvider scheme="light">
        <FormFieldProvider label="Code" disabled>
          <InputOTP testID="otp" />
        </FormFieldProvider>
      </ThemeProvider>,
    );
    expect(screen.getByTestId("otp-input").props.editable).toBe(false);
  });

  test("joins a FocusChain as one field", async () => {
    const onSubmit = jest.fn();
    await render(
      <ThemeProvider scheme="light">
        <FocusChain onSubmit={onSubmit}>
          <TextInput testID="email" />
          <InputOTP testID="otp" />
        </FocusChain>
      </ThemeProvider>,
    );
    const input = screen.getByTestId("otp-input");
    expect(input.props.returnKeyType).toBe("done");
    await fireEvent(input, "submitEditing");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("ref reaches the hidden TextInput", async () => {
    const ref = { current: null as TextInput | null };
    await renderOTP({ ref });
    expect(ref.current).toBeTruthy();
    expect(typeof ref.current?.focus).toBe("function");
  });
});

describe("InputOTP: Style Slots", () => {
  test.each([
    ["vega", { width: s(48), height: s(56), borderRadius: t.radius.md }, t.spacing[2]],
    ["nova", { width: s(40), height: s(48), borderRadius: t.radius.sm }, s(6)],
  ] as const)("%s fills input-otp.cell and input-otp.root", async (style, cellSize, gap) => {
    setActiveStyle(style);
    await renderOTP();
    expect(flat(cell(0))).toMatchObject(cellSize);
    expect(flat(cell(0).parent!).gap).toBe(gap);
  });

  test("style is merged last onto the root", async () => {
    await renderOTP({ style: { alignSelf: "stretch" } });
    expect(flat(screen.getByTestId("otp")).alignSelf).toBe("stretch");
  });
});
