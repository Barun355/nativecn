// Reanimated 4 in Jest: its matchers and timer setup
// (https://docs.swmansion.com/react-native-reanimated/docs/guides/testing).
require("react-native-reanimated").setUpTests();

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
