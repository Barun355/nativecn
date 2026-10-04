import { router, usePathname, type Href } from "expo-router";
import type { DrawerContentComponentProps } from "expo-router/drawer";
import type { LucideIcon } from "lucide-react-native";
import {
  Children,
  createContext,
  isValidElement,
  use,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  ScrollView,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaInsetsContext, initialWindowMetrics } from "react-native-safe-area-context";

import { Badge } from "@/registry/components/badge";
import { Icon } from "@/registry/components/icon";
import {
  Pressable,
  touchTargetHitSlop,
  type PressableHaptic,
} from "@/registry/components/primitives/pressable";
import { Text, type TextProps } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles, useTheme } from "@/registry/theme";

/** How an item shows that it is the current route. */
export type DrawerItemVariant = "default" | "text";
/** `accent` tints the item with the Accent Colour whether or not it is active. */
export type DrawerItemTone = "default" | "accent";

/** The drawer's navigation, handed down by DrawerContent so items can close the drawer. */
type DrawerContextValue = { navigation?: DrawerContentComponentProps["navigation"] };
const DrawerContext = createContext<DrawerContextValue>({});

export type DrawerContentProps = Partial<DrawerContentComponentProps> &
  ViewProps & {
    /**
     * DrawerHeader (pinned to the top), DrawerSections and DrawerItems (scrolling), and
     * DrawerFooter (pinned to the bottom), in any order.
     */
    children?: ReactNode;
    /** Style for the scrolling area's content, merged after its own padding and gap. */
    contentContainerStyle?: StyleProp<ViewStyle>;
    ref?: Ref<View>;
  };

export type DrawerHeaderProps = ViewProps & { children?: ReactNode; ref?: Ref<View> };
export type DrawerFooterProps = ViewProps & { children?: ReactNode; ref?: Ref<View> };

export type DrawerSectionProps = ViewProps & {
  /** A small muted heading above the section's items (role `heading`). */
  title?: string;
  children?: ReactNode;
  ref?: Ref<View>;
};

export type DrawerSectionTitleProps = Omit<TextProps, "variant">;

export type DrawerItemProps = Omit<ViewProps, "style" | "hitSlop" | "children"> & {
  /** The visible text and the accessible name. */
  label: string;
  /** A Lucide icon at the start of the item. Leave it out for text-only items. */
  icon?: LucideIcon;
  /**
   * The route to open. Pressing navigates there and closes the drawer; the item is active
   * while the current pathname is this route or below it. Groups like `(drawer)` are ignored.
   */
  href?: Href;
  /** At the end of the item: a string or number renders a secondary Badge; any node as-is. */
  badge?: string | number | ReactElement;
  /** Overrides the active state derived from the current route. */
  active?: boolean;
  /** `default`: active on a muted background. `text`: active in the Accent Colour, no background. */
  variant?: DrawerItemVariant;
  /** `accent`: a highlighted item on an Accent Colour tint, with Accent Colour text and icon. */
  tone?: DrawerItemTone;
  /** Runs before navigating. Items without `href` are actions (role `button`) and stay open. */
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  /** Blocks presses, dims the item and announces it as disabled. */
  disabled?: boolean;
  /** Haptic feedback on press (when `config.haptics` is on). */
  haptic?: PressableHaptic;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
};

const useStyles = createStyles((t) => {
  const item = slot("drawer.item", t);
  const label = slot("drawer.label", t);
  const tint = slot("drawer.tint", t);
  return {
    root: { flex: 1, backgroundColor: t.colors.card },
    scroll: { flex: 1 },
    content: {
      flexGrow: 1,
      paddingHorizontal: t.spacing[3],
      paddingVertical: t.spacing[3],
      gap: t.spacing[4],
    },
    header: { paddingHorizontal: t.spacing[4], paddingBottom: t.spacing[4], gap: t.spacing[3] },
    footer: { paddingHorizontal: t.spacing[3], paddingTop: t.spacing[3], gap: t.spacing[1] },
    section: { gap: t.spacing[1] },
    sectionTitle: {
      paddingHorizontal: item.paddingHorizontal,
      paddingVertical: t.spacing[1],
    },
    item: {
      ...item,
      flexDirection: "row",
      alignItems: "center",
      borderCurve: "continuous",
      overflow: "hidden",
    },
    label: { ...label, flex: 1, minWidth: 0 },
    pressed: slot("drawer.pressed", t),
    active: { backgroundColor: t.colors.muted },
    tint: {
      ...tint,
      position: "absolute",
      top: 0,
      bottom: 0,
      start: 0,
      end: 0,
      pointerEvents: "none",
    },
    disabled: { opacity: t.opacity.disabled },
    badge: { flexShrink: 0 },
  };
});

const isElementOf = (node: ReactNode, type: unknown): node is ReactElement =>
  isValidElement(node) && node.type === type;

function useInsets() {
  return use(SafeAreaInsetsContext) ?? initialWindowMetrics?.insets;
}

/**
 * The drawer panel's content: pass it Expo Router's drawer props, as in
 * `<Drawer drawerContent={(props) => <DrawerContent {...props}>…</DrawerContent>} />` from
 * `expo-router/drawer`. A DrawerHeader child is pinned to the top and a DrawerFooter to the
 * bottom, wherever they appear; everything else scrolls between them. The panel keeps clear of
 * the status bar and home indicator. `style` is merged last onto the root.
 */
