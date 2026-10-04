// app/(drawer)/_layout.tsx: a drawer Layout whose panel is built from the drawer Components.
// The drawer comes only from `expo-router/drawer` (built into Expo Router); never install
// `@react-navigation/drawer` or the unrelated npm package `expo-drawer`.
import { Drawer } from "expo-router/drawer";
import { Bell, Home, Inbox, LifeBuoy, LogOut, Settings, Users } from "lucide-react-native";
import { View } from "react-native";

import { Avatar } from "@/registry/components/avatar";
import { Badge } from "@/registry/components/badge";
import {
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerItem,
  DrawerSection,
} from "@/registry/components/drawer";
import { Separator } from "@/registry/components/separator";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContent {...props}>
          <DrawerHeader>
            <ProfileHeader />
          </DrawerHeader>

          <DrawerSection title="Main">
            <DrawerItem label="Home" icon={Home} href="/" />
            <DrawerItem label="Inbox" icon={Inbox} href="/inbox" badge={3} />
            <DrawerItem label="Team" icon={Users} href="/team" />
          </DrawerSection>

          {/* An Accent Colour highlighted item, and an item active in Accent Colour text. */}
          <DrawerSection title="Workspace">
            <DrawerItem
              label="Get started"
              href="/onboarding"
              tone="accent"
              badge={<Badge label="5 Steps" />}
            />
            <DrawerItem label="Notifications" icon={Bell} href="/notifications" variant="text" />
          </DrawerSection>

          {/* Pushed to the bottom of the scrolling area, above the footer. */}
          <DrawerSection style={{ marginTop: "auto" }}>
            <DrawerItem label="Settings" icon={Settings} href="/settings" />
            <DrawerItem label="Help" icon={LifeBuoy} href="/help" />
          </DrawerSection>

          <DrawerFooter>
            <Separator />
            <DrawerItem label="Log out" icon={LogOut} onPress={() => {}} />
          </DrawerFooter>
        </DrawerContent>
      )}
    >
      <Drawer.Screen name="index" options={{ title: "Home" }} />
    </Drawer>
  );
}

function ProfileHeader() {
  const styles = useStyles();
  return (
    <View style={styles.profile}>
      <Avatar fallback="JD" size="lg" />
      <View style={styles.name}>
        <Text variant="h4">Jane Doe</Text>
        <Text variant="small" color="mutedForeground">
          jane@example.com
        </Text>
      </View>
      <Badge label="Pro" variant="secondary" />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  profile: { gap: t.spacing[3] },
  name: { gap: t.spacing[1] },
}));
