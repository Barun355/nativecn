import { Tabs } from "expo-router/js-tabs";
import { Bell, House, Search, User } from "lucide-react-native";

import { TabNavigation, tabIcon } from "@/registry/components/tab-navigation";

// A tabs Layout, e.g. app/(tabs)/_layout.tsx: Expo Router's JS Tabs with TabNavigation as its
// tab bar. Each Tabs.Screen gives its title, icon and (optional) badge.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabNavigation {...props} variant="floating" />}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon(House) }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: tabIcon(Search) }} />
      <Tabs.Screen
        name="inbox"
        options={{ title: "Inbox", tabBarIcon: tabIcon(Bell), tabBarBadge: 3 }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: tabIcon(User) }} />
    </Tabs>
  );
}
