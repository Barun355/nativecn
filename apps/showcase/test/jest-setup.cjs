// As packages/ui/test/jest-setup.cjs, plus what rendering the whole app with Expo Router needs.

// Reanimated 4 in Jest: its matchers and timer setup
// (https://docs.swmansion.com/react-native-reanimated/docs/guides/testing).
require("react-native-reanimated").setUpTests();

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// react-native-keyboard-controller ships its own Jest mock (native views become plain Views).
jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest"),
);

// react-native-gesture-handler's own Jest setup: its native module and buttons become mocks.
require("react-native-gesture-handler/jestSetup");

// Expo Router's native stack and toolbar import native views (expo-glass-effect, @expo/ui) that
// jest-expo has no mock for; in Jest they render as plain Views.
const core = require("expo-modules-core");
const requireNativeViewManager = core.requireNativeViewManager;
core.requireNativeViewManager = (...args) => {
  try {
    return requireNativeViewManager(...args);
  } catch {
    return require("react-native").View;
  }
};

// Expo Router's native stack asks expo-glass-effect whether Liquid Glass is available.
jest.mock("expo-glass-effect", () => {
  const { View } = require("react-native");
  return {
    GlassView: View,
    GlassContainer: View,
    isLiquidGlassAvailable: () => false,
    isGlassEffectAPIAvailable: () => false,
  };
});

// expo-image's native view (Avatar): a plain View.
jest.mock("expo-image", () => {
  const { View } = require("react-native");
  return { Image: View };
});

// expo-system-ui (the Theme sets the window background with it): no native module in Jest.
jest.mock("expo-system-ui", () => ({
  setBackgroundColorAsync: jest.fn(() => Promise.resolve()),
  getBackgroundColorAsync: jest.fn(() => Promise.resolve(null)),
}));
