// drawer-01: profile header + grouped sections. The panel of a drawer Layout, built from the
// drawer Components on Expo Router's own drawer (`expo-router/drawer`; never install
// `@react-navigation/drawer` or the unrelated npm package `expo-drawer`).
//
// In app/(drawer)/_layout.tsx:
//   <Drawer
//     drawerContent={(props) => <Drawer01 {...props} onLogOut={signOut} />}
//     screenOptions={{ drawerStyle: { width: 300 } }}
//   />
//
// The name, email, plan, items and routes are placeholders: rename them to your app's.
import {
  BarChart3,
  FolderKanban,
  House,
  Inbox,
  LifeBuoy,
  LogOut,
  Settings,
  Users,
} from "lucide-react-native";
import { View } from "react-native";

import { Avatar } from "@/registry/components/avatar";
import { Badge } from "@/registry/components/badge";
import {
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerItem,
  DrawerSection,
  type DrawerContentProps,
} from "@/registry/components/drawer";
import { Separator } from "@/registry/components/separator";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

export type Drawer01Props = DrawerContentProps & {
  /** Runs when Log out is pressed. The drawer stays open; sign the user out here. */
  onLogOut?: () => void;
};

export function Drawer01({ onLogOut, ...props }: Drawer01Props) {
  const styles = useStyles();
  return (
    <DrawerContent {...props}>
      <DrawerHeader style={styles.header}>
        <View style={styles.profile}>
          <Avatar fallback="JD" />
          <View style={styles.identity}>
            <Text variant="h4" numberOfLines={1}>
              Jane Doe
            </Text>
            <Text variant="small" color="mutedForeground" numberOfLines={1}>
              jane@example.com
            </Text>
          </View>
          <Badge label="Pro" />
        </View>
      </DrawerHeader>

      <DrawerSection title="Main">
        <DrawerItem label="Home" icon={House} href="/" />
        <DrawerItem label="Inbox" icon={Inbox} href="/inbox" badge={12} />
        <DrawerItem label="Analytics" icon={BarChart3} href="/analytics" />
      </DrawerSection>

      <DrawerSection title="Workspace">
        <DrawerItem label="Projects" icon={FolderKanban} href="/projects" />
        <DrawerItem label="Team" icon={Users} href="/team" />
      </DrawerSection>

      <DrawerSection title="Support">
        <DrawerItem label="Settings" icon={Settings} href="/settings" />
        <DrawerItem label="Help" icon={LifeBuoy} href="/help" />
      </DrawerSection>

      <DrawerFooter>
        <Separator />
        <DrawerItem label="Log out" icon={LogOut} onPress={onLogOut} />
      </DrawerFooter>
    </DrawerContent>
  );
}

const useStyles = createStyles((t) => ({
  header: {
    borderBottomWidth: t.borderWidth.default,
    borderBottomColor: t.colors.border,
  },
  profile: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  identity: { flex: 1, minWidth: 0 },
}));
