import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { Bell, House, User } from "lucide-react-native";
import { Dimensions, StyleSheet, Text as RNText, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import {
  TabNavigation,
  tabIcon,
  type TabNavigationProps,
} from "@/registry/components/tab-navigation";
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

// Glyphs become marked Views carrying their colour, so tabIcon's Colour Role can be read.
jest.mock("lucide-react-native", () => {
  const actual = jest.requireActual("lucide-react-native");
  const { View: RNView } = jest.requireActual("react-native");
  const glyph = (name: string) =>
    function Glyph({ color }: { color: string }) {
      return <RNView testID={`${name}:${color}`} />;
    };
  return { ...actual, House: glyph("house"), Bell: glyph("bell"), User: glyph("user") };
});

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale, { radiusBase: tokens.radiusBase });
const s = (v: number) => scaleValue(v, scale);
const INSETS = { top: 47, right: 0, bottom: 34, left: 0 };

type Options = Record<string, unknown>;
type Route = { key: string; name: string; params?: object };

/** Tab-bar props as Expo Router's JS Tabs pass them, with a mocked navigation. */
function tabBarProps(
  screens: { name: string; options?: Options; params?: object }[],
  index = 0,
  { defaultPrevented = false } = {},
) {
  const routes: Route[] = screens.map((sc) => ({
    key: `${sc.name}-key`,
    name: sc.name,
    params: sc.params,
  }));
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented })),
    navigate: jest.fn(),
  };
  const descriptors = Object.fromEntries(
    routes.map((route, i) => [route.key, { route, options: screens[i]!.options ?? {} }]),
  );
  const state = {
    key: "tabs-key",
    index,
    routeNames: routes.map((r) => r.name),
    routes,
    type: "tab",
    stale: false,
    history: [],
    preloadedRouteKeys: [],
  };
  return {
    props: { state, descriptors, navigation, insets: INSETS } as unknown as TabNavigationProps,
    navigation,
    routes,
  };
}

const SCREENS = [
  { name: "index", options: { title: "Home", tabBarIcon: tabIcon(House) } },
  { name: "inbox", options: { title: "Inbox", tabBarIcon: tabIcon(Bell), tabBarBadge: 3 } },
  {
    name: "profile",
    params: { id: "me" },
    options: { title: "Profile", tabBarIcon: tabIcon(User), tabBarButtonTestID: "profile-tab" },
  },
];

async function renderBar(props: TabNavigationProps) {
  await render(
    <ThemeProvider scheme="light">
      <TabNavigation testID="bar" {...props} />
    </ThemeProvider>,
  );
  return screen.getByTestId("bar");
}

type HostNode = {
  props: Record<string, unknown>;
  parent: HostNode | null;
  children: (HostNode | string)[];
};
const findRole = (node: HostNode, role: string): HostNode | undefined => {
  if (node.props.role === role) return node;
  for (const child of node.children) {
    if (typeof child === "string") continue;
    const found = findRole(child, role);
    if (found) return found;
  }
  return undefined;
};
/** The tablist row: a plain (non-accessible) View, so its tabs stay focusable on their own. */
const tablist = () => findRole(screen.getByTestId("bar") as unknown as HostNode, "tablist")!;
const hidden = { includeHiddenElements: true } as const;

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

afterEach(() => setActiveStyle("vega"));

