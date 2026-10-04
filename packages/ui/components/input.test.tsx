import { fireEvent, render, screen } from "@testing-library/react-native";
import { Mail } from "lucide-react-native";
import type { ReactElement } from "react";
import { Dimensions, StyleSheet, TextInput } from "react-native";

import { FormField } from "@/registry/components/form-field";
import { Input, type InputProps } from "@/registry/components/input";
import { FocusChain } from "@/registry/components/primitives/focus-chain";
import { Textarea } from "@/registry/components/textarea";
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

async function renderUI(ui: ReactElement) {
  await render(<ThemeProvider scheme="light">{ui}</ThemeProvider>);
}

async function renderInput(props: Partial<InputProps> = {}) {
  await renderUI(<Input testID="input" aria-label="Email" {...props} />);
  return screen.getByTestId("input");
}

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;
/** The bordered frame around the TextInput (the Input's root). */
const frame = (input: ReturnType<typeof screen.getByTestId>) => flat(input.parent!.props.style);

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("Input: Style Slots and Colour Roles", () => {
  test.each([
    ["sm", t.controlHeight.sm, s(10)],
    ["md", t.controlHeight.md, t.spacing[3]],
    ["lg", t.controlHeight.lg, t.spacing[4]],
  ] as const)("Vega %s", async (size, h, padX) => {
    expect(frame(await renderInput({ size }))).toMatchObject({
      height: h,
      paddingHorizontal: padX,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: colors.light.input,
      backgroundColor: colors.light.background,
    });
  });

  test.each([
    ["sm", s(32), t.spacing[2]],
    ["md", t.controlHeight.sm, s(10)],
    ["lg", t.controlHeight.md, t.spacing[3]],
  ] as const)("Nova %s", async (size, h, padX) => {
    setActiveStyle("nova");
    expect(frame(await renderInput({ size }))).toMatchObject({
      height: h,
      paddingHorizontal: padX,
    });
  });

  test("text uses the input.root type and Colour Roles", async () => {
    const input = await renderInput({ placeholder: "you@example.com" });
    expect(flat(input.props.style)).toMatchObject({
      fontSize: t.type.body.fontSize,
      color: colors.light.foreground,
    });
    expect(input.props.placeholderTextColor).toBe(colors.light.mutedForeground);
    setActiveStyle("nova");
    expect(flat((await renderInput()).props.style).fontSize).toBe(s(15));
  });

  test("focus draws the ring in the ring Colour Role; blur removes it", async () => {
    const input = await renderInput();
    expect(frame(input).outlineWidth).toBeUndefined();
    await fireEvent(input, "focus");
    expect(frame(screen.getByTestId("input"))).toMatchObject({
      borderColor: colors.light.ring,
      outlineColor: colors.light.ring,
      outlineWidth: 2,
    });
    await fireEvent(screen.getByTestId("input"), "blur");
    expect(frame(screen.getByTestId("input")).outlineWidth).toBeUndefined();
  });

  test("a leading icon is decorative", async () => {
    await renderInput({ icon: Mail });
    const [icon] = screen.getByTestId("input").parent!.children as { props: object }[];
    expect(icon!.props).toMatchObject({ "aria-hidden": true });
  });

  test("style is merged last onto the frame", async () => {
    expect(frame(await renderInput({ style: { marginTop: 8, height: 60 } }))).toMatchObject({
      marginTop: 8,
      height: 60,
    });
  });
});

