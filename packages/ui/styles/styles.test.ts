import { colors, config, scaleTokens, scaleValue, tokens, type Theme } from "@/registry/theme";

import { STYLES, getActiveStyle, setActiveStyle, slot } from "./index";

function testTheme(scale = 1): Theme {
  return {
    ...scaleTokens(scale, { radiusBase: tokens.radiusBase }),
    scheme: "light",
    schemePreference: "light",
    setScheme: () => {},
    scale,
    scaleValue: (v) => scaleValue(v, scale),
    colors: colors.light,
    elevation: tokens.elevation.light,
    borderWidth: tokens.borderWidth,
    motion: tokens.motion,
    opacity: tokens.opacity,
    minTouchTarget: tokens.minTouchTarget,
    config,
  };
}

afterEach(() => setActiveStyle("vega"));

test("every Style fills exactly the same Slots", () => {
  const names = Object.keys(STYLES.vega).sort();
  for (const [style, fills] of Object.entries(STYLES)) {
    expect({ style, slots: Object.keys(fills).sort() }).toEqual({ style, slots: names });
  }
});

test("every Slot fill returns a style object for a real Theme", () => {
  const t = testTheme(1.1);
  for (const fills of Object.values(STYLES)) {
    for (const fill of Object.values(fills)) {
      expect(typeof fill(t)).toBe("object");
    }
  }
});

test("slot() reads the active Style and switches live", () => {
  const t = testTheme();
  expect(getActiveStyle()).toBe("vega");
  expect(slot("button.root", t)).toMatchObject({ height: t.controlHeight.md });
  setActiveStyle("nova");
  expect(slot("button.root", t)).toMatchObject({ height: t.controlHeight.sm });
});

test("Vega is roomier than Nova for controls, rows and cards", () => {
  const t = testTheme();
  const height = (style: "vega" | "nova", name: "button.root" | "list.item" | "card.root") => {
    setActiveStyle(style);
    const s = slot(name, t) as { height?: number; minHeight?: number; padding?: number };
    return s.height ?? s.minHeight ?? s.padding ?? 0;
  };
  for (const name of ["button.root", "list.item", "card.root"] as const) {
    expect(height("vega", name)).toBeGreaterThan(height("nova", name));
  }
});

test("slot() throws a clear error for an unknown Slot", () => {
  expect(() => slot("nope" as never, testTheme())).toThrow(/has no fill for slot "nope"/);
});

test("Button sizes grow sm < md < lg in every Style", () => {
  const t = testTheme();
  for (const style of Object.keys(STYLES) as (keyof typeof STYLES)[]) {
    setActiveStyle(style);
    // Typed per Slot: no cast needed to read `height`.
    const heights = [slot("button.sm", t), slot("button.root", t), slot("button.lg", t)].map(
      (s) => s.height,
    );
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(new Set(heights).size).toBe(3);
  }
});
