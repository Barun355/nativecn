import { AccessibilityInfo, Platform } from "react-native";

import { announce } from "@/registry/utils/announce";

describe("announce", () => {
  let plain: jest.SpyInstance;
  let withOptions: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    plain = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    withOptions = jest
      .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    // The React Native preset's AccessibilityInfo methods are already jest.fn()s, so
    // spyOn reuses them: clear their calls as well as restoring.
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("iOS", () => {
    beforeEach(() => jest.replaceProperty(Platform, "OS", "ios"));

    test("waits briefly, then posts a queued announcement", () => {
      announce("Saved");
      expect(withOptions).not.toHaveBeenCalled();

      jest.runAllTimers();
      expect(withOptions).toHaveBeenCalledWith("Saved", { queue: true });
      expect(plain).not.toHaveBeenCalled();
    });

    test("queue: false interrupts current speech", () => {
      announce("Wrong password", { queue: false });
      jest.runAllTimers();
      expect(withOptions).toHaveBeenCalledWith("Wrong password", { queue: false });
    });

    test("falls back to announceForAccessibility when the options API is missing", () => {
      const original = AccessibilityInfo.announceForAccessibilityWithOptions;
      // @ts-expect-error simulate an older React Native without the options API
      AccessibilityInfo.announceForAccessibilityWithOptions = undefined;
      try {
        announce("Saved");
        jest.runAllTimers();
        expect(plain).toHaveBeenCalledWith("Saved");
      } finally {
        AccessibilityInfo.announceForAccessibilityWithOptions = original;
      }
    });
  });

  describe("Android", () => {
    beforeEach(() => jest.replaceProperty(Platform, "OS", "android"));

    test("announces immediately with announceForAccessibility", () => {
      announce("Saved");
      expect(plain).toHaveBeenCalledWith("Saved");
      expect(withOptions).not.toHaveBeenCalled();
    });
  });

  test.each(["", "   ", "\n"])("skips empty messages (%j)", (message) => {
    for (const os of ["ios", "android"] as const) {
      jest.replaceProperty(Platform, "OS", os);
      announce(message);
      jest.runAllTimers();
    }
    expect(plain).not.toHaveBeenCalled();
    expect(withOptions).not.toHaveBeenCalled();
  });
});
