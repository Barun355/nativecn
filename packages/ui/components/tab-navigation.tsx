import type { BottomTabBarProps } from "expo-router/js-tabs";
import type { LucideIcon } from "lucide-react-native";
import { use, type ReactNode, type Ref } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { Badge } from "@/registry/components/badge";
import { Icon, type IconSize } from "@/registry/components/icon";
import { Pressable } from "@/registry/components/primitives/pressable";
import { Text, type TextColor } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles, useTheme } from "@/registry/theme";

/** Each Variant's look: a full-width bar, or an inset pill floating above the bottom edge. */
const variants = {
  classic: { inset: false },
  floating: { inset: true },
} as const satisfies Record<string, { inset: boolean }>;

export type TabNavigationVariant = keyof typeof variants;

/** Tab content colours: the active tab in `primary`, the others in `mutedForeground`. */
const ACTIVE: TextColor = "primary";
const INACTIVE: TextColor = "mutedForeground";

/**
 * Expo Router's tab-bar props (what `<Tabs tabBar={(props) => ...}>` passes) plus `variant`.
 * Per-tab icon, label and badge come from each `Tabs.Screen`'s options.
 */
export type TabNavigationProps = BottomTabBarProps &
  Omit<ViewProps, "children" | "role"> & {
    /** `classic`: full-width bar with a top border; `floating`: inset pill (default `classic`). */
    variant?: TabNavigationVariant;
    ref?: Ref<View>;
  };

const useStyles = createStyles((t) => {
  const bar = slot("tab-navigation.bar", t);
  return {
    classic: {
      backgroundColor: t.colors.card,
      borderTopWidth: t.borderWidth.default,
      borderTopColor: t.colors.border,
    },
    floatingOuter: {
      paddingHorizontal: t.spacing[4],
      paddingTop: t.spacing[2],
    },
    floating: {
      ...slot("tab-navigation.floating", t),
      backgroundColor: t.colors.card,
      borderWidth: t.borderWidth.default,
      borderColor: t.colors.border,
      borderCurve: "continuous",
      boxShadow: t.elevation.lg,
      paddingHorizontal: t.spacing[2],
    },
    list: { ...bar, flexDirection: "row", alignItems: "stretch" },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: t.spacing[1],
    },
    icon: {
      ...slot("tab-navigation.icon", t),
      alignItems: "center",
      justifyContent: "center",
    },
    label: slot("tab-navigation.label", t),
    pressed: slot("tab-navigation.pressed", t),
    // The Badge sits on the icon's top end corner (layout only).
    badge: { position: "absolute", top: -t.spacing[2], start: "60%" },
  };
});

/** A tab's glyph through Icon: the Style's icon size, `primary` when active, muted otherwise. */
function TabIcon({ icon, focused, size }: { icon: LucideIcon; focused: boolean; size: number }) {
  const { iconSize } = useTheme();
  const token: IconSize = size >= iconSize.lg ? "lg" : size >= iconSize.md ? "md" : "sm";
  return <Icon icon={icon} size={token} color={focused ? ACTIVE : INACTIVE} />;
}

/**
 * Turns a Lucide icon into a `tabBarIcon` option, drawn with Icon at the Style's tab icon size:
 * `<Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon(House) }} />`.
 */
export function tabIcon(icon: LucideIcon) {
  return function TabBarIcon({ focused, size }: { focused: boolean; size: number }) {
    return <TabIcon icon={icon} focused={focused} size={size} />;
  };
}

/** The spoken badge: "3 new" for a count, the text itself otherwise ("New", "!"). */
function badgeText(badge: string | number): string {
  return typeof badge === "number" ? `${badge} new` : badge;
}

const isHidden = (style: unknown) =>
  (StyleSheet.flatten(style as never) as { display?: string } | undefined)?.display === "none";

/**
 * The app's bottom tab bar: the custom `tabBar` of an Expo Router JS Tabs Layout
 * (`expo-router/js-tabs`, never NativeTabs). Each `Tabs.Screen`'s `title`/`tabBarLabel`,
 * `tabBarIcon`, `tabBarBadge`, `tabBarAccessibilityLabel` and `tabBarButtonTestID` are read;
 * routes hidden with `href: null` are skipped. Presses emit `tabPress` (cancellable) and then
 * navigate, long presses emit `tabLongPress`, like the default tab bar. `style` is merged last
 * onto the root.
 */
export function TabNavigation({
  state,
  descriptors,
  navigation,
  insets,
  variant = "classic",
  style,
  ...props
}: TabNavigationProps) {
  const t = useTheme();
  const styles = useStyles();
  const safeArea = use(SafeAreaInsetsContext);
  const { inset } = variants[variant];

  // Expo Router passes the safe-area insets; the context covers a bar rendered on its own.
  const edges = {
    bottom: insets?.bottom ?? safeArea?.bottom ?? 0,
    left: insets?.left ?? safeArea?.left ?? 0,
    right: insets?.right ?? safeArea?.right ?? 0,
  };

  const focusedRoute = state.routes[state.index];
  if (focusedRoute && isHidden(descriptors[focusedRoute.key]?.options.tabBarStyle)) return null;

  const height = styles.list.height;

  const tabs = state.routes.map((route, index) => {
    const descriptor = descriptors[route.key];
    if (!descriptor) return null;
    const { options } = descriptor;
    if (isHidden(options.tabBarItemStyle)) return null;

    const focused = index === state.index;
    const color = focused ? ACTIVE : INACTIVE;
    const title = options.title ?? route.name;
    const labelText = typeof options.tabBarLabel === "string" ? options.tabBarLabel : title;
    const showLabel = options.tabBarShowLabel !== false;
    const badge = options.tabBarBadge;
    const name =
      options.tabBarAccessibilityLabel ??
      (badge != null && badge !== "" ? `${labelText}, ${badgeText(badge)}` : labelText);

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };
    const onLongPress = () => {
      navigation.emit({ type: "tabLongPress", target: route.key });
    };

    let label: ReactNode = null;
    if (showLabel) {
      label =
        typeof options.tabBarLabel === "function" ? (
          options.tabBarLabel({
            focused,
            color: t.colors[color],
            position: "below-icon",
            children: title,
          })
        ) : (
          <Text variant="caption" color={color} numberOfLines={1} style={styles.label}>
            {labelText}
          </Text>
        );
    }

    return (
      <Pressable
        key={route.key}
        role="tab"
        aria-selected={focused}
        aria-label={name}
        testID={options.tabBarButtonTestID}
        // Tabs share the row, so each is at least as wide as the bar is high (>= 48).
        size={{ width: height, height }}
        pressedStyle={styles.pressed}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tab}
      >
        <View style={styles.icon}>
          {options.tabBarIcon?.({
            focused,
            color: t.colors[color],
            size: styles.icon.width,
          })}
          {badge != null && badge !== "" ? (
            <Badge label={String(badge)} variant="destructive" style={styles.badge} />
          ) : null}
        </View>
        {label}
      </Pressable>
    );
  });

  const list = (
    <View role="tablist" style={styles.list}>
      {tabs}
    </View>
  );

  if (!inset) {
    return (
      <View
        style={[
          styles.classic,
          { paddingBottom: edges.bottom, paddingLeft: edges.left, paddingRight: edges.right },
          style,
        ]}
        {...props}
      >
        {list}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.floatingOuter,
        // The pill floats one spacing step above the bottom safe area.
        {
          paddingBottom: edges.bottom + t.spacing[2],
          marginLeft: edges.left,
          marginRight: edges.right,
        },
        style,
      ]}
      {...props}
    >
      <View style={styles.floating}>{list}</View>
    </View>
  );
}