describe("TabNavigation: tabs and active state", () => {
  test("renders a tablist with one tab per route, named by title", async () => {
    await renderBar(tabBarProps(SCREENS).props);
    expect(tablist()).toBeTruthy();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Home" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Profile" })).toBeTruthy();
  });

  test("the focused route is selected; the others are not", async () => {
    await renderBar(tabBarProps(SCREENS, 2).props);
    expect(screen.getByRole("tab", { name: "Profile" })).toBeSelected();
    expect(screen.getByRole("tab", { name: "Home" })).not.toBeSelected();
  });

  test("active label is primary, inactive labels mutedForeground", async () => {
    await renderBar(tabBarProps(SCREENS, 0).props);
    expect(screen.getByText("Home")).toHaveStyle({ color: colors.light.primary });
    expect(screen.getByText("Profile")).toHaveStyle({ color: colors.light.mutedForeground });
  });

  test("tabBarIcon gets focused, a Colour Role colour and the Style's icon size", async () => {
    const tabBarIcon = jest.fn(() => <View testID="icon" />);
    await renderBar(
      tabBarProps([
        { name: "a", options: { title: "A", tabBarIcon } },
        { name: "b", options: { title: "B", tabBarIcon } },
      ]).props,
    );
    expect(tabBarIcon).toHaveBeenCalledWith({
      focused: true,
      color: colors.light.primary,
      size: t.iconSize.lg,
    });
    expect(tabBarIcon).toHaveBeenCalledWith({
      focused: false,
      color: colors.light.mutedForeground,
      size: t.iconSize.lg,
    });
  });

  test("labels: tabBarLabel wins over title, route name is the fallback, render functions work", async () => {
    await renderBar(
      tabBarProps([
        { name: "a", options: { title: "A", tabBarLabel: "Alpha" } },
        { name: "settings" },
        {
          name: "c",
          options: {
            title: "Gamma",
            tabBarLabel: ({ children, focused }: { children: string; focused: boolean }) => (
              <RNText>{`${children}:${focused}`}</RNText>
            ),
          },
        },
      ]).props,
    );
    expect(screen.getByRole("tab", { name: "Alpha" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "settings" })).toBeTruthy();
    expect(screen.getByText("Gamma:false")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Gamma" })).toBeTruthy();
  });

  test("tabBarShowLabel false hides the label but keeps the name", async () => {
    await renderBar(
      tabBarProps([{ name: "a", options: { title: "Home", tabBarShowLabel: false } }]).props,
    );
    expect(screen.queryByText("Home")).toBeNull();
    expect(screen.getByRole("tab", { name: "Home" })).toBeTruthy();
  });

  test("routes hidden with href: null (tabBarItemStyle display none) are skipped", async () => {
    await renderBar(
      tabBarProps([
        { name: "a", options: { title: "A" } },
        { name: "hidden", options: { title: "Hidden", tabBarItemStyle: { display: "none" } } },
      ]).props,
    );
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(screen.queryByText("Hidden")).toBeNull();
  });

  test("tabBarStyle display none on the focused Screen hides the bar", async () => {
    await render(
      <ThemeProvider scheme="light">
        <TabNavigation
          testID="bar"
          {...tabBarProps([{ name: "a", options: { tabBarStyle: { display: "none" } } }]).props}
        />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId("bar")).toBeNull();
  });

  test("tabBarButtonTestID and tabBarAccessibilityLabel pass through", async () => {
    await renderBar(
      tabBarProps([
        ...SCREENS,
        { name: "x", options: { title: "X", tabBarAccessibilityLabel: "Explore" } },
      ]).props,
    );
    expect(screen.getByTestId("profile-tab")).toHaveAccessibleName("Profile");
    expect(screen.getByRole("tab", { name: "Explore" })).toBeTruthy();
  });
});

