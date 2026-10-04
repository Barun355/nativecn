import { Tabs } from "expo-router/js-tabs";

// The four-tab shell (#29). Expo Router's JS Tabs for now; nativecn's TabNavigation
// Component replaces the tab bar once it exists.
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarIcon: () => null, tabBarIconStyle: { display: "none" } }}>
      <Tabs.Screen name="index" options={{ title: "Components" }} />
      <Tabs.Screen name="blocks" options={{ title: "Blocks" }} />
      <Tabs.Screen name="theme" options={{ title: "Theme" }} />
      <Tabs.Screen name="ai" options={{ title: "Built for AI" }} />
    </Tabs>
  );
}
