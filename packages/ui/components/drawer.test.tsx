import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { Home, Inbox, Settings } from "lucide-react-native";
import type { ReactNode } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { Badge } from "@/registry/components/badge";
import {
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerItem,
  DrawerSection,
  isDrawerItemActive,
  type DrawerContentProps,
  type DrawerItemProps,
} from "@/registry/components/drawer";
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

const mockNavigate = jest.fn();
let mockPathname = "/";
jest.mock("expo-router", () => ({
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
  usePathname: () => mockPathname,
}));

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale, { radiusBase: tokens.radiusBase });
const s = (v: number) => scaleValue(v, scale);

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

const insets = { top: 47, bottom: 34, left: 0, right: 0 };
const closeDrawer = jest.fn();
const navigation = { closeDrawer } as unknown as NonNullable<DrawerContentProps["navigation"]>;

async function renderUi(ui: ReactNode) {
  await render(
    <SafeAreaInsetsContext.Provider value={insets}>
      <ThemeProvider scheme="light">{ui}</ThemeProvider>
    </SafeAreaInsetsContext.Provider>,
  );
}

async function renderItem(props: Partial<DrawerItemProps> = {}) {
  await renderUi(
    <DrawerContent navigation={navigation}>
      <DrawerItem testID="item" label="Inbox" icon={Inbox} href="/inbox" {...props} />
    </DrawerContent>,
  );
  return screen.getByTestId("item");
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  mockPathname = "/";
  mockNavigate.mockClear();
  closeDrawer.mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("DrawerItem: Style Slots", () => {
  test("Vega: drawer.item 48 high, radius 8, padX 12, gap 12; label 14/20", async () => {
    const el = await renderItem();
    expect(flat(el)).toMatchObject({
      height: s(48),
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing[3],
      gap: t.spacing[3],
      flexDirection: "row",
    });
    expect(screen.getByText("Inbox")).toHaveStyle(t.type.label);
  });

  test("Nova: drawer.item 40 high, radius 6, padX 10, gap 10; label 13/18", async () => {
    setActiveStyle("nova");
    const el = await renderItem();
    expect(flat(el)).toMatchObject({
      height: s(40),
      borderRadius: t.radius.sm,
      paddingHorizontal: s(10),
      gap: s(10),
    });
    expect(screen.getByText("Inbox")).toHaveStyle({ fontSize: s(13), lineHeight: s(18) });
  });

  test("Nova's 40 item reaches the 48 touch target via hitSlop, without a layout pass", async () => {
    setActiveStyle("nova");
    const el = await renderItem();
    const extra = Math.max(0, 48 - s(40)) / 2;
    expect(el.props.hitSlop).toEqual(extra ? { top: extra, bottom: extra, left: 0, right: 0 } : 0);
    expect(el.props.onLayout).toBeUndefined();
  });

  test("the pressed look comes from the drawer.pressed Slot", async () => {
    const el = await renderItem({ testOnly_pressed: true } as never);
    expect(flat(el).backgroundColor).toBe(colors.light.muted);
  });

  test("style is merged last", async () => {
    expect(flat(await renderItem({ style: { paddingHorizontal: 0 } }))).toMatchObject({
      paddingHorizontal: 0,
    });
  });
});

describe("DrawerItem: active state from the current route", () => {
  test("inactive: no background, foreground label, aria-selected false", async () => {
    mockPathname = "/settings";
    const el = await renderItem();
    expect(el).not.toBeSelected();
    expect(flat(el).backgroundColor).toBeUndefined();
    expect(screen.getByText("Inbox")).toHaveStyle({ color: colors.light.foreground });
  });

  test("active on its route: muted background, aria-selected", async () => {
    mockPathname = "/inbox";
    const el = await renderItem();
    expect(el).toBeSelected();
    expect(flat(el).backgroundColor).toBe(colors.light.muted);
    expect(screen.getByRole("link", { name: "Inbox", selected: true })).toBeTruthy();
  });

  test("active below its route, ignoring groups like (drawer)", async () => {
    mockPathname = "/inbox/42";
    expect(await renderItem({ href: "/(drawer)/inbox" })).toBeSelected();
  });

  test("variant text: active in the Accent Colour with no background", async () => {
    mockPathname = "/inbox";
    const el = await renderItem({ variant: "text" });
    expect(flat(el).backgroundColor).toBeUndefined();
    expect(screen.getByText("Inbox")).toHaveStyle({ color: colors.light.primary });
  });

  test("tone accent: an Accent Colour tint and Accent Colour label, active or not", async () => {
    const el = await renderItem({ tone: "accent", href: "/onboarding" });
    expect(screen.getByText("Inbox")).toHaveStyle({ color: colors.light.primary });
    const tint = (el.children as unknown as { props: Record<string, unknown> }[])[0]!;
    expect(flat(tint)).toMatchObject({
      backgroundColor: colors.light.primary,
      position: "absolute",
      pointerEvents: "none",
    });
    expect(flat(tint).opacity).toBeLessThan(1);
  });

  test("the active prop overrides the route", async () => {
    mockPathname = "/inbox";
    expect(await renderItem({ active: false })).not.toBeSelected();
  });

  test("isDrawerItemActive: paths, groups, index, params and the root", () => {
    expect(isDrawerItemActive("/", "/")).toBe(true);
    expect(isDrawerItemActive("/", "/inbox")).toBe(false);
    expect(isDrawerItemActive("/(drawer)/index", "/")).toBe(true);
    expect(isDrawerItemActive("/inbox?tab=all", "/inbox")).toBe(true);
    expect(isDrawerItemActive("/inbox", "/inboxes")).toBe(false);
    expect(isDrawerItemActive("/inbox", "/inbox/")).toBe(true);
    expect(isDrawerItemActive({ pathname: "/users/[id]", params: { id: "7" } }, "/users/7")).toBe(
      true,
    );
    expect(isDrawerItemActive({ pathname: "/users/[id]", params: { id: "7" } }, "/users/8")).toBe(
      false,
    );
  });
});

describe("DrawerItem: pressing", () => {
  test("navigates to href and closes the drawer", async () => {
    const onPress = jest.fn();
    await renderItem({ onPress });
    await fireEvent.press(screen.getByRole("link", { name: "Inbox" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/inbox");
    expect(closeDrawer).toHaveBeenCalledTimes(1);
  });

  test("the active item only closes the drawer", async () => {
    mockPathname = "/inbox";
    await renderItem();
    await fireEvent.press(screen.getByRole("link", { name: "Inbox" }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(closeDrawer).toHaveBeenCalledTimes(1);
  });

  test("without href it is an action button: runs onPress and keeps the drawer open", async () => {
    const onPress = jest.fn();
    await renderItem({ href: undefined, label: "Log out", onPress });
    const button = screen.getByRole("button", { name: "Log out" });
    expect(button).not.toBeSelected();
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(closeDrawer).not.toHaveBeenCalled();
  });

  test("disabled: aria-disabled, dimmed, no navigation", async () => {
    const el = await renderItem({ disabled: true });
    expect(el).toBeDisabled();
    expect(flat(el).opacity).toBe(tokens.opacity.disabled);
    await fireEvent.press(el);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(closeDrawer).not.toHaveBeenCalled();
  });

  test("works outside DrawerContent (no drawer to close)", async () => {
    await renderUi(<DrawerItem label="Inbox" href="/inbox" />);
    await fireEvent.press(screen.getByRole("link", { name: "Inbox" }));
    expect(mockNavigate).toHaveBeenCalledWith("/inbox");
  });

  test("passes a ref and React Native props through", async () => {
    const ref = { current: null as View | null };
    await renderUi(
      <DrawerItem ref={ref} label="Inbox" href="/inbox" accessibilityHint="Opens your inbox" />,
    );
    expect(ref.current).not.toBeNull();
    expect(screen.getByRole("link").props.accessibilityHint).toBe("Opens your inbox");
  });
});

describe("DrawerItem: badges", () => {
  test("a string or number renders a secondary Badge, part of the item's name", async () => {
    await renderItem({ badge: 3 });
    const link = screen.getByRole("link", { name: /Inbox.*3/ });
    expect(within(link).getByText("3")).toHaveStyle({ color: colors.light.secondaryForeground });
  });

  test("any node renders as-is", async () => {
    await renderItem({ badge: <Badge testID="custom" label="5 Steps" /> });
    expect(screen.getByTestId("custom")).toBeTruthy();
    expect(screen.getByText("5 Steps")).toHaveStyle({ color: colors.light.primaryForeground });
  });
});

describe("DrawerContent, DrawerHeader, DrawerSection, DrawerFooter", () => {
  async function renderPanel(props: Partial<DrawerContentProps> = {}) {
    await renderUi(
      <DrawerContent testID="content" navigation={navigation} {...props}>
        <DrawerFooter testID="footer">
          <DrawerItem label="Log out" onPress={() => {}} />
        </DrawerFooter>
        <DrawerSection title="Main" testID="main">
          <DrawerItem label="Home" icon={Home} href="/" />
          <DrawerItem label="Inbox" icon={Inbox} href="/inbox" badge={2} />
        </DrawerSection>
        <DrawerHeader testID="header" />
        <DrawerSection title="Workspace" testID="bottom" style={{ marginTop: "auto" }}>
          <DrawerItem label="Settings" icon={Settings} href="/settings" />
        </DrawerSection>
      </DrawerContent>,
    );
    return screen.getByTestId("content");
  }

  test("header pinned on top, footer at the bottom, sections scroll between them", async () => {
    const root = await renderPanel();
    const [header, scroll, footer] = root.children as unknown as { props: { testID?: string } }[];
    expect(header!.props.testID).toBe("header");
    expect(footer!.props.testID).toBe("footer");
    expect(within(scroll as never).getByText("Settings")).toBeTruthy();
    expect(flat(root)).toMatchObject({ flex: 1, backgroundColor: colors.light.card });
  });

  test("the header and footer pad the safe areas", async () => {
    await renderPanel();
    expect(screen.getByTestId("header")).toHaveStyle({ paddingTop: insets.top + t.spacing[4] });
    expect(screen.getByTestId("footer")).toHaveStyle({
      paddingBottom: insets.bottom + t.spacing[3],
    });
  });

  test("without a header or footer the scrolling area pads the safe areas", async () => {
    await renderUi(
      <DrawerContent>
        <DrawerItem label="Home" href="/" />
      </DrawerContent>,
    );
    // The item sits in the ScrollView's content container.
    const scroll = screen.getByRole("link", { name: "Home" }).parent!.parent!;
    expect(StyleSheet.flatten(scroll.props.contentContainerStyle as never)).toMatchObject({
      flexGrow: 1,
      paddingTop: insets.top + t.spacing[3],
      paddingBottom: insets.bottom + t.spacing[3],
    });
  });

  test("sections have a heading title; the active item is selected", async () => {
    mockPathname = "/inbox";
    await renderPanel();
    expect(screen.getByRole("heading", { name: "Main" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Workspace" })).toBeTruthy();
    expect(screen.getAllByRole("link", { selected: true })).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Inbox/ })).toBeSelected();
    expect(screen.getByRole("link", { name: "Home" })).not.toBeSelected();
  });

  test("a section can be pushed to the end with style", async () => {
    await renderPanel();
    expect(screen.getByTestId("bottom")).toHaveStyle({ marginTop: "auto" });
  });

  test("items inside close the drawer navigation passed by Expo Router", async () => {
    await renderPanel();
    await fireEvent.press(screen.getByRole("link", { name: "Settings" }));
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
    expect(closeDrawer).toHaveBeenCalledTimes(1);
  });

  test("Expo Router's state and descriptors are not passed to the View", async () => {
    const root = await renderPanel({ state: {} as never, descriptors: {} as never });
    expect(root.props.state).toBeUndefined();
    expect(root.props.descriptors).toBeUndefined();
    expect(root.props.navigation).toBeUndefined();
  });

  test("both Styles render the panel", async () => {
    for (const style of ["vega", "nova"] as const) {
      setActiveStyle(style);
      await renderPanel();
      expect(screen.getByRole("link", { name: "Settings" })).toHaveStyle({
        height: s(style === "vega" ? 48 : 40),
      });
    }
  });
});
