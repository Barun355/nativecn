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
