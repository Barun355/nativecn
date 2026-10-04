import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

import { Checkbox, type CheckboxProps } from "@/registry/components/checkbox";
import { FormField } from "@/registry/components/form-field";
import { setActiveStyle } from "@/registry/styles";
import {
  ThemeProvider,
  colors,
  computeScale,
  config,
  scaleValue,
  tokens,
  useSchemeStore,
} from "@/registry/theme";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

// Glyphs become marked Views, so the box's content can be found.
jest.mock("lucide-react-native", () => {
  const actual = jest.requireActual("lucide-react-native");
  const { View: RNView } = jest.requireActual("react-native");
  return {
    ...actual,
    Check: () => <RNView testID="glyph-check" />,
    Minus: () => <RNView testID="glyph-minus" />,
  };
});

const mutableConfig = config as { haptics: boolean };
const { width, height } = Dimensions.get("window");
const s = (v: number) => scaleValue(v, computeScale(width, height));
const hidden = { includeHiddenElements: true } as const;

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

async function renderCheckbox(props: Partial<CheckboxProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Checkbox testID="cb" label="Accept" {...props} />
    </ThemeProvider>,
  );
  return screen.getByTestId("cb");
}

/** The box: the first child View of the root. */
const boxOf = (root: ReturnType<typeof screen.getByTestId>) =>
  root.children[0] as ReturnType<typeof screen.getByTestId>;

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  mutableConfig.haptics = true;
  jest.clearAllMocks();
});

afterEach(() => {
  mutableConfig.haptics = true;
  setActiveStyle("vega");
});

describe("Checkbox: state", () => {
  test("uncontrolled: starts at defaultChecked and toggles itself", async () => {
    const onCheckedChange = jest.fn();
    await renderCheckbox({ defaultChecked: true, onCheckedChange });
    const cb = screen.getByRole("checkbox", { name: "Accept" });
    expect(cb).toBeChecked();
    await fireEvent.press(cb);
    expect(cb).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    await fireEvent.press(cb);
    expect(cb).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  test("controlled: follows checked and only reports changes", async () => {
    const onCheckedChange = jest.fn();
    await renderCheckbox({ checked: false, onCheckedChange });
    const cb = screen.getByRole("checkbox");
    await fireEvent.press(cb);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(cb).not.toBeChecked();
  });

  test("controlled by a parent", async () => {
    function Parent() {
      const [checked, setChecked] = useState(false);
      return <Checkbox label="Accept" checked={checked} onCheckedChange={setChecked} />;
    }
    await render(
      <ThemeProvider scheme="light">
        <Parent />
      </ThemeProvider>,
    );
    const cb = screen.getByRole("checkbox");
    await fireEvent.press(cb);
    expect(cb).toBeChecked();
  });

  test("indeterminate: announced mixed, shows a dash, pressing checks it", async () => {
    const onCheckedChange = jest.fn();
    const root = await renderCheckbox({ indeterminate: true, onCheckedChange });
    expect(root.props.accessibilityState.checked).toBe("mixed");
    expect(screen.getByRole("checkbox")).toBePartiallyChecked();
    expect(screen.getByTestId("glyph-minus", hidden)).toBeTruthy();
    await fireEvent.press(root);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  test("checked shows a check on a primary box; unchecked shows nothing", async () => {
    const root = await renderCheckbox({ defaultChecked: true });
    expect(screen.getByTestId("glyph-check", hidden)).toBeTruthy();
    expect(flat(boxOf(root)).backgroundColor).toBe(colors.light.primary);
    await fireEvent.press(root);
    expect(screen.queryByTestId("glyph-check", hidden)).toBeNull();
    expect(flat(boxOf(root)).borderColor).toBe(colors.light.input);
  });
});

describe("Checkbox: accessibility", () => {
  test("disabled: aria-disabled, dimmed, no change, no haptic", async () => {
    const onCheckedChange = jest.fn();
    const root = await renderCheckbox({ disabled: true, onCheckedChange });
    expect(root).toBeDisabled();
    expect(flat(root).opacity).toBe(tokens.opacity.disabled);
    await fireEvent.press(root);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  test("without a label the box reaches 48 through hitSlop", async () => {
    const root = await renderCheckbox({ label: undefined, "aria-label": "Select row" });
    expect(screen.getByRole("checkbox", { name: "Select row" })).toBeTruthy();
    expect(s(20) + root.props.hitSlop.top + root.props.hitSlop.bottom).toBeCloseTo(48);
    expect(s(20) + root.props.hitSlop.left + root.props.hitSlop.right).toBeCloseTo(48);
  });

  test("passes a ref, hint and style (merged last) through", async () => {
    const ref = { current: null as View | null };
    await render(
      <ThemeProvider scheme="light">
        <Checkbox
          ref={ref}
          testID="cb"
          label="Accept"
          accessibilityHint="Required to continue"
          style={{ marginTop: 10, alignSelf: "stretch" }}
        />
      </ThemeProvider>,
    );
    const root = screen.getByTestId("cb");
    expect(ref.current).not.toBeNull();
    expect(root.props.accessibilityHint).toBe("Required to continue");
    expect(flat(root)).toMatchObject({ marginTop: 10, alignSelf: "stretch" });
  });
});

describe("Checkbox: inside a FormField", () => {
  test("takes the field's label and error as name and hint; an error outlines the box", async () => {
    await render(
      <ThemeProvider scheme="light">
        <FormField label="Terms" error="Accept the terms to continue" required>
          <Checkbox testID="cb" label="I agree" />
        </FormField>
      </ThemeProvider>,
    );
    const root = screen.getByTestId("cb");
    expect(screen.getByRole("checkbox", { name: "Terms, required" })).toBe(root);
    expect(root.props.accessibilityHint).toBe("Accept the terms to continue");
    expect(flat(boxOf(root)).borderColor).toBe(colors.light.destructive);
  });

  test("takes the field's disabled unless its own is set", async () => {
    const onCheckedChange = jest.fn();
    await render(
      <ThemeProvider scheme="light">
        <FormField label="Terms" disabled>
          <Checkbox testID="cb" onCheckedChange={onCheckedChange} />
        </FormField>
        <FormField label="News" disabled>
          <Checkbox testID="cb2" disabled={false} />
        </FormField>
      </ThemeProvider>,
    );
    expect(screen.getByTestId("cb")).toBeDisabled();
    await fireEvent.press(screen.getByTestId("cb"));
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("cb2").props.accessibilityState.disabled).toBe(false);
  });
});

describe("Checkbox: Style Slots", () => {
  test("checkbox.box per Style", async () => {
    let root = await renderCheckbox();
    expect(flat(boxOf(root))).toMatchObject({ width: s(20), height: s(20) });
    setActiveStyle("nova");
    root = await renderCheckbox();
    expect(flat(boxOf(root))).toMatchObject({ width: s(18), height: s(18), borderRadius: s(4) });
  });

  test("the pressed look comes from the checkbox.pressed Slot", async () => {
    expect(flat(await renderCheckbox({ testOnly_pressed: true } as never))).toMatchObject({
      opacity: 0.7,
    });
  });
});

describe("Checkbox: haptics", () => {
  test("a light tick on toggle", async () => {
    await fireEvent.press(await renderCheckbox());
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  test("none when config.haptics is off", async () => {
    mutableConfig.haptics = false;
    const onCheckedChange = jest.fn();
    await fireEvent.press(await renderCheckbox({ onCheckedChange }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
