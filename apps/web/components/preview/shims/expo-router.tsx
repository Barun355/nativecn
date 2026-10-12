// Expo Router as the Starter's promo Screen sees it in the preview (#163): the phone has no
// navigator, so `<Stack.Screen options={...} />` has no header to configure and draws nothing.
// next.config.ts points the Starter Screen's `expo-router` here; nothing else uses it.

export const Stack = {
  Screen: () => null,
};