describe("Input: 48 touch target", () => {
  /** The frame (a Pressable that focuses the field) around the TextInput. */
  const frameEl = () => screen.getByTestId("input").parent!;

  /** The tap area extends above and below the frame to 48; sides are left alone. */
  function expectHitArea(h: number) {
    const slop = frameEl().props.hitSlop;
    if (h >= tokens.minTouchTarget) {
      expect(slop).toBeUndefined();
      return;
    }
    expect(slop.left).toBe(0);
    expect(slop.right).toBe(0);
    expect(slop.top).toBe(slop.bottom);
    expect(h + slop.top + slop.bottom).toBeCloseTo(tokens.minTouchTarget);
  }

  test.each([
    ["vega", "sm", t.controlHeight.sm],
    ["vega", "md", t.controlHeight.md],
    ["vega", "lg", t.controlHeight.lg],
    ["nova", "sm", s(32)],
    ["nova", "md", t.controlHeight.sm],
    ["nova", "lg", t.controlHeight.md],
  ] as const)("%s %s: the visual height stays, the tap area reaches 48", async (style, size, h) => {
    setActiveStyle(style);
    expect(frame(await renderInput({ size })).height).toBe(h);
    expectHitArea(h);
  });

  test("Nova's 36-high field gets hitSlop at Scale 1", async () => {
    // The test window's Scale is above 1; a height set through style is used as-is.
    setActiveStyle("nova");
    await renderInput({ style: { height: 36 } });
    expect(frameEl().props.hitSlop).toEqual({ top: 6, bottom: 6, left: 0, right: 0 });
  });

  test("a tap on the frame or its hitSlop focuses the field", async () => {
    setActiveStyle("nova");
    const ref = { current: null as TextInput | null };
    await renderInput({ ref });
    const focus = jest.spyOn(ref.current!, "focus").mockImplementation(() => {});
    await fireEvent.press(frameEl());
    expect(focus).toHaveBeenCalledTimes(1);
    focus.mockRestore();
  });

  test("no focus from the frame while disabled or not editable", async () => {
    for (const props of [{ disabled: true }, { editable: false }]) {
      const ref = { current: null as TextInput | null };
      await renderInput({ ref, ...props });
      const focus = jest.spyOn(ref.current!, "focus").mockImplementation(() => {});
      await fireEvent.press(frameEl());
      expect(focus).not.toHaveBeenCalled();
      focus.mockRestore();
    }
  });

  test("screen readers skip the frame and reach the TextInput", async () => {
    setActiveStyle("nova");
    const input = await renderInput();
    expect(frameEl().props).toMatchObject({ accessible: false, importantForAccessibility: "no" });
    expect(frameEl().props.role).toBeUndefined();
    expect(screen.getByLabelText("Email")).toBe(input);
  });
});

describe("Input: states", () => {
  test.each([
    ["error", colors.light.destructive],
    ["success", colors.light.success],
  ] as const)("status %s colours the border and is announced", async (status, color) => {
    expect(frame(await renderInput({ status }))).toMatchObject({ borderColor: color });
    expect(announce).toHaveBeenCalledWith(`Email: ${status}`);
  });

  test("disabled: not editable, aria-disabled, dimmed; status is suppressed", async () => {
    const input = await renderInput({ disabled: true, status: "error" });
    expect(input.props.editable).toBe(false);
    expect(input.props["aria-disabled"]).toBe(true);
    expect(frame(input)).toMatchObject({
      opacity: tokens.opacity.disabled,
      borderColor: colors.light.input,
    });
    expect(announce).not.toHaveBeenCalled();
  });

  test("TextInput props and a hint pass through; onChangeText fires", async () => {
    const onChangeText = jest.fn();
    const input = await renderInput({
      onChangeText,
      keyboardType: "email-address",
      accessibilityHint: "Your work email",
    });
    expect(input.props.keyboardType).toBe("email-address");
    expect(input.props.accessibilityHint).toBe("Your work email");
    await fireEvent.changeText(input, "a@b.co");
    expect(onChangeText).toHaveBeenCalledWith("a@b.co");
  });

  test("merges its own ref with an object ref and a callback ref", async () => {
    const objectRef = { current: null as TextInput | null };
    const callback = jest.fn();
    await renderUI(
      <>
        <Input ref={objectRef} aria-label="A" />
        <Input ref={callback} aria-label="B" />
      </>,
    );
    expect(objectRef.current).not.toBeNull();
    expect(callback).toHaveBeenCalledWith(expect.anything());
  });
});

