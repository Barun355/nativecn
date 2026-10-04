import { render, screen, userEvent, within } from "@testing-library/react-native";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { Portal, PortalHost, usePortalInsets } from "@/registry/components/primitives/portal";

jest.mock("react-native-screens", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    FullWindowOverlay: ({ children }: { children: React.ReactNode }) => (
      <View testID="full-window-overlay">{children}</View>
    ),
  };
});

function texts(container: ReturnType<typeof screen.getByTestId>) {
  return within(container)
    .queryAllByText(/.*/)
    .map((node) => node.props.children);
}

describe("Portal", () => {
  test("renders its children in the host, not in place", async () => {
    await render(
      <View>
        <View testID="screen">
          <Portal>
            <Text>Saved</Text>
          </Portal>
        </View>
        <PortalHost />
      </View>,
    );
    expect(within(screen.getByTestId("screen")).queryByText("Saved")).toBeNull();
    expect(within(screen.getByTestId("portal-host-root")).getByText("Saved")).toBeTruthy();
  });

  test("orders Portals by layer, then by registration", async () => {
    await render(
      <View>
        <Portal layer={2}>
          <Text>top</Text>
        </Portal>
        <Portal>
          <Text>first</Text>
        </Portal>
        <Portal>
          <Text>second</Text>
        </Portal>
        <Portal layer={-1}>
          <Text>bottom</Text>
        </Portal>
        <PortalHost />
      </View>,
    );
    // Later children draw on top, so render order is bottom → top.
    expect(texts(screen.getByTestId("portal-host-root"))).toEqual([
      "bottom",
      "first",
      "second",
      "top",
    ]);
  });

  test("keeps its place in the stack when its content updates", async () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return (
        <>
          <Pressable testID="inc" onPress={() => setCount((c) => c + 1)} />
          <Portal>
            <Text>{`count ${count}`}</Text>
          </Portal>
          <Portal>
            <Text>later</Text>
          </Portal>
        </>
      );
    }
    const user = userEvent.setup();
    await render(
      <View>
        <Counter />
        <PortalHost />
      </View>,
    );
    await user.press(screen.getByTestId("inc"));
    expect(texts(screen.getByTestId("portal-host-root"))).toEqual(["count 1", "later"]);
  });

  test("unmounting a Portal removes its content, and an empty host renders nothing", async () => {
    function App({ show }: { show: boolean }) {
      return (
        <View>
          {show && (
            <Portal>
              <Text>Saved</Text>
            </Portal>
          )}
          <PortalHost />
        </View>
      );
    }
    await render(<App show />);
    expect(screen.getByText("Saved")).toBeTruthy();

    await screen.rerender(<App show={false} />);
    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.queryByTestId("portal-host-root")).toBeNull();
  });

  test("named hosts only render the Portals that target them", async () => {
    await render(
      <View>
        <Portal>
          <Text>toast</Text>
        </Portal>
        <Portal hostName="sheet">
          <Text>menu</Text>
        </Portal>
        <PortalHost />
        <PortalHost name="sheet" />
      </View>,
    );
    expect(texts(screen.getByTestId("portal-host-root"))).toEqual(["toast"]);
    expect(texts(screen.getByTestId("portal-host-sheet"))).toEqual(["menu"]);
  });

  test("exposes the window's safe-area insets to Portal content", async () => {
    function Probe() {
      const insets = usePortalInsets();
      return <Text>{`${insets.top}|${insets.bottom}`}</Text>;
    }
    await render(
      <SafeAreaInsetsContext value={{ top: 47, right: 0, bottom: 34, left: 0 }}>
        <Portal>
          <Probe />
        </Portal>
        <PortalHost />
      </SafeAreaInsetsContext>,
    );
    expect(screen.getByText("47|34")).toBeTruthy();
  });

  test("never blocks touches outside Portal content", async () => {
    await render(
      <View>
        <Portal>
          <Text>Saved</Text>
        </Portal>
        <PortalHost />
      </View>,
    );
    expect(screen.getByTestId("portal-host-root").props.pointerEvents).toBe("box-none");
  });
});

describe("PortalHost platform overlay", () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });

  test("on iOS the host draws inside FullWindowOverlay, above native modals", async () => {
    Platform.OS = "ios";
    await render(
      <View>
        <Portal>
          <Text>Saved</Text>
        </Portal>
        <PortalHost />
      </View>,
    );
    expect(within(screen.getByTestId("full-window-overlay")).getByText("Saved")).toBeTruthy();
  });

  test("on Android the host is a plain absolute-fill overlay", async () => {
    Platform.OS = "android";
    await render(
      <View>
        <Portal>
          <Text>Saved</Text>
        </Portal>
        <PortalHost />
      </View>,
    );
    expect(screen.queryByTestId("full-window-overlay")).toBeNull();
    expect(screen.getByTestId("portal-host-root")).toHaveStyle({ position: "absolute" });
  });
});
