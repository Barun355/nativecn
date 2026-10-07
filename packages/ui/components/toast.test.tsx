import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { PortalHost } from "@/registry/components/primitives/portal";
import {
  MAX_VISIBLE_TOASTS,
  TOAST_DURATION,
  Toaster,
  toast,
  useToastStore,
  type ToasterProps,
} from "@/registry/components/toast";
import { setActiveStyle } from "@/registry/styles";
import {
  ThemeProvider,
  colors,
  computeScale,
  scaleTokens,
  tokens,
  useSchemeStore,
} from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

// On iOS the PortalHost draws inside FullWindowOverlay; here it becomes a marked View.
jest.mock("react-native-screens", () => {
  const { View: RNView } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    FullWindowOverlay: ({ children }: { children: React.ReactNode }) => (
      <RNView testID="full-window-overlay">{children}</RNView>
    ),
  };
});

// Gesture roots become marked Views, so the tests can see where they are and how big.
jest.mock("react-native-gesture-handler", () => {
  const actual = jest.requireActual("react-native-gesture-handler");
  const { View: RNView } = jest.requireActual("react-native");
  return {
    ...actual,
    GestureHandlerRootView: (props: object) => <RNView {...props} testID="gesture-root" />,
  };
});

// Variant icons become marked Views, so each Toast's icon can be found.
jest.mock("lucide-react-native", () => {
  const actual = jest.requireActual("lucide-react-native");
  const { View: RNView } = jest.requireActual("react-native");
  return {
    ...actual,
    CircleCheck: () => <RNView testID="icon-success" />,
    CircleAlert: () => <RNView testID="icon-error" />,
    Info: () => <RNView testID="icon-info" />,
    TriangleAlert: () => <RNView testID="icon-warning" />,
  };
});

const { width, height } = Dimensions.get("window");
const t = scaleTokens(computeScale(width, height), { radiusBase: tokens.radiusBase });
const INSETS = { top: 47, right: 0, bottom: 34, left: 0 };
const hidden = { includeHiddenElements: true } as const;

async function renderToaster(props: ToasterProps = {}) {
  await render(
    <SafeAreaInsetsContext value={INSETS}>
      <ThemeProvider scheme="light">
        <View testID="screen">
          <Toaster {...props} />
        </View>
        <PortalHost />
      </ThemeProvider>
    </SafeAreaInsetsContext>,
  );
}

type Node = ReturnType<typeof screen.getByTestId>;

/** The testIDs of an element's ancestors, nearest first. */
function ancestorIds(el: Node): string[] {
  const ids: string[] = [];
  for (let p = el.parent; p; p = p.parent) if (p.props?.testID) ids.push(p.props.testID);
  return ids;
}

/** Titles of the Toasts on screen, top to bottom. */
const titles = () =>
  screen
    .queryAllByTestId(/^toast-toast-/)
    .map((el) => within(el).queryAllByText(/.*/)[0]?.props.children);

beforeEach(() => {
  jest.useFakeTimers();
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  useToastStore.setState({ toasts: [] });
  jest.mocked(announce).mockClear();
});

afterEach(async () => {
  await act(() => toast.dismiss());
  jest.useRealTimers();
  setActiveStyle("vega");
});

describe("toast(): the queue", () => {
  test("adds Toasts with a Variant and returns their id", () => {
    const id = toast("Saved");
    toast.success("Profile updated");
    toast.error("Wrong password", { description: "Check it and try again." });
    toast.info("New version");
    toast.warning("Low storage", { duration: 1000 });
    const { toasts } = useToastStore.getState();
    expect(toasts.map((t) => [t.title, t.variant])).toEqual([
      ["Saved", "default"],
      ["Profile updated", "success"],
      ["Wrong password", "error"],
      ["New version", "info"],
      ["Low storage", "warning"],
    ]);
    expect(toasts[0]!.id).toBe(id);
    expect(toasts[0]!.duration).toBe(TOAST_DURATION);
    expect(toasts[2]!.description).toBe("Check it and try again.");
    expect(toasts[4]!.duration).toBe(1000);
  });

  test("reusing an id updates the Toast in place", () => {
    const id = toast("Saving…", { duration: Infinity });
    toast("Other");
    toast.success("Saved", { id });
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(2);
    expect(toasts[0]).toMatchObject({ id, title: "Saved", variant: "success", version: 1 });
  });

  test("dismiss removes one Toast by id, or all without one", () => {
    const a = toast("A");
    toast("B");
    toast("C");
    toast.dismiss(a);
    expect(useToastStore.getState().toasts.map((t) => t.title)).toEqual(["B", "C"]);
    toast.dismiss();
    expect(useToastStore.getState().toasts).toEqual([]);
  });
});