describe("Input: password reveal", () => {
  test("secureTextEntry adds a Show/Hide toggle that reveals the text", async () => {
    const input = await renderInput({ secureTextEntry: true });
    expect(input.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByTestId("input").props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByTestId("input").props.secureTextEntry).toBe(true);
  });

  test("the toggle reaches the 48 tap target and is blocked while disabled", async () => {
    await renderInput({ secureTextEntry: true, disabled: true });
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(t.iconSize.md + toggle.props.hitSlop.top + toggle.props.hitSlop.bottom).toBeCloseTo(48);
    expect(toggle).toBeDisabled();
    await fireEvent.press(toggle);
    expect(screen.getByTestId("input").props.secureTextEntry).toBe(true);
  });

  test("no toggle without secureTextEntry", async () => {
    await renderInput();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("Input inside FormField", () => {
  test('reads "Email, required" with the error as its hint; the visible copies are hidden', async () => {
    await renderUI(
      <FormField label="Email" error="Enter a valid email" required>
        <Input testID="input" />
      </FormField>,
    );
    const input = screen.getByTestId("input");
    expect(input.props["aria-label"]).toBe("Email, required");
    expect(input.props.accessibilityHint).toBe("Enter a valid email");
    // Name and error are read through the control, so the visible Label and error are hidden.
    expect(screen.queryByText("Email")).toBeNull();
    expect(screen.queryByText("Enter a valid email")).toBeNull();
    expect(screen.getByText("Enter a valid email", hidden)).toHaveStyle({
      color: colors.light.destructive,
    });
  });

  test("the error sets the error status and is announced once, by the FormField", async () => {
    await renderUI(
      <FormField label="Email" error="Enter a valid email">
        <Input testID="input" />
      </FormField>,
    );
    expect(frame(screen.getByTestId("input")).borderColor).toBe(colors.light.destructive);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Enter a valid email");
  });

  test("the description is the hint when there is no error; disabled passes down", async () => {
    await renderUI(
      <FormField label="Name" description="As on your passport" disabled>
        <Input testID="input" />
      </FormField>,
    );
    const input = screen.getByTestId("input");
    expect(input.props["aria-label"]).toBe("Name");
    expect(input.props.accessibilityHint).toBe("As on your passport");
    expect(input.props.editable).toBe(false);
  });

  test("the field's own aria-label and status win", async () => {
    await renderUI(
      <FormField label="Email" status="error">
        <Input testID="input" aria-label="Work email" status="success" />
      </FormField>,
    );
    const input = screen.getByTestId("input");
    expect(input.props["aria-label"]).toBe("Work email");
    expect(frame(input).borderColor).toBe(colors.light.success);
  });
});

describe("Input inside FocusChain", () => {
  test("Next moves to the following Input, Done submits; Textarea is skipped", async () => {
    const onSubmit = jest.fn();
    const passwordRef = { current: null as TextInput | null };
    await renderUI(
      <FocusChain onSubmit={onSubmit}>
        <FormField label="Email">
          <Input testID="email" />
        </FormField>
        <Textarea testID="notes" aria-label="Notes" />
        <FormField label="Password">
          <Input testID="password" secureTextEntry ref={passwordRef} />
        </FormField>
      </FocusChain>,
    );
    const email = screen.getByTestId("email");
    const password = screen.getByTestId("password");
    expect(email.props.returnKeyType).toBe("next");
    expect(password.props.returnKeyType).toBe("done");
    // Textarea keeps Enter for new lines.
    expect(screen.getByTestId("notes").props.returnKeyType).toBeUndefined();

    // The chain focuses the same TextInput the user's ref points at (refs are merged).
    const focus = jest.spyOn(passwordRef.current!, "focus").mockImplementation(() => {});
    await fireEvent(email, "submitEditing");
    expect(focus).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent(password, "submitEditing");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("a field's own returnKeyType and onSubmitEditing win", async () => {
    const own = jest.fn();
    const onSubmit = jest.fn();
    await renderUI(
      <FocusChain onSubmit={onSubmit}>
        <Input testID="a" aria-label="A" returnKeyType="go" onSubmitEditing={own} />
        <Input testID="b" aria-label="B" />
      </FocusChain>,
    );
    expect(screen.getByTestId("a").props.returnKeyType).toBe("go");
    await fireEvent(screen.getByTestId("a"), "submitEditing");
    expect(own).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("a disabled Input is skipped", async () => {
    await renderUI(
      <FocusChain>
        <Input testID="a" aria-label="A" />
        <Input testID="b" aria-label="B" disabled />
      </FocusChain>,
    );
    expect(screen.getByTestId("a").props.returnKeyType).toBe("done");
  });
});
