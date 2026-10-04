import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { User } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import {
  SegmentedTabs,
  SegmentedTabsContent,
  SegmentedTabsList,
  SegmentedTabsTrigger,
  type SegmentedTabsProps,
} from "@/registry/components/segmented-tabs";
import { Text } from "@/registry/components/text";
import { setActiveStyle } from "@/registry/styles";
import { ThemeProvider, colors, useSchemeStore } from "@/registry/theme";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light" },
}));

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  ...jest.requireActual("react-native-reanimated"),
  useReducedMotion: jest.fn(() => false),
}));

// The trigger icon becomes a marked View, so it can be found.
jest.mock("lucide-react-native", () => {
  const actual = jest.requireActual("lucide-react-native");
  const { View: RNView } = jest.requireActual("react-native");
  return { ...actual, User: () => <RNView testID="icon-user" /> };
});

const hidden = { includeHiddenElements: true } as const;
const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

function Tabs(props: Partial<SegmentedTabsProps> & { disabledTab?: boolean }) {
  const { disabledTab, ...rest } = props;
  return (
    <SegmentedTabs testID="tabs" {...rest}>
      <SegmentedTabsList testID="list">
        <SegmentedTabsTrigger testID="tab-a" value="a" label="Account" icon={User} />
        <SegmentedTabsTrigger testID="tab-b" value="b" label="Billing" />
        <SegmentedTabsTrigger testID="tab-c" value="c" label="Closed" disabled={disabledTab} />
      </SegmentedTabsList>
      <SegmentedTabsContent testID="panel-a" value="a">
        <Text>Account panel</Text>
      </SegmentedTabsContent>
      <SegmentedTabsContent testID="panel-b" value="b">
        <Text>Billing panel</Text>
      </SegmentedTabsContent>
      <SegmentedTabsContent testID="panel-c" value="c">
        <Text>Closed panel</Text>
      </SegmentedTabsContent>
    </SegmentedTabs>
  );
}

async function renderTabs(props: Partial<SegmentedTabsProps> & { disabledTab?: boolean } = {}) {
  await render(
    <ThemeProvider scheme="light">
      <Tabs {...props} />
    </ThemeProvider>,
  );
}

const tab = (name: string) => screen.getByRole("tab", { name });

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  jest.mocked(Haptics.selectionAsync).mockClear();
  jest.mocked(useReducedMotion).mockReturnValue(false);
});

afterEach(() => setActiveStyle("vega"));

