import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { useState, type ReactElement } from "react";
import { Dimensions, StyleSheet, TextInput } from "react-native";

import { SearchField, type SearchFieldProps } from "@/registry/components/search-field";
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

// The Spinner's glyph becomes a marked View, so the icon slot's content can be found.
jest.mock("lucide-react-native", () => {
  const actual = jest.requireActual("lucide-react-native");
  const { View: RNView } = jest.requireActual("react-native");
  return { ...actual, LoaderCircle: () => <RNView testID="spinner" /> };
});

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale);

async function renderUI(ui: ReactElement) {
  await render(<ThemeProvider scheme="light">{ui}</ThemeProvider>);
}

async function renderSearch(props: Partial<SearchFieldProps> = {}) {
  await renderUI(<SearchField testID="search" {...props} />);
  return screen.getByTestId("search");
}

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;
const clearButton = () => screen.queryByRole("button", { name: "Clear search" });

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
});

afterEach(() => setActiveStyle("vega"));

describe("SearchField", () => {
  test('a searchbox named by its placeholder (default "Search") with the Search return key', async () => {
    const el = await renderSearch();
    expect(screen.getByRole("searchbox", { name: "Search" })).toBe(el);
    expect(el.props.placeholder).toBe("Search");
    expect(el.props.returnKeyType).toBe("search");
  });

  test("uses the search-field.root Slot in each Style", async () => {
    const el = await renderSearch();
    expect(flat(el.parent!.props.style)).toMatchObject({
      height: t.controlHeight.md,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing[3],
      backgroundColor: colors.light.muted,
    });
    setActiveStyle("nova");
    const nova = await renderSearch();
    expect(flat(nova.parent!.props.style)).toMatchObject({
      height: t.controlHeight.sm,
      paddingHorizontal: scaleValue(10, scale),
    });
  });

  test("the clear button appears with text, clears it and keeps focus", async () => {
    const onChangeText = jest.fn();
    const ref = { current: null as TextInput | null };
    const el = await renderSearch({ onChangeText, ref });
    expect(clearButton()).toBeNull();

    await fireEvent.changeText(el, "tacos");
    expect(onChangeText).toHaveBeenLastCalledWith("tacos");
    expect(screen.getByTestId("search").props.value).toBe("tacos");

    const focus = jest.spyOn(ref.current!, "focus").mockImplementation(() => {});
    await fireEvent.press(clearButton()!);
    expect(onChangeText).toHaveBeenLastCalledWith("");
    expect(screen.getByTestId("search").props.value).toBe("");
    expect(focus).toHaveBeenCalled();
    expect(clearButton()).toBeNull();
  });

  test("the clear button reaches the 48 tap target", async () => {
    await renderSearch({ defaultValue: "a" });
    const slop = clearButton()!.props.hitSlop;
    expect(t.iconSize.sm + slop.top + slop.bottom).toBeCloseTo(48);
  });

  describe("48 touch target", () => {
    /** The frame (a Pressable that focuses the field) around the TextInput. */
    const frameEl = () => screen.getByTestId("search").parent!;

    test.each([
      ["vega", t.controlHeight.md],
      ["nova", t.controlHeight.sm],
    ] as const)(
      "%s: the visual height stays, the tap area reaches 48 above and below",
      async (style, h) => {
        setActiveStyle(style);
        await renderSearch();
        expect(flat(frameEl().props.style).height).toBe(h);
        const slop = frameEl().props.hitSlop;
        if (h >= tokens.minTouchTarget) {
          expect(slop).toBeUndefined();
        } else {
          expect(slop).toMatchObject({ left: 0, right: 0 });
          expect(slop.top).toBe(slop.bottom);
          expect(h + slop.top + slop.bottom).toBeCloseTo(tokens.minTouchTarget);
        }
      },
    );

    test("Nova's 36-high field gets hitSlop at Scale 1", async () => {
      // The test window's Scale is above 1; a height set through style is used as-is.
      setActiveStyle("nova");
      await renderSearch({ style: { height: 36 } });
      expect(frameEl().props.hitSlop).toEqual({ top: 6, bottom: 6, left: 0, right: 0 });
    });

    test("a tap on the frame focuses the field, except while disabled", async () => {
      setActiveStyle("nova");
      const ref = { current: null as TextInput | null };
      await renderSearch({ ref });
      const focus = jest.spyOn(ref.current!, "focus").mockImplementation(() => {});
      focus.mockClear();
      await fireEvent.press(frameEl());
      expect(focus).toHaveBeenCalledTimes(1);

      focus.mockClear();
      await renderSearch({ ref, disabled: true });
      await fireEvent.press(frameEl());
      expect(focus).not.toHaveBeenCalled();
      focus.mockRestore();
    });

    test("screen readers skip the frame and reach the searchbox", async () => {
      setActiveStyle("nova");
      const el = await renderSearch();
      expect(frameEl().props).toMatchObject({
        accessible: false,
        importantForAccessibility: "no",
      });
      expect(frameEl().props.role).toBeUndefined();
      expect(screen.getByRole("searchbox", { name: "Search" })).toBe(el);
    });
  });

  test("works controlled", async () => {
    function Controlled() {
      const [q, setQ] = useState("pizza");
      return <SearchField testID="search" value={q} onChangeText={setQ} />;
    }
    await renderUI(<Controlled />);
    await fireEvent.press(clearButton()!);
    expect(screen.getByTestId("search").props.value).toBe("");
  });

  test("onSubmit receives the query from the Search key", async () => {
    const onSubmit = jest.fn();
    const el = await renderSearch({ onSubmit, defaultValue: "ramen" });
    await fireEvent(el, "submitEditing");
    expect(onSubmit).toHaveBeenCalledWith("ramen");
  });

  test("loading shows the Spinner in place of the icon, silent, and the field is announced busy", async () => {
    const el = await renderSearch({ loading: true });
    expect(el.props["aria-busy"]).toBe(true);
    // The Spinner sits in the icon slot, before the field, and is not read twice.
    const [first] = el.parent!.children as never[];
    expect(within(first!).getByTestId("spinner", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  test("disabled hides the loading Spinner", async () => {
    await renderSearch({ loading: true, disabled: true });
    expect(screen.queryByTestId("spinner", { includeHiddenElements: true })).toBeNull();
  });

  test("disabled: not editable, dimmed, no clear button", async () => {
    const el = await renderSearch({ disabled: true, defaultValue: "a" });
    expect(el.props.editable).toBe(false);
    expect(el.props["aria-disabled"]).toBe(true);
    expect(clearButton()).toBeNull();
  });

  test("focus draws the ring; aria-label and style pass through", async () => {
    const el = await renderSearch({ "aria-label": "Search recipes", style: { marginTop: 4 } });
    await fireEvent(el, "focus");
    const root = flat(screen.getByTestId("search").parent!.props.style);
    expect(root).toMatchObject({ outlineColor: colors.light.ring, marginTop: 4 });
    expect(screen.getByRole("searchbox", { name: "Search recipes" })).toBeTruthy();
  });
});