export function DrawerContent({
  state: _state,
  descriptors: _descriptors,
  navigation,
  children,
  contentContainerStyle,
  style,
  ...props
}: DrawerContentProps) {
  const styles = useStyles();
  const insets = useInsets();
  const all = Children.toArray(children);
  const headers = all.filter((c) => isElementOf(c, DrawerHeader));
  const footers = all.filter((c) => isElementOf(c, DrawerFooter));
  const body = all.filter((c) => !isElementOf(c, DrawerHeader) && !isElementOf(c, DrawerFooter));

  // DrawerHeader and DrawerFooter pad the safe area themselves; without them, the scroll does.
  const safeArea: ViewStyle = {
    paddingTop: headers.length ? undefined : (insets?.top ?? 0) + styles.content.paddingVertical,
    paddingBottom: footers.length
      ? undefined
      : (insets?.bottom ?? 0) + styles.content.paddingVertical,
  };

  return (
    <DrawerContext value={{ navigation }}>
      <View style={[styles.root, style]} {...props}>
        {headers}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, safeArea, contentContainerStyle]}
        >
          {body}
        </ScrollView>
        {footers}
      </View>
    </DrawerContext>
  );
}

/**
 * The top of the panel (a profile, a logo and name, a cover…), pinned above the scrolling
 * items. Its top padding includes the status bar inset, so a background set with `style`
 * reaches the top edge. `style` is merged last.
 */
export function DrawerHeader({ style, ...props }: DrawerHeaderProps) {
  const styles = useStyles();
  const insets = useInsets();
  return (
    <View
      style={[
        styles.header,
        { paddingTop: (insets?.top ?? 0) + styles.header.paddingBottom },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * The bottom of the panel (Log out, a team switcher, the user…), pinned below the scrolling
 * items. Its bottom padding includes the home indicator inset. `style` is merged last.
 */
export function DrawerFooter({ style, ...props }: DrawerFooterProps) {
  const styles = useStyles();
  const insets = useInsets();
  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: (insets?.bottom ?? 0) + styles.footer.paddingTop },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * A group of DrawerItems with an optional `title`. To push a group to the bottom of the
 * scrolling area (above the footer), pass `style={{ marginTop: "auto" }}`. `style` is merged
 * last.
 */
export function DrawerSection({ title, children, style, ...props }: DrawerSectionProps) {
  const styles = useStyles();
  return (
    <View style={[styles.section, style]} {...props}>
      {title ? <DrawerSectionTitle>{title}</DrawerSectionTitle> : null}
      {children}
    </View>
  );
}

/** A DrawerSection's heading; use it directly only for a custom section layout. */
export function DrawerSectionTitle({ style, ...props }: DrawerSectionTitleProps) {
  const styles = useStyles();
  return (
    <Text
      role="heading"
      variant="caption"
      color="mutedForeground"
      style={[styles.sectionTitle, style]}
      {...props}
    />
  );
}

/** Drop route groups like `(drawer)`, `index` and a trailing slash, and fill `[param]`s. */
function hrefPath(href: Href): string {
  const { pathname, params } =
    typeof href === "string" ? { pathname: href, params: undefined } : href;
  const value = (key: string) => params?.[key];
  const segments = pathname
    .split(/[?#]/)[0]!
    .split("/")
    .flatMap((segment) => {
      if (!segment || /^\(.+\)$/.test(segment) || segment === "index") return [];
      const rest = /^\[\.\.\.(.+)\]$/.exec(segment);
      if (rest) return [value(rest[1]!)].flat().map(String);
      const param = /^\[(.+)\]$/.exec(segment);
      return [param ? String(value(param[1]!) ?? segment) : segment];
    });
  return `/${segments.join("/")}`;
}

/** Active while the pathname is the item's route or one below it (`/` matches only itself). */
export function isDrawerItemActive(href: Href, pathname: string): boolean {
  const path = hrefPath(href);
  const current = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return current === path || (path !== "/" && current.startsWith(`${path}/`));
}

/**
 * One drawer entry: icon, label and an optional badge. With `href` it is a link to that route,
 * active (and `aria-selected`) while the current route matches; pressing it navigates and
 * closes the drawer. Without `href` it is an action button (Log out…) that runs `onPress`.
 * Height, radius and padding come from the `drawer.item` Style Slot; the tap area is extended to
 * 48. `style` is merged last onto the root.
 */
export function DrawerItem({
  label,
  icon,
  href,
  badge,
  active: activeProp,
  variant = "default",
  tone = "default",
  onPress,
  onLongPress,
  disabled = false,
  haptic,
  style,
  ...props
}: DrawerItemProps) {
  const styles = useStyles();
  const { minTouchTarget } = useTheme();
  const { navigation } = use(DrawerContext);
  const pathname = usePathname();
  const active = activeProp ?? (href != null && isDrawerItemActive(href, pathname));
  const accent = tone === "accent" || (active && variant === "text");
  const color = accent ? "primary" : "foreground";

  const handlePress = (event: GestureResponderEvent) => {
    onPress?.(event);
    if (href == null) return;
    if (!active) router.navigate(href);
    navigation?.closeDrawer();
  };

  const hitSlop = touchTargetHitSlop(undefined, styles.item.height as number, minTouchTarget);

  return (
    <Pressable
      role={href != null ? "link" : "button"}
      aria-selected={active}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      haptic={haptic}
      hitSlop={hitSlop ?? 0}
      pressedStyle={styles.pressed}
      style={[
        styles.item,
        active && variant === "default" ? styles.active : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      {...props}
    >
      {tone === "accent" ? <View style={styles.tint} /> : null}
      {icon ? <Icon icon={icon} color={color} /> : null}
      <Text variant="label" color={color} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      {badge == null ? null : typeof badge === "string" || typeof badge === "number" ? (
        <Badge label={String(badge)} variant="secondary" style={styles.badge} />
      ) : (
        badge
      )}
    </Pressable>
  );
}
