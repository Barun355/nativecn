import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

// Proves the Jest + React Native Testing Library setup works; real tests live next to each item.
test("renders React Native under jest-expo", async () => {
  await render(<Text>nativecn</Text>);
  expect(screen.getByText("nativecn")).toBeTruthy();
});
