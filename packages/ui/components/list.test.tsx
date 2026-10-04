import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { Bell, Trash } from "lucide-react-native";
import type { ReactNode } from "react";
import { Dimensions, FlatList, StyleSheet, Text as RNText, View } from "react-native";

import {
  ListItem,
  ListSection,
  ListSectionFooter,
  ListSectionHeader,
  type ListItemProps,
} from "@/registry/components/list";
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

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale, { radiusBase: tokens.radiusBase });
const s = (v: number) => scaleValue(v, scale);
const hidden = { includeHiddenElements: true } as const;

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

async function renderUi(ui: ReactNode) {
  await render(<ThemeProvider scheme="light">{ui}</ThemeProvider>);
}

async function renderItem(props: Partial<ListItemProps> = {}) {
  await renderUi(<ListItem testID="item" title="Notifications" {...(props as ListItemProps)} />);
  return screen.getByTestId("item");
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

afterEach(() => setActiveStyle("vega"));

describe("ListItem: Style Slots", () => {
  test("Vega: list.item row 52, padX 16, gap 12; title is body", async () => {
    expect(flat(await renderItem())).toMatchObject({
      minHeight: s(52),
      paddingHorizontal: t.spacing[4],
      gap: t.spacing[3],
      flexDirection: "row",
      backgroundColor: colors.light.card,
    });
    expect(screen.getByText("Notifications")).toHaveStyle(t.type.body);
  });

  test("Nova: list.item row 44, padX 12, gap 10; title 15/20", async () => {
    setActiveStyle("nova");
    expect(flat(await renderItem())).toMatchObject({
      minHeight: s(44),
      paddingHorizontal: t.spacing[3],
      gap: s(10),
    });
    expect(screen.getByText("Notifications")).toHaveStyle({ fontSize: s(15), lineHeight: s(20) });
  });

  test("the pressed look comes from the list.pressed Slot", async () => {
    const el = await renderItem({ onPress: () => {}, testOnly_pressed: true } as never);
    expect(flat(el).backgroundColor).toBe(colors.light.muted);
  });

  test("style is merged last", async () => {
    expect(flat(await renderItem({ style: { paddingHorizontal: 0 } }))).toMatchObject({
      paddingHorizontal: 0,
    });
  });
});

describe("ListItem: content", () => {
  test("description is muted; a string trailing is muted text", async () => {
    await renderItem({ description: "Push and email", trailing: "On" });
    expect(screen.getByText("Push and email")).toHaveStyle({ color: colors.light.mutedForeground });
    expect(screen.getByText("On")).toHaveStyle({ color: colors.light.mutedForeground });
  });

  test("trailing accepts any node, and chevron adds an icon", async () => {
    await renderItem({ trailing: <View testID="custom" />, chevron: true });
    expect(screen.getByTestId("custom")).toBeTruthy();
  });

  test("destructive draws the title in the destructive Colour Role", async () => {
    await renderItem({ destructive: true, icon: Trash, title: "Delete account" });
    expect(screen.getByText("Delete account")).toHaveStyle({ color: colors.light.destructive });
  });

  test("children replace the title column (escape hatch)", async () => {
    await renderUi(
      <ListItem testID="item" icon={Bell}>
        <RNText>Custom row</RNText>
      </ListItem>,
    );
    expect(within(screen.getByTestId("item")).getByText("Custom row")).toBeTruthy();
  });

  test("types: a title or children is required", () => {
    // @ts-expect-error a ListItem needs a title or children
    const empty = <ListItem />;
    const ok = <ListItem title="Profile" />;
    const custom = (
      <ListItem>
        <RNText>Row</RNText>
      </ListItem>
    );
    expect([empty, ok, custom]).toHaveLength(3);
  });
});

describe("ListItem: accessibility and pressing", () => {
  test("static rows are list items, not buttons", async () => {
    expect((await renderItem()).props.role).toBe("listitem");
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("onPress makes the row a button named by its text", async () => {
    const onPress = jest.fn();
    await renderItem({ onPress, chevron: true, description: "Push and email" });
    const button = screen.getByRole("button", { name: /Notifications/ });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("disabled: aria-disabled, dimmed, no press", async () => {
    const onPress = jest.fn();
    const el = await renderItem({ onPress, disabled: true });
    expect(el).toBeDisabled();
    expect(flat(el).opacity).toBe(tokens.opacity.disabled);
    await fireEvent.press(el);
    expect(onPress).not.toHaveBeenCalled();
  });

  test("Nova's 44 row reaches the 48 touch target via hitSlop, without a layout pass", async () => {
    setActiveStyle("nova");
    const el = await renderItem({ onPress: () => {} });
    // Scaled rows already 48 or taller need no extension.
    const extra = Math.max(0, 48 - s(44)) / 2;
    expect(el.props.hitSlop).toEqual(extra ? { top: extra, bottom: extra, left: 0, right: 0 } : 0);
    expect(el.props.onLayout).toBeUndefined();
  });

  test("passes a ref and React Native props through", async () => {
    const ref = { current: null as View | null };
    await renderUi(
      <ListItem ref={ref} title="Profile" onPress={() => {}} accessibilityHint="Opens profile" />,
    );
    expect(ref.current).not.toBeNull();
    expect(screen.getByRole("button").props.accessibilityHint).toBe("Opens profile");
  });
});

describe("ListSection", () => {
  test("a list: header and footer outside the rounded group, separators between rows", async () => {
    await renderUi(
      <ListSection testID="section">
        <ListItem title="One" />
        <ListSectionHeader>Account</ListSectionHeader>
        <ListItem title="Two" />
        <ListItem title="Three" />
        <ListSectionFooter>Synced</ListSectionFooter>
      </ListSection>,
    );
    const section = screen.getByTestId("section");
    expect(section.props.role).toBe("list");
    expect(screen.getByRole("heading", { name: "Account" })).toBeTruthy();

    // Header first, then the group, then the footer.
    const [header, group, footer] = section.children as unknown as {
      props: Record<string, unknown>;
    }[];
    expect(header!.props.children).toBe("Account");
    expect(footer!.props.children).toBe("Synced");
    expect(flat(group!)).toMatchObject({ borderRadius: t.radius.xl, overflow: "hidden" });
    // Three rows, two hidden hairline Separators between them.
    expect(
      (group as unknown as { children: unknown[] }).children.filter(
        (c) => (c as { props: Record<string, unknown> }).props["aria-hidden"] === true,
      ),
    ).toHaveLength(2);
  });

  test("Vega and Nova inset the section by list.section", async () => {
    await renderUi(<ListSection testID="section" />);
    expect(screen.getByTestId("section")).toHaveStyle({ marginHorizontal: t.spacing[4] });
    setActiveStyle("nova");
    await renderUi(<ListSection testID="section" />);
    expect(screen.getByTestId("section")).toHaveStyle({ marginHorizontal: t.spacing[3] });
  });

  test("ListItem works as a virtualized row without a ListSection", async () => {
    const onPress = jest.fn();
    await renderUi(
      <FlatList
        data={["a", "b", "c"]}
        keyExtractor={(k) => k}
        renderItem={({ item }) => <ListItem title={`Row ${item}`} onPress={() => onPress(item)} />}
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Row b" }));
    expect(onPress).toHaveBeenCalledWith("b");
    expect(screen.getAllByRole("button", hidden)).toHaveLength(3);
  });
});
