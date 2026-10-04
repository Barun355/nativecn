import { fireEvent, render, screen, within } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import type { DrawerContentProps } from "@/registry/components/drawer";
import { Drawer01 } from "@/registry/components/drawer-01";
import { Drawer02 } from "@/registry/components/drawer-02";
import { Drawer03 } from "@/registry/components/drawer-03";
import { setActiveStyle } from "@/registry/styles";
import {
  ThemeProvider,
  colors,
  computeScale,
  scaleValue,
  useSchemeStore,
  type Scheme,
} from "@/registry/theme";

const mockNavigate = jest.fn();
let mockPathname = "/";
jest.mock("expo-router", () => ({
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
  usePathname: () => mockPathname,
}));

// Avatar's expo-image needs a native view; a plain View stands in.
jest.mock("expo-image", () => {
  const { View } = jest.requireActual("react-native");
  return { Image: (props: Record<string, unknown>) => <View {...props} /> };
});

const { width, height } = Dimensions.get("window");
const s = (v: number) => scaleValue(v, computeScale(width, height));

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

const insets = { top: 47, bottom: 34, left: 0, right: 0 };
const closeDrawer = jest.fn();
const navigation = { closeDrawer } as unknown as NonNullable<DrawerContentProps["navigation"]>;

async function renderUi(ui: ReactNode, scheme: Scheme = "light") {
  await render(
    <SafeAreaInsetsContext.Provider value={insets}>
      <ThemeProvider scheme={scheme}>{ui}</ThemeProvider>
    </SafeAreaInsetsContext.Provider>,
  );
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  mockPathname = "/";
  mockNavigate.mockClear();
  closeDrawer.mockClear();
});

afterEach(() => setActiveStyle("vega"));

const blocks = [
  ["drawer-01", Drawer01, "Inbox"],
  ["drawer-02", Drawer02, "Products"],
  ["drawer-03", Drawer03, "Shop"],
] as const;

describe.each(blocks)("%s: in a drawer Layout", (_name, Block, label) => {
  test("every item is a link or button; the current route's item is selected", async () => {
    mockPathname = "/";
    await renderUi(<Block navigation={navigation} />);
    expect(screen.getAllByRole("link", { selected: true })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Home", selected: true })).toBeTruthy();
    expect(screen.getByRole("link", { name: new RegExp(`^${label}($|\\W)`) })).not.toBeSelected();
  });

  test("tapping an item navigates and closes the drawer", async () => {
    await renderUi(<Block navigation={navigation} />);
    await fireEvent.press(screen.getByRole("link", { name: new RegExp(`^${label}($|\\W)`) }));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(closeDrawer).toHaveBeenCalledTimes(1);
  });

  test.each(["vega", "nova"] as const)("%s: items follow the drawer.item Slot", async (style) => {
    setActiveStyle(style);
    await renderUi(<Block navigation={navigation} />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveStyle({
      height: s(style === "vega" ? 48 : 40),
    });
  });

  test.each(["light", "dark"] as const)("%s Scheme: the panel uses its card", async (scheme) => {
    await renderUi(<Block testID="panel" navigation={navigation} />, scheme);
    expect(flat(screen.getByTestId("panel")).backgroundColor).toBe(colors[scheme].card);
    expect(screen.getByText(label)).toHaveStyle({ color: colors[scheme].foreground });
  });

  test("works without Expo Router's props (no drawer to close)", async () => {
    await renderUi(<Block />);
    await fireEvent.press(screen.getByRole("link", { name: "Home" }));
    expect(closeDrawer).not.toHaveBeenCalled();
  });
});

describe("drawer-01: profile header + grouped sections", () => {
  test("profile header with name, email and plan Badge; titled sections", async () => {
    await renderUi(<Drawer01 navigation={navigation} />);
    expect(screen.getByRole("heading", { name: "Jane Doe" })).toBeTruthy();
    expect(screen.getByText("jane@example.com")).toBeTruthy();
    expect(screen.getByText("Pro")).toBeTruthy();
    for (const title of ["Main", "Workspace", "Support"])
      expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Inbox.*12/ })).toBeTruthy();
  });

  test("Log out is an action in the footer: runs onLogOut and keeps the drawer open", async () => {
    const onLogOut = jest.fn();
    await renderUi(<Drawer01 navigation={navigation} onLogOut={onLogOut} />);
    await fireEvent.press(screen.getByRole("button", { name: "Log out" }));
    expect(onLogOut).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(closeDrawer).not.toHaveBeenCalled();
  });

  test("the active item sits on a muted background", async () => {
    mockPathname = "/team";
    await renderUi(<Drawer01 navigation={navigation} />);
    expect(flat(screen.getByRole("link", { name: "Team" })).backgroundColor).toBe(
      colors.light.muted,
    );
  });
});