describe("TabNavigation: navigation events", () => {
  test("pressing an inactive tab emits tabPress, then navigates with its params", async () => {
    const { props, navigation, routes } = tabBarProps(SCREENS, 0);
    await renderBar(props);
    await fireEvent.press(screen.getByRole("tab", { name: "Profile" }));
    expect(navigation.emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: routes[2]!.key,
      canPreventDefault: true,
    });
    expect(navigation.navigate).toHaveBeenCalledWith("profile", { id: "me" });
    expect(navigation.emit.mock.invocationCallOrder[0]).toBeLessThan(
      navigation.navigate.mock.invocationCallOrder[0]!,
    );
  });

  test("preventDefault in a tabPress listener stops navigation", async () => {
    const { props, navigation } = tabBarProps(SCREENS, 0, { defaultPrevented: true });
    await renderBar(props);
    await fireEvent.press(screen.getByRole("tab", { name: "Profile" }));
    expect(navigation.emit).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  test("pressing the active tab emits tabPress but does not navigate", async () => {
    const { props, navigation, routes } = tabBarProps(SCREENS, 0);
    await renderBar(props);
    await fireEvent.press(screen.getByRole("tab", { name: "Home" }));
    expect(navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tabPress", target: routes[0]!.key }),
    );
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  test("long press emits tabLongPress", async () => {
    const { props, navigation, routes } = tabBarProps(SCREENS, 0);
    await renderBar(props);
    await fireEvent(screen.getByRole("tab", { name: "Profile" }), "longPress");
    expect(navigation.emit).toHaveBeenCalledWith({
      type: "tabLongPress",
      target: routes[2]!.key,
    });
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});

describe("TabNavigation: badges", () => {
  test("a count badge is drawn on the icon and announced in the tab's name", async () => {
    await renderBar(tabBarProps(SCREENS).props);
    const inbox = screen.getByRole("tab", { name: "Inbox, 3 new" });
    expect(within(inbox).getByText("3")).toHaveStyle({
      color: colors.light.destructiveForeground,
    });
  });

  test("a text badge is spoken as is; an empty badge is not drawn", async () => {
    await renderBar(
      tabBarProps([
        { name: "a", options: { title: "Updates", tabBarBadge: "New" } },
        { name: "b", options: { title: "Feed", tabBarBadge: "" } },
      ]).props,
    );
    expect(screen.getByRole("tab", { name: "Updates, New" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Feed" })).toBeTruthy();
  });
});

describe("TabNavigation: Variants and Style Slots", () => {
  test("classic: full-width card bar with a top border and the bottom safe area", async () => {
    const bar = await renderBar(tabBarProps(SCREENS).props);
    expect(flat(bar)).toMatchObject({
      backgroundColor: colors.light.card,
      borderTopWidth: tokens.borderWidth.default,
      borderTopColor: colors.light.border,
      paddingBottom: INSETS.bottom,
    });
    expect(flat(tablist())).toMatchObject({ height: s(64) });
  });

  test("floating: inset pill with the Slot radius, shadow lg and a gap above the safe area", async () => {
    const bar = await renderBar({ ...tabBarProps(SCREENS).props, variant: "floating" });
    expect(flat(bar)).toMatchObject({
      paddingHorizontal: t.spacing[4],
      paddingBottom: INSETS.bottom + t.spacing[2],
    });
    expect(flat(bar).borderTopWidth).toBeUndefined();
    const pill = tablist().parent!;
    expect(flat(pill)).toMatchObject({
      borderRadius: t.radius["2xl"],
      boxShadow: tokens.elevation.light.lg,
      backgroundColor: colors.light.card,
    });
  });

  test("Nova: 52 high, 20 icons, 10/12 labels, radius xl", async () => {
    setActiveStyle("nova");
    const tabBarIcon = jest.fn(() => null);
    await renderBar({
      ...tabBarProps([{ name: "a", options: { title: "Home", tabBarIcon } }]).props,
      variant: "floating",
    });
    expect(flat(tablist())).toMatchObject({ height: s(52) });
    expect(tabBarIcon).toHaveBeenCalledWith(expect.objectContaining({ size: t.iconSize.md }));
    expect(screen.getByText("Home")).toHaveStyle({ fontSize: s(10), lineHeight: s(12) });
    expect(flat(tablist().parent!)).toMatchObject({
      borderRadius: t.radius.xl,
    });
  });

  test("Vega labels are 11/14", async () => {
    await renderBar(tabBarProps(SCREENS).props);
    expect(screen.getByText("Home")).toHaveStyle({ fontSize: s(11), lineHeight: s(14) });
  });

  test.each(["vega", "nova"] as const)(
    "%s: each tab reaches the 48 touch target",
    async (style) => {
      setActiveStyle(style);
      await renderBar(tabBarProps(SCREENS).props);
      const barHeight = flat(tablist()).height as number;
      expect(barHeight).toBeGreaterThanOrEqual(48);
      for (const tab of screen.getAllByRole("tab")) {
        const slop = tab.props.hitSlop;
        expect(barHeight + (slop?.top ?? 0) + (slop?.bottom ?? 0)).toBeGreaterThanOrEqual(48);
      }
    },
  );

  test("insets fall back to the safe-area context; style is merged last", async () => {
    const { props } = tabBarProps(SCREENS);
    await render(
      <SafeAreaInsetsContext value={{ top: 0, right: 0, bottom: 20, left: 0 }}>
        <ThemeProvider scheme="light">
          <TabNavigation
            testID="bar"
            {...props}
            insets={undefined as never}
            style={{ marginTop: 4 }}
          />
        </ThemeProvider>
      </SafeAreaInsetsContext>,
    );
    expect(flat(screen.getByTestId("bar"))).toMatchObject({ paddingBottom: 20, marginTop: 4 });
  });

  test("tabIcon draws the glyph through Icon in the active/inactive Colour Role", async () => {
    await renderBar(tabBarProps(SCREENS, 0).props);
    // Icon is decorative (hidden): the tab's name stays the label.
    expect(screen.getByRole("tab", { name: "Home" })).toBeTruthy();
    expect(screen.getByTestId(`house:${colors.light.primary}`, hidden)).toBeTruthy();
    expect(screen.getByTestId(`user:${colors.light.mutedForeground}`, hidden)).toBeTruthy();
  });
});
