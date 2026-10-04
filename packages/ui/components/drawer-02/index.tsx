// drawer-02: SaaS workspace. The panel of a drawer Layout, built from the drawer Components on
// Expo Router's own drawer (`expo-router/drawer`; never install `@react-navigation/drawer` or
// the unrelated npm package `expo-drawer`).
//
// In app/(drawer)/_layout.tsx:
//   <Drawer
//     drawerContent={(props) => (
//       <Drawer02 {...props} onSwitchTeam={openTeams} onAccountPress={openAccount} />
//     )}
//     screenOptions={{ drawerStyle: { width: 290 } }}
//   />
//
// The logo, app and team names, items, counts and routes are placeholders: rename them to your
// app's.
import {
  Bell,
  ChevronsUpDown,
  CreditCard,
  FileText,
  Hexagon,
  House,
  LifeBuoy,
  ListChecks,
  Package,
  Settings,
  TicketPercent,
  Users,
  Wallet,
  X,
} from "lucide-react-native";
import { View } from "react-native";

import { Avatar } from "@/registry/components/avatar";
import { Badge } from "@/registry/components/badge";
import { Button } from "@/registry/components/button";
import {
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerItem,
  DrawerSection,
  type DrawerContentProps,
} from "@/registry/components/drawer";
import { Icon } from "@/registry/components/icon";
import { Pressable } from "@/registry/components/primitives/pressable";
import { Text } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

export type Drawer02Props = DrawerContentProps & {
  /** Runs when the team switcher in the footer is pressed. */
  onSwitchTeam?: () => void;
  /** Runs when the user's avatar in the footer is pressed. */
  onAccountPress?: () => void;
};

export function Drawer02({ onSwitchTeam, onAccountPress, ...props }: Drawer02Props) {
  const styles = useStyles();
  return (
    <DrawerContent {...props}>
      <DrawerHeader style={styles.header}>
        <View style={styles.brand}>
          <Icon icon={Hexagon} size="lg" color="primary" />
          <Text variant="h4" numberOfLines={1} style={styles.shrink}>
            Acme
          </Text>
        </View>
        <Button
          variant="ghost"
          size="sm"
          icon={X}
          aria-label="Close menu"
          onPress={() => props.navigation?.closeDrawer()}
        />
      </DrawerHeader>

      <DrawerSection>
        <DrawerItem
          label="Checklist"
          icon={ListChecks}
          href="/checklist"
          tone="accent"
          badge={<Badge label="5 Steps" />}
        />
        <DrawerItem label="Home" icon={House} href="/" />
        <DrawerItem label="Products" icon={Package} href="/products" />
        <DrawerItem label="Payment page" icon={CreditCard} href="/payment-page" />
        <DrawerItem label="Promo codes" icon={TicketPercent} href="/promo-codes" />
        <DrawerItem label="Customers" icon={Users} href="/customers" />
        <DrawerItem label="Payments" icon={Wallet} href="/payments" />
      </DrawerSection>

      {/* Pushed to the bottom of the scrolling area, above the footer. */}
      <DrawerSection style={styles.bottom}>
        <DrawerItem
          label="Notifications"
          icon={Bell}
          href="/notifications"
          badge={<Badge label="+9" />}
        />
        <DrawerItem label="Settings" icon={Settings} href="/settings" />
        <DrawerItem label="Docs" icon={FileText} href="/docs" />
        <DrawerItem label="Help" icon={LifeBuoy} href="/help" />
      </DrawerSection>

      <DrawerFooter style={styles.footer}>
        <Pressable
          role="button"
          aria-label="Switch team, current team Acme Inc"
          onPress={onSwitchTeam}
          pressedStyle={styles.pressed}
          style={[styles.control, styles.team]}
        >
          <View style={styles.teamLogo} />
          <Text variant="label" numberOfLines={1} style={styles.shrink}>
            Acme Inc
          </Text>
          <Icon icon={ChevronsUpDown} size="sm" color="mutedForeground" />
        </Pressable>
        <Pressable
          role="button"
          aria-label="Account menu"
          onPress={onAccountPress}
          pressedStyle={styles.pressed}
          style={styles.control}
        >
          <Avatar fallback="JD" size="sm" />
          <Icon icon={ChevronsUpDown} size="sm" color="mutedForeground" />
        </Pressable>
      </DrawerFooter>
    </DrawerContent>
  );
}

const useStyles = createStyles((t) => {
  const item = slot("drawer.item", t);
  return {
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: t.borderWidth.default,
      borderBottomColor: t.colors.border,
    },
    brand: { flex: 1, flexDirection: "row", alignItems: "center", gap: t.spacing[2] },
    shrink: { flexShrink: 1 },
    bottom: { marginTop: "auto" },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: t.spacing[2],
      borderTopWidth: t.borderWidth.default,
      borderTopColor: t.colors.border,
    },
    // The footer controls share a DrawerItem's height, radius and padding (drawer.item Slot).
    control: {
      ...item,
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing[2],
      borderCurve: "continuous",
    },
    team: { flexShrink: 1 },
    teamLogo: {
      width: t.iconSize.lg,
      height: t.iconSize.lg,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.primary,
    },
    pressed: slot("drawer.pressed", t),
  };
});
