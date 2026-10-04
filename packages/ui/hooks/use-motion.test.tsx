import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { ReduceMotion, useReducedMotion } from "react-native-reanimated";

import { useMotion } from "@/registry/hooks/use-motion";
import { ThemeProvider, useSchemeStore } from "@/registry/theme";
import { motion as tokens } from "@/registry/theme/tokens";

jest.mock("react-native-reanimated", () => ({
  ...jest.requireActual("react-native-reanimated"),
  useReducedMotion: jest.fn(() => false),
}));

const reducedMotion = jest.mocked(useReducedMotion);

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider scheme="light">{children}</ThemeProvider>;
}

async function renderMotion(reduced: boolean) {
  reducedMotion.mockReturnValue(reduced);
  const { result } = await renderHook(() => useMotion(), { wrapper });
  return result.current;
}

beforeEach(() => useSchemeStore.setState({ scheme: "system", hydrated: true }));

describe("useMotion", () => {
  describe("Reduce Motion off: configs come from the motion Tokens", () => {
    test("duration", async () => {
      const motion = await renderMotion(false);
      expect(motion.reduced).toBe(false);
      expect(motion.duration("fast")).toBe(tokens.duration.fast);
      expect(motion.duration("slow")).toBe(tokens.duration.slow);
    });

    test("timing uses the duration and a bezier easing", async () => {
      const motion = await renderMotion(false);
      const config = motion.timing("slow", "enter");
      expect(config.duration).toBe(tokens.duration.slow);
      expect(config.easing).toEqual(expect.objectContaining({ factory: expect.any(Function) }));
      expect(config.reduceMotion).toBe(ReduceMotion.System);
      expect(motion.timing().duration).toBe(tokens.duration.base);
    });

    test("spring uses the preset", async () => {
      const motion = await renderMotion(false);
      expect(motion.spring("gentle")).toEqual({
        ...tokens.spring.gentle,
        reduceMotion: ReduceMotion.System,
      });
      expect(motion.spring()).toMatchObject(tokens.spring.snappy);
    });

    test("entering uses base + enter easing, exiting uses fast + exit easing", async () => {
      const motion = await renderMotion(false);
      const enter = motion.entering("from-top");
      const exit = motion.exiting("from-top");
      expect(enter?.constructor.name).toBe("FadeInUp");
      expect(exit?.constructor.name).toBe("FadeOutUp");
      expect(enter?.durationV).toBe(tokens.duration.base);
      expect(exit?.durationV).toBe(tokens.duration.fast);
      expect(enter?.easingV).toBeDefined();
      expect(exit?.easingV).toBeDefined();
      expect(motion.entering()?.constructor.name).toBe("FadeIn");
      expect(motion.exiting("from-bottom")?.constructor.name).toBe("FadeOutDown");
    });
  });

  describe("Reduce Motion on: everything is instant", () => {
    test("duration is 0", async () => {
      const motion = await renderMotion(true);
      expect(motion.reduced).toBe(true);
      expect(motion.duration("slow")).toBe(0);
    });

    test("timing jumps to the end", async () => {
      const motion = await renderMotion(true);
      expect(motion.timing("slow", "enter")).toEqual({
        duration: 0,
        reduceMotion: ReduceMotion.Always,
      });
    });

    test("spring jumps to the end", async () => {
      const motion = await renderMotion(true);
      expect(motion.spring("gentle").reduceMotion).toBe(ReduceMotion.Always);
    });

    test("no enter/exit animation", async () => {
      const motion = await renderMotion(true);
      expect(motion.entering("from-bottom")).toBeUndefined();
      expect(motion.exiting("fade")).toBeUndefined();
    });
  });
});
