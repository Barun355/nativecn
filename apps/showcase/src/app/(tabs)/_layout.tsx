import { Tabs } from "expo-router/js-tabs";
import { Blocks, LayoutGrid, Palette, Sparkles } from "lucide-react-native";

import { TabNavigation, tabIcon } from "@/registry/components/tab-navigation";

// The four-tab shell (#29): Expo Router's JS Tabs with nativecn's TabNavigation as the tab bar.
// No navigator header: each tab's TabScreen draws its own title (#153).
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabNavigation {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: "Components", tabBarIcon: tabIcon(LayoutGrid) }}
      />
      <Tabs.Screen name="blocks" options={{ title: "Blocks", tabBarIcon: tabIcon(Blocks) }} />
      <Tabs.Screen name="theme" options={{ title: "Theme", tabBarIcon: tabIcon(Palette) }} />
      <Tabs.Screen name="ai" options={{ title: "Built for AI", tabBarIcon: tabIcon(Sparkles) }} />
    </Tabs>
  );
}