describe("drawer-02: SaaS workspace", () => {
  test("the close button closes the drawer", async () => {
    await renderUi(<Drawer02 navigation={navigation} />);
    await fireEvent.press(screen.getByRole("button", { name: "Close menu" }));
    expect(closeDrawer).toHaveBeenCalledTimes(1);
  });

  test("the Checklist is tinted with the Accent Colour and has a 5 Steps Badge", async () => {
    await renderUi(<Drawer02 navigation={navigation} />);
    const checklist = screen.getByRole("link", { name: /Checklist/ });
    expect(within(checklist).getByText("Checklist")).toHaveStyle({ color: colors.light.primary });
    expect(within(checklist).getByText("5 Steps")).toBeTruthy();
  });

  test("Notifications carries an Accent Colour count in the bottom group", async () => {
    await renderUi(<Drawer02 navigation={navigation} />);
    const item = screen.getByRole("link", { name: /Notifications/ });
    expect(within(item).getByText("+9")).toHaveStyle({ color: colors.light.primaryForeground });
    expect(flat(item.parent!)).toMatchObject({ marginTop: "auto" });
  });

  test("footer: team switcher and account button", async () => {
    const onSwitchTeam = jest.fn();
    const onAccountPress = jest.fn();
    await renderUi(
      <Drawer02
        navigation={navigation}
        onSwitchTeam={onSwitchTeam}
        onAccountPress={onAccountPress}
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: /Switch team/ }));
    await fireEvent.press(screen.getByRole("button", { name: "Account menu" }));
    expect(onSwitchTeam).toHaveBeenCalledTimes(1);
    expect(onAccountPress).toHaveBeenCalledTimes(1);
    expect(closeDrawer).not.toHaveBeenCalled();
  });
});

describe("drawer-03: cover header", () => {
  test.each(["light", "dark"] as const)(
    "%s Scheme: the cover stays dark, drawn in the dark Colour Roles",
    async (scheme) => {
      await renderUi(<Drawer03 navigation={navigation} />, scheme);
      const name = screen.getByRole("heading", { name: "Jane Doe" });
      expect(name).toHaveStyle({ color: colors.dark.foreground });
      expect(screen.getByText("View profile")).toHaveStyle({
        color: colors.dark.mutedForeground,
      });
      const cover = screen.getByRole("button", { name: "Create" }).parent!.parent!;
      expect(flat(cover).backgroundColor).toBe(colors.dark.muted);
    },
  );

  test("header actions are labelled and run their callbacks", async () => {
    const onNotificationsPress = jest.fn();
    const onMorePress = jest.fn();
    const onCreatePress = jest.fn();
    await renderUi(
      <Drawer03
        navigation={navigation}
        onNotificationsPress={onNotificationsPress}
        onMorePress={onMorePress}
        onCreatePress={onCreatePress}
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Notifications, 45 unread" }));
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    await fireEvent.press(screen.getByRole("button", { name: "Create" }));
    expect(onNotificationsPress).toHaveBeenCalledTimes(1);
    expect(onMorePress).toHaveBeenCalledTimes(1);
    expect(onCreatePress).toHaveBeenCalledTimes(1);
  });

  test("View profile opens the profile route and closes the drawer", async () => {
    await renderUi(<Drawer03 navigation={navigation} />);
    await fireEvent.press(screen.getByRole("link", { name: "View profile" }));
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
    expect(closeDrawer).toHaveBeenCalledTimes(1);
  });

  test("the active item is Accent Colour text with no background", async () => {
    mockPathname = "/shop";
    await renderUi(<Drawer03 navigation={navigation} />);
    const shop = screen.getByRole("link", { name: "Shop", selected: true });
    expect(flat(shop).backgroundColor).toBeUndefined();
    expect(within(shop).getByText("Shop")).toHaveStyle({ color: colors.light.primary });
  });

  test("secondary items are text-only, below a divider", async () => {
    await renderUi(<Drawer03 navigation={navigation} />);
    for (const label of ["Invite friends", "Find friends", "Account", "Settings"])
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
  });
});
