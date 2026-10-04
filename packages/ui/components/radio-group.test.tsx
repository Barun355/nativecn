import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { Dimensions, StyleSheet } from "react-native";

import {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
} from "@/registry/components/radio-group";
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

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

async function renderGroup(props: Partial<RadioGroupProps> = {}, lastDisabled = false) {
  await render(
    <ThemeProvider scheme="light">
      <RadioGroup testID="group" {...props}>
        <RadioGroupItem testID="item-a" value="a" label="Apple" />
        <RadioGroupItem testID="item-b" value="b" label="Banana" />
        <RadioGroupItem testID="item-c" value="c" label="Cherry" disabled={lastDisabled} />
      </RadioGroup>
    </ThemeProvider>,
  );
  return screen.getByTestId("group");
}

const radio = (name: string) => screen.getByRole("radio", { name });

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  mutableConfig.haptics = true;
  jest.clearAllMocks();
});

afterEach(() => {
  mutableConfig.haptics = true;
  setActiveStyle("vega");
});

describe("RadioGroup: state", () => {
  test("uncontrolled: starts at defaultValue and moves on press", async () => {
    const onValueChange = jest.fn();
    await renderGroup({ defaultValue: "a", onValueChange });
    expect(radio("Apple")).toBeChecked();
    expect(radio("Banana")).not.toBeChecked();
    await fireEvent.press(radio("Banana"));
    expect(radio("Banana")).toBeChecked();
    expect(radio("Apple")).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  test("controlled: follows value and only reports changes", async () => {
    const onValueChange = jest.fn();
    await renderGroup({ value: "a", onValueChange });
    await fireEvent.press(radio("Banana"));
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(radio("Apple")).toBeChecked();
  });

  test("the selected item shows the inner dot in primary", async () => {
    await renderGroup({ defaultValue: "a" });
    const dot = screen.getByTestId("item-a").children[0] as never as {
      props: Record<string, unknown>;
      children: unknown[];
    };
    expect(flat(dot).borderColor).toBe(colors.light.primary);
    expect(dot.children).toHaveLength(1);
  });
});

describe("RadioGroup: accessibility", () => {
  test("a radiogroup of radios", async () => {
    await renderGroup();
    expect(screen.getByTestId("group").props.role).toBe("radiogroup");
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  test("a disabled item: aria-disabled, dimmed, not selectable, no haptic", async () => {
    const onValueChange = jest.fn();
    await renderGroup({ onValueChange }, true);
    const cherry = screen.getByTestId("item-c");
    expect(cherry).toBeDisabled();
    expect(flat(cherry).opacity).toBe(tokens.opacity.disabled);
    await fireEvent.press(cherry);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  test("a disabled group disables every item", async () => {
    const onValueChange = jest.fn();
    await renderGroup({ disabled: true, onValueChange });
    for (const r of screen.getAllByRole("radio")) expect(r).toBeDisabled();
    await fireEvent.press(radio("Apple"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("an item without a label reaches 48 through hitSlop", async () => {
    await render(
      <ThemeProvider scheme="light">
        <RadioGroup>
          <RadioGroupItem testID="bare" value="x" aria-label="Option X" />
        </RadioGroup>
      </ThemeProvider>,
    );
    const item = screen.getByTestId("bare");
    expect(s(20) + item.props.hitSlop.top + item.props.hitSlop.bottom).toBeCloseTo(48);
  });
});

describe("RadioGroup: layout and Style Slots", () => {
  test("orientation sets the direction; style is merged last", async () => {
    expect(flat(await renderGroup()).flexDirection).toBe("column");
    const group = await renderGroup({ orientation: "horizontal", style: { marginTop: 4 } });
    expect(flat(group)).toMatchObject({ flexDirection: "row", marginTop: 4 });
  });

  test("radio.dot per Style", async () => {
    await renderGroup();
    const dot = () => screen.getByTestId("item-a").children[0] as never;
    expect(flat(dot())).toMatchObject({ width: s(20), height: s(20) });
    setActiveStyle("nova");
    await renderGroup();
    expect(flat(dot())).toMatchObject({ width: s(18), height: s(18) });
  });

  test("the pressed look comes from the radio.pressed Slot", async () => {
    await render(
      <ThemeProvider scheme="light">
        <RadioGroup>
          <RadioGroupItem
            testID="p"
            value="x"
            label="X"
            {...({ testOnly_pressed: true } as object)}
          />
        </RadioGroup>
      </ThemeProvider>,
    );
    expect(flat(screen.getByTestId("p")).opacity).toBe(0.7);
  });
});

describe("RadioGroup: haptics", () => {
  test("a light tick on selection", async () => {
    await renderGroup();
    await fireEvent.press(radio("Apple"));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  test("none when config.haptics is off", async () => {
    mutableConfig.haptics = false;
    await renderGroup();
    await fireEvent.press(radio("Apple"));
    expect(radio("Apple")).toBeChecked();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