describe("SegmentedTabs: roles and selection", () => {
  test("a tablist of tabs, named by their labels, with aria-selected", async () => {
    await renderTabs({ defaultValue: "a" });
    expect(screen.getByTestId("list").props.role).toBe("tablist");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(tab("Account")).toBeSelected();
    expect(tab("Billing")).not.toBeSelected();
    expect(tab("Closed")).not.toBeSelected();
  });

  test("pressing a tab selects it, with a haptic tick", async () => {
    await renderTabs({ defaultValue: "a" });
    await fireEvent.press(tab("Billing"));
    expect(tab("Billing")).toBeSelected();
    expect(tab("Account")).not.toBeSelected();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  test("the selected tab uses foreground text, the others mutedForeground", async () => {
    await renderTabs({ defaultValue: "a" });
    expect(screen.getByText("Account")).toHaveStyle({ color: colors.light.foreground });
    expect(screen.getByText("Billing")).toHaveStyle({ color: colors.light.mutedForeground });
  });

  test("renders the trigger icon", async () => {
    await renderTabs({ defaultValue: "a" });
    expect(screen.getByTestId("icon-user", hidden)).toBeTruthy();
  });

  test("a disabled tab is announced disabled and cannot be selected", async () => {
    const onValueChange = jest.fn();
    await renderTabs({ defaultValue: "a", disabledTab: true, onValueChange });
    expect(tab("Closed")).toBeDisabled();
    await fireEvent.press(tab("Closed"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(tab("Account")).toBeSelected();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  test("disabled on the root disables every tab", async () => {
    const onValueChange = jest.fn();
    await renderTabs({ defaultValue: "a", disabled: true, onValueChange });
    for (const name of ["Account", "Billing", "Closed"]) expect(tab(name)).toBeDisabled();
    await fireEvent.press(tab("Billing"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("tabs reach the 48 tap target", async () => {
    await renderTabs({ defaultValue: "a" });
    await fireEvent(screen.getByTestId("tab-a"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 34 } },
    });
    expect(screen.getByTestId("tab-a").props.hitSlop).toEqual({
      top: 7,
      bottom: 7,
      left: 0,
      right: 0,
    });
  });
});

describe("SegmentedTabs: controlled and uncontrolled", () => {
  test("uncontrolled: starts at defaultValue and reports changes", async () => {
    const onValueChange = jest.fn();
    await renderTabs({ defaultValue: "b", onValueChange });
    expect(tab("Billing")).toBeSelected();
    await fireEvent.press(tab("Account"));
    expect(onValueChange).toHaveBeenCalledWith("a");
    expect(tab("Account")).toBeSelected();
  });

  test("controlled: the parent decides", async () => {
    const onValueChange = jest.fn();
    await renderTabs({ value: "a", onValueChange });
    await fireEvent.press(tab("Billing"));
    expect(onValueChange).toHaveBeenCalledWith("b");
    // Not applied by the parent, so the selection stays.
    expect(tab("Account")).toBeSelected();
    expect(screen.getByText("Account panel")).toBeOnTheScreen();
  });

  test("controlled: follows the parent's state", async () => {
    function Controlled() {
      const [value, setValue] = useState("a");
      return (
        <>
          <Tabs value={value} onValueChange={setValue} />
          <Text testID="value">{value}</Text>
        </>
      );
    }
    await render(
      <ThemeProvider scheme="light">
        <Controlled />
      </ThemeProvider>,
    );
    await fireEvent.press(tab("Billing"));
    expect(screen.getByTestId("value")).toHaveTextContent("b");
    expect(tab("Billing")).toBeSelected();
  });

  test("nothing selected without a value or defaultValue", async () => {
    await renderTabs();
    for (const t of screen.getAllByRole("tab")) expect(t).not.toBeSelected();
    expect(screen.queryByTestId(/^panel-/)).toBeNull();
  });
});

describe("SegmentedTabsContent", () => {
  test("only the selected tab's Content renders, as a tabpanel", async () => {
    await renderTabs({ defaultValue: "a" });
    expect(screen.getByText("Account panel")).toBeOnTheScreen();
    expect(screen.queryByText("Billing panel")).toBeNull();
    expect(screen.queryByText("Closed panel")).toBeNull();
    expect(screen.getAllByTestId(/^panel-/).map((p) => p.props.role)).toEqual(["tabpanel"]);

    await fireEvent.press(tab("Billing"));
    expect(screen.queryByText("Account panel")).toBeNull();
    expect(screen.getByText("Billing panel")).toBeOnTheScreen();
  });
});

describe("SegmentedTabs: Variants and Style Slots", () => {
  test.each(["vega", "nova"] as const)(
    "segmented uses the segmented-tabs Slots on a muted track (%s)",
    async (style) => {
      setActiveStyle(style);
      await renderTabs({ defaultValue: "a" });
      const list = flat(screen.getByTestId("list"));
      expect(list.backgroundColor).toBe(colors.light.muted);
      expect(list).toEqual(expect.objectContaining({ height: expect.any(Number) }));
      expect(list).toEqual(expect.objectContaining({ padding: expect.any(Number) }));
      const trigger = flat(screen.getByTestId("tab-b"));
      expect(trigger.borderRadius).toBeLessThan(list.borderRadius as number);
    },
  );

  test("Vega's list is taller than Nova's", async () => {
    await renderTabs({ defaultValue: "a" });
    const vega = flat(screen.getByTestId("list")).height as number;
    await screen.unmount();
    setActiveStyle("nova");
    await renderTabs({ defaultValue: "a" });
    const nova = flat(screen.getByTestId("list")).height as number;
    expect(vega).toBeGreaterThan(nova);
  });

  test("underline has a bottom border and no track fill", async () => {
    await renderTabs({ defaultValue: "a", variant: "underline" });
    const list = flat(screen.getByTestId("list"));
    expect(list.borderBottomColor).toBe(colors.light.border);
    expect(list.backgroundColor).toBeUndefined();
  });

  test("style is merged last onto the root", async () => {
    await renderTabs({ defaultValue: "a", style: { marginTop: 3, gap: 1 } });
    expect(flat(screen.getByTestId("tabs"))).toMatchObject({ marginTop: 3, gap: 1 });
  });
});

describe("SegmentedTabs: indicator", () => {
  const layout = (testID: string, x: number, width: number) =>
    fireEvent(screen.getByTestId(testID), "layout", {
      nativeEvent: { layout: { x, y: 3, width, height: 34 } },
    });
  const indicator = () => screen.getByTestId("segmented-tabs-indicator", hidden);

  test("is hidden from screen readers and sits under the selected tab once measured", async () => {
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await renderTabs({ defaultValue: "a" });
    expect(indicator()).toHaveAnimatedStyle({ opacity: 0 });
    await layout("tab-a", 3, 100);
    await layout("tab-b", 103, 100);
    expect(indicator().props["aria-hidden"]).toBe(true);
    expect(indicator()).toHaveAnimatedStyle({
      width: 100,
      opacity: 1,
      transform: [{ translateX: 3 }],
    });
  });

  test("moves to the newly selected tab, instantly under Reduce Motion", async () => {
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await renderTabs({ defaultValue: "a" });
    await layout("tab-a", 3, 100);
    await layout("tab-b", 103, 120);
    await fireEvent.press(tab("Billing"));
    expect(indicator()).toHaveAnimatedStyle({ width: 120, transform: [{ translateX: 103 }] });
  });

  test("slides with the motion Tokens otherwise", async () => {
    jest.useFakeTimers();
    try {
      await renderTabs({ defaultValue: "a" });
      await layout("tab-a", 3, 100);
      await layout("tab-b", 103, 120);
      await fireEvent.press(tab("Billing"));
      jest.advanceTimersByTime(500);
      expect(indicator()).toHaveAnimatedStyle({ width: 120, transform: [{ translateX: 103 }] });
    } finally {
      jest.useRealTimers();
    }
  });
});

test("parts throw a clear error outside SegmentedTabs", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  await expect(
    render(
      <ThemeProvider scheme="light">
        <SegmentedTabsContent value="a" />
      </ThemeProvider>,
    ),
  ).rejects.toThrow(/inside <SegmentedTabs>/);
  jest.mocked(console.error).mockRestore();
});