describe("Toaster", () => {
  test("renders in the root PortalHost, not in place", async () => {
    await renderToaster();
    await act(() => toast("Saved"));
    expect(within(screen.getByTestId("portal-host-root")).getByText("Saved")).toBeTruthy();
    expect(within(screen.getByTestId("screen")).queryByText("Saved")).toBeNull();
  });

  test("on iOS it sits in FullWindowOverlay, above native modals", async () => {
    const os = Platform.OS;
    Platform.OS = "ios";
    try {
      await renderToaster();
      await act(() => toast("Saved"));
      expect(within(screen.getByTestId("full-window-overlay")).getByText("Saved")).toBeTruthy();
    } finally {
      Platform.OS = os;
    }
  });

  test("shows at most 3, newest nearest the top edge; the rest wait in the queue", async () => {
    await renderToaster();
    const ids: string[] = [];
    await act(() => {
      for (const n of [1, 2, 3, 4, 5]) ids.push(toast(`Toast ${n}`));
    });
    expect(MAX_VISIBLE_TOASTS).toBe(3);
    expect(titles()).toEqual(["Toast 5", "Toast 4", "Toast 3"]);
    expect(useToastStore.getState().toasts).toHaveLength(5);

    // Dismissing a visible one lets the next in the queue show.
    await act(() => toast.dismiss(ids[4]));
    expect(titles()).toEqual(["Toast 4", "Toast 3", "Toast 2"]);
  });

  test("bottom: the newest is nearest the bottom edge, clear of the home indicator", async () => {
    await renderToaster({ position: "bottom" });
    await act(() => {
      toast("First");
      toast("Second");
    });
    expect(titles()).toEqual(["First", "Second"]);
    expect(screen.getByTestId("toaster")).toHaveStyle({ bottom: INSETS.bottom });
  });

  test("top by default, clear of the status bar", async () => {
    await renderToaster();
    await act(() => toast("Saved"));
    expect(screen.getByTestId("toaster")).toHaveStyle({ top: INSETS.top });
  });

  // #153: Android ignores pointerEvents on a gesture root, so a full-screen one takes every tap.
  describe("on Android, taps outside a Toast reach the Screen", () => {
    const os = Platform.OS;
    beforeEach(() => {
      Platform.OS = "android";
    });
    afterEach(() => {
      Platform.OS = os;
    });

    test("with no Toasts, nothing is drawn that could take a touch", async () => {
      await renderToaster();
      expect(screen.queryAllByTestId("gesture-root", hidden)).toEqual([]);
      const viewport = screen.getByTestId("toaster", hidden);
      expect(viewport.props.pointerEvents).toBe("box-none");
      expect(viewport.children).toEqual([]);
    });

    test("no gesture root covers the screen: each wraps only its Toast", async () => {
      await renderToaster();
      const ids = await act(() => [toast("One"), toast("Two")]);
      const roots = screen.getAllByTestId("gesture-root", hidden);
      expect(roots).toHaveLength(ids.length);
      for (const root of roots) {
        // Inside the box-none viewport, never around it, and not absolutely filling anything.
        expect(ancestorIds(root)).toContain("toaster");
        expect(StyleSheet.flatten(root.props.style)?.position).not.toBe("absolute");
      }
      // ...and each Toast's swipe still has a gesture root, even in apps without one at the root.
      for (const id of ids)
        expect(ancestorIds(screen.getByTestId(`toast-${id}`, hidden))).toContain("gesture-root");
      expect(ancestorIds(screen.getByTestId("toaster", hidden))).not.toContain("gesture-root");
    });
  });

  test("auto-dismisses after 4s", async () => {
    await renderToaster();
    await act(() => toast("Saved"));
    await act(() => jest.advanceTimersByTime(TOAST_DURATION - 1));
    expect(screen.queryByText("Saved")).toBeTruthy();
    await act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByText("Saved")).toBeNull();
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  test("a custom duration, and Infinity keeps it until dismissed", async () => {
    await renderToaster();
    await act(() => {
      toast("Quick", { duration: 1000 });
      toast("Sticky", { duration: Infinity });
    });
    await act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryByText("Quick")).toBeNull();
    await act(() => jest.advanceTimersByTime(60_000));
    expect(screen.getByText("Sticky")).toBeTruthy();
  });

  test("a queued Toast's timer starts only once it shows", async () => {
    await renderToaster();
    await act(() => {
      for (const n of [1, 2, 3, 4]) toast(`Toast ${n}`);
    });
    expect(titles()).toEqual(["Toast 4", "Toast 3", "Toast 2"]);
    await act(() => jest.advanceTimersByTime(TOAST_DURATION));
    // The three visible ones left together; Toast 1 now shows for its full duration.
    expect(titles()).toEqual(["Toast 1"]);
    await act(() => jest.advanceTimersByTime(TOAST_DURATION - 1));
    expect(titles()).toEqual(["Toast 1"]);
    await act(() => jest.advanceTimersByTime(1));
    expect(titles()).toEqual([]);
  });

  test("toast.dismiss() removes it from the screen", async () => {
    await renderToaster();
    const id = await act(() => toast("Saved"));
    await act(() => toast.dismiss(id));
    expect(screen.queryByText("Saved")).toBeNull();
  });

  test("each Toast is announced, with its Variant and description", async () => {
    await renderToaster();
    await act(() => toast("Draft saved"));
    expect(announce).toHaveBeenLastCalledWith("Draft saved");
    await act(() => toast.error("Wrong password", { description: "Check it and try again." }));
    expect(announce).toHaveBeenLastCalledWith("Error: Wrong password. Check it and try again.");
    await act(() => toast.success("Saved"));
    expect(announce).toHaveBeenLastCalledWith("Success: Saved");
    expect(announce).toHaveBeenCalledTimes(3);
  });

  test("an update in place is announced again and restarts the timer", async () => {
    await renderToaster();
    const id = await act(() => toast("Saving…"));
    await act(() => jest.advanceTimersByTime(3000));
    await act(() => toast.success("Saved", { id }));
    expect(announce).toHaveBeenLastCalledWith("Success: Saved");
    await act(() => jest.advanceTimersByTime(3000));
    expect(screen.getByText("Saved")).toBeTruthy();
    await act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryByText("Saved")).toBeNull();
  });

  test.each(["success", "error", "info", "warning"] as const)(
    "%s shows its icon",
    async (variant) => {
      await renderToaster();
      await act(() => toast[variant]("Hello"));
      expect(screen.getByTestId(`icon-${variant}`, hidden)).toBeTruthy();
    },
  );

  test("the default Variant has no icon", async () => {
    await renderToaster();
    await act(() => toast("Hello"));
    for (const v of ["success", "error", "info", "warning"])
      expect(screen.queryByTestId(`icon-${v}`, hidden)).toBeNull();
  });

  test("the action button runs onPress, then dismisses", async () => {
    const onPress = jest.fn();
    await renderToaster();
    await act(() => toast("Message archived", { action: { label: "Undo", onPress } }));
    await fireEvent.press(screen.getByRole("button", { name: "Undo" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Message archived")).toBeNull();
  });

  test("screen readers can dismiss it with an action", async () => {
    await renderToaster();
    await act(() => toast("Saved"));
    const content = screen.getByLabelText("Saved");
    expect(content.props.accessibilityActions).toEqual(
      expect.arrayContaining([{ name: "dismiss", label: "Dismiss" }]),
    );
    await fireEvent(content, "accessibilityAction", { nativeEvent: { actionName: "dismiss" } });
    expect(screen.queryByText("Saved")).toBeNull();
  });

  // `duration: Infinity`, so only the gesture can remove these Toasts.
  test("swiping sideways dismisses it", async () => {
    await renderToaster();
    const id = await act(() => toast("Saved", { duration: Infinity }));
    await act(() => {
      fireGestureHandler(getByGestureTestId(`toast-pan-${id}`), [
        { state: State.BEGAN, translationX: 0 },
        { state: State.ACTIVE, translationX: 50 },
        { state: State.ACTIVE, translationX: 300, velocityX: 1200 },
        { state: State.END, translationX: 300, velocityX: 1200 },
      ]);
    });
    await act(() => jest.advanceTimersByTime(1000));
    expect(useToastStore.getState().toasts).toEqual([]);
    expect(screen.queryByText("Saved")).toBeNull();
  });

  test("swiping towards its edge dismisses it", async () => {
    await renderToaster();
    const id = await act(() => toast("Saved", { duration: Infinity }));
    await act(() => {
      fireGestureHandler(getByGestureTestId(`toast-pan-${id}`), [
        { state: State.BEGAN, translationY: 0 },
        { state: State.ACTIVE, translationY: -40 },
        { state: State.END, translationY: -40, velocityY: -1200 },
      ]);
    });
    await act(() => jest.advanceTimersByTime(1000));
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  // The pause itself lasts as long as a finger is down, which Jest cannot hold open.
  test("after a touch the timer resumes with the time left, not a fresh 4s", async () => {
    await renderToaster();
    const id = await act(() => toast("Saved"));
    await act(() => jest.advanceTimersByTime(3000));
    await act(() =>
      fireGestureHandler(getByGestureTestId(`toast-pan-${id}`), [
        { state: State.BEGAN, translationX: 0 },
        { state: State.END, translationX: 0 },
      ]),
    );
    await act(() => jest.advanceTimersByTime(999));
    expect(screen.getByText("Saved")).toBeTruthy();
    await act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByText("Saved")).toBeNull();
  });

  test("a short drag springs back and keeps the Toast", async () => {
    await renderToaster();
    const id = await act(() => toast("Saved", { duration: Infinity }));
    await act(() => {
      fireGestureHandler(getByGestureTestId(`toast-pan-${id}`), [
        { state: State.BEGAN, translationX: 0 },
        { state: State.ACTIVE, translationX: 20 },
        { state: State.END, translationX: 20, velocityX: 0 },
      ]);
    });
    await act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText("Saved")).toBeTruthy();
  });

  test.each([
    ["vega", { borderRadius: t.radius.xl, padding: t.spacing[4] }],
    ["nova", { borderRadius: t.radius.lg, padding: t.spacing[3] }],
  ] as const)("%s: the surface uses the toast.root Slot and Colour Roles", async (style, fill) => {
    setActiveStyle(style);
    await renderToaster();
    const id = await act(() => toast("Saved"));
    expect(StyleSheet.flatten(screen.getByTestId(`toast-${id}`).props.style)).toMatchObject({
      ...fill,
      backgroundColor: colors.light.popover,
      borderColor: colors.light.border,
    });
  });
});
