import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { Star } from "lucide-react-native";
import { Dimensions, StyleSheet } from "react-native";

import { Chip, ChipGroup, type ChipGroupProps, type ChipProps } from "@/registry/components/chip";
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

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

const mutableConfig = config as { haptics: boolean };
const { width, height } = Dimensions.get("window");
const s = (v: number) => scaleValue(v, computeScale(width, height));
const hidden = { includeHiddenElements: true } as const;

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

async function renderChip(props: Partial<ChipProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Chip testID="chip" label="Vegan" {...props} />
    </ThemeProvider>,
  );
  return screen.getByTestId("chip");
}

async function renderGroup(props: Partial<ChipGroupProps> = {}, disabledC = false) {
  await render(
    <ThemeProvider scheme="light">
      <ChipGroup testID="group" {...(props as ChipGroupProps)}>
        <Chip value="a" label="Apple" />
        <Chip value="b" label="Banana" />
        <Chip value="c" label="Cherry" disabled={disabledC} />
      </ChipGroup>
    </ThemeProvider>,
  );
  return screen.getByTestId("group");
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  mutableConfig.haptics = true;
  jest.clearAllMocks();
});

afterEach(() => {
  mutableConfig.haptics = true;
  setActiveStyle("vega");
});

describe("Chip: standalone", () => {
  test("a plain Chip is a button named by its label, with no haptic", async () => {
    const onPress = jest.fn();
    await renderChip({ onPress, icon: Star });
    const chip = screen.getByRole("button", { name: "Vegan" });
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(chip.props.accessibilityState.checked).toBeUndefined();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  test("uncontrolled toggle: a checkbox that flips itself, primary when selected", async () => {
    const onSelectedChange = jest.fn();
    const root = await renderChip({ defaultSelected: false, onSelectedChange });
    const chip = screen.getByRole("checkbox", { name: "Vegan" });
    expect(chip).not.toBeChecked();
    expect(flat(root).backgroundColor).toBe(colors.light.background);
    await fireEvent.press(chip);
    expect(chip).toBeChecked();
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(flat(root).backgroundColor).toBe(colors.light.primary);
    expect(screen.getByText("Vegan")).toHaveStyle({ color: colors.light.primaryForeground });
  });

  test("controlled toggle: follows selected and only reports changes", async () => {
    const onSelectedChange = jest.fn();
    await renderChip({ selected: true, onSelectedChange });
    const chip = screen.getByRole("checkbox");
    await fireEvent.press(chip);
    expect(onSelectedChange).toHaveBeenCalledWith(false);
    expect(chip).toBeChecked();
  });

  test("disabled: aria-disabled, dimmed, no change, no haptic", async () => {
    const onSelectedChange = jest.fn();
    const root = await renderChip({ disabled: true, onSelectedChange });
    expect(root).toBeDisabled();
    expect(flat(root).opacity).toBe(tokens.opacity.disabled);
    await fireEvent.press(root);
    expect(onSelectedChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});

describe("Chip: onRemove", () => {
  test("the × button removes by touch without toggling the Chip", async () => {
    const onRemove = jest.fn();
    const onSelectedChange = jest.fn();
    await renderChip({ onRemove, defaultSelected: false, onSelectedChange });
    await fireEvent.press(screen.getByTestId("chip-remove", hidden));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  test("screen readers get a Remove action; the × button is hidden from them", async () => {
    const onRemove = jest.fn();
    const root = await renderChip({ onRemove });
    expect(root.props.accessibilityActions).toEqual([{ name: "remove", label: "Remove" }]);
    await fireEvent(root, "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  test("no removal while disabled", async () => {
    const onRemove = jest.fn();
    const root = await renderChip({ onRemove, disabled: true });
    await fireEvent.press(screen.getByTestId("chip-remove", hidden));
    await fireEvent(root, "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    expect(onRemove).not.toHaveBeenCalled();
  });
});

describe("ChipGroup: single", () => {
  test("a radiogroup of radios; one at a time", async () => {
    const onValueChange = jest.fn();
    await renderGroup({ defaultValue: "a", onValueChange });
    expect(screen.getByTestId("group").props.role).toBe("radiogroup");
    expect(screen.getByRole("radio", { name: "Apple" })).toBeChecked();
    await fireEvent.press(screen.getByRole("radio", { name: "Banana" }));
    expect(screen.getByRole("radio", { name: "Banana" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Apple" })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  test("controlled: follows value and only reports changes", async () => {
    const onValueChange = jest.fn();
    await renderGroup({ value: "a", onValueChange });
    await fireEvent.press(screen.getByRole("radio", { name: "Banana" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("radio", { name: "Apple" })).toBeChecked();
  });

  test("a disabled Chip cannot be selected", async () => {
    const onValueChange = jest.fn();
    await renderGroup({ onValueChange }, true);
    const cherry = screen.getByRole("radio", { name: "Cherry" });
    expect(cherry).toBeDisabled();
    await fireEvent.press(cherry);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("wraps in a row; style is merged last", async () => {
    const group = await renderGroup({ style: { marginTop: 8 } });
    expect(flat(group)).toMatchObject({ flexDirection: "row", flexWrap: "wrap", marginTop: 8 });
  });
});

describe("ChipGroup: multiple", () => {
  test("a group of checkboxes that toggle independently", async () => {
    const onValueChange = jest.fn();
    await renderGroup({ type: "multiple", defaultValue: ["a"], onValueChange });
    expect(screen.getByTestId("group").props.role).toBe("group");
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    await fireEvent.press(screen.getByRole("checkbox", { name: "Banana" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
    await fireEvent.press(screen.getByRole("checkbox", { name: "Apple" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["b"]);
    expect(screen.getByRole("checkbox", { name: "Apple" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Banana" })).toBeChecked();
  });

  test("a disabled group disables every Chip", async () => {
    const onValueChange = jest.fn();
    await renderGroup({ type: "multiple", disabled: true, onValueChange });
    for (const c of screen.getAllByRole("checkbox")) expect(c).toBeDisabled();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Apple" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("Chip: Style Slots and touch target", () => {
  test("chip.root per Style; the label takes the Slot's type step", async () => {
    let root = await renderChip();
    expect(flat(root)).toMatchObject({ height: s(32), borderRadius: 9999 });
    expect(flat(root).fontSize).toBeUndefined();
    setActiveStyle("nova");
    root = await renderChip();
    expect(flat(root)).toMatchObject({ height: s(28), paddingHorizontal: s(10) });
    expect(screen.getByText("Vegan")).toHaveStyle({ fontSize: s(13), lineHeight: s(18) });
  });

  test("the height reaches 48 through hitSlop", async () => {
    setActiveStyle("nova");
    const root = await renderChip();
    expect(s(28) + root.props.hitSlop.top + root.props.hitSlop.bottom).toBeCloseTo(48);
  });

  test("the pressed look comes from the chip.pressed Slot", async () => {
    setActiveStyle("nova");
    expect(flat(await renderChip({ testOnly_pressed: true } as never))).toMatchObject({
      transform: [{ scale: 0.98 }],
    });
  });
});

describe("Chip: haptics", () => {
  test("a light tick when a toggle Chip changes", async () => {
    await fireEvent.press(await renderChip({ defaultSelected: false }));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  test("none when config.haptics is off", async () => {
    mutableConfig.haptics = false;
    await renderGroup({ type: "multiple" });
    await fireEvent.press(screen.getByRole("checkbox", { name: "Apple" }));
    expect(screen.getByRole("checkbox", { name: "Apple" })).toBeChecked();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
