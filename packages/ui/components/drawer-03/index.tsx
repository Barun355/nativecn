// drawer-03: cover header. The panel of a drawer Layout, built from the drawer Components on
// Expo Router's own drawer (`expo-router/drawer`; never install `@react-navigation/drawer` or
// the unrelated npm package `expo-drawer`).
//
// In app/(drawer)/_layout.tsx:
//   <Drawer
//     drawerContent={(props) => (
//       <Drawer03 {...props} onNotificationsPress={openInbox} onCreatePress={create} />
//     )}
//     screenOptions={{ drawerStyle: { width: 330 } }}
//   />
//
// The cover is dark in both Schemes: it renders the dark Scheme's Colour Roles through a nested
// ThemeProvider. The name, counts, items and routes are placeholders: rename them to your app's.
import { router } from "expo-router";
import {
  Bell,
  EllipsisVertical,
  History,
  House,
  Plus,
  ShoppingCart,
  Store,
} from "lucide-react-native";
import { View } from "react-native";

import { Avatar } from "@/registry/components/avatar";
import { Badge } from "@/registry/components/badge";
import { Button } from "@/registry/components/button";
import {
  DrawerContent,
  DrawerHeader,
  DrawerItem,
  DrawerSection,
  type DrawerContentProps,
} from "@/registry/components/drawer";
import { Pressable } from "@/registry/components/primitives/pressable";
import { Separator } from "@/registry/components/separator";
import { Text } from "@/registry/components/text";
import { ThemeProvider, colors, createStyles } from "@/registry/theme";

export type Drawer03Props = DrawerContentProps & {
  /** Runs when the bell in the cover is pressed. */
  onNotificationsPress?: () => void;
  /** Runs when the overflow (⋮) button in the cover is pressed. */
  onMorePress?: () => void;
  /** Runs when the round + action in the cover is pressed. */
  onCreatePress?: () => void;
};

/** Placeholder unread count shown on the bell. */
const UNREAD = 45;

export function Drawer03({
  onNotificationsPress,
  onMorePress,
  onCreatePress,
  ...props
}: Drawer03Props) {
  const styles = useStyles();
  const viewProfile = () => {
    router.navigate("/profile");
    props.navigation?.closeDrawer();
  };

  return (
    <DrawerContent {...props}>
      <DrawerHeader style={styles.cover}>
        <ThemeProvider scheme="dark">
          <Cover
            onViewProfile={viewProfile}
            onNotificationsPress={onNotificationsPress}
            onMorePress={onMorePress}
            onCreatePress={onCreatePress}
          />
        </ThemeProvider>
      </DrawerHeader>

      <DrawerSection>
        <DrawerItem label="Home" icon={House} href="/" variant="text" />
        <DrawerItem label="Shop" icon={Store} href="/shop" variant="text" />
        <DrawerItem label="Shopping cart" icon={ShoppingCart} href="/cart" variant="text" />
        <DrawerItem label="Same-day delivery" icon={History} href="/delivery" variant="text" />
      </DrawerSection>

      <Separator />

      <DrawerSection>
        <DrawerItem label="Invite friends" href="/invite" variant="text" />
        <DrawerItem label="Find friends" href="/friends" variant="text" />
        <DrawerItem label="Account" href="/account" variant="text" />
        <DrawerItem label="Settings" href="/settings" variant="text" />
      </DrawerSection>
    </DrawerContent>
  );
}

type CoverProps = {
  onViewProfile: () => void;
  onNotificationsPress?: () => void;
  onMorePress?: () => void;
  onCreatePress?: () => void;
};

/** The cover's content, rendered inside a dark ThemeProvider so every Colour Role is the dark one. */
function Cover({ onViewProfile, onNotificationsPress, onMorePress, onCreatePress }: CoverProps) {
  const styles = useCoverStyles();
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Avatar fallback="JD" size="lg" style={styles.avatar} />
        <View style={styles.actions}>
          <View>
            <Button
              variant="ghost"
              icon={Bell}
              aria-label={`Notifications, ${UNREAD} unread`}
              onPress={onNotificationsPress}
            />
            <Badge
              label={String(UNREAD)}
              aria-hidden
              importantForAccessibility="no-hide-descendants"
              style={styles.count}
            />
          </View>
          <Button variant="ghost" icon={EllipsisVertical} aria-label="More" onPress={onMorePress} />
        </View>
      </View>

      <View style={styles.identity}>
        <Text variant="h4" numberOfLines={1}>
          Jane Doe
        </Text>
        <Pressable role="link" onPress={onViewProfile} style={styles.link}>
          <Text variant="small" color="mutedForeground">
            View profile
          </Text>
        </Pressable>
      </View>

      <Button
        icon={Plus}
        size="lg"
        aria-label="Create"
        onPress={onCreatePress}
        style={styles.create}
      />
    </View>
  );
}

const useStyles = createStyles(() => ({
  // The dark Scheme's surface in both Schemes, so the cover always reads as dark.
  cover: { backgroundColor: colors.dark.muted },
}));

const useCoverStyles = createStyles((t) => ({
  root: { gap: t.spacing[3] },
  top: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  avatar: { backgroundColor: t.colors.background },
  actions: { flexDirection: "row", alignItems: "center" },
  count: { position: "absolute", top: 0, end: 0, pointerEvents: "none" },
  identity: { gap: t.spacing[0.5], paddingEnd: t.spacing[16] },
  link: { alignSelf: "flex-start" },
  create: { position: "absolute", end: 0, bottom: 0, borderRadius: t.radius.full },
}));
