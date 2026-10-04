import { ChevronRight, type LucideIcon } from "lucide-react-native";
import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { Icon } from "@/registry/components/icon";
import {
  Pressable,
  touchTargetHitSlop,
  type PressableHaptic,
} from "@/registry/components/primitives/pressable";
import { Separator } from "@/registry/components/separator";
import { Text, type TextProps } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles, useTheme } from "@/registry/theme";

export type ListSectionProps = ViewProps & {
  /** ListSectionHeader, ListItems (or any rows) and ListSectionFooter, in any order. */
  children?: ReactNode;
  ref?: Ref<View>;
};

export type ListSectionHeaderProps = Omit<TextProps, "variant">;
export type ListSectionFooterProps = Omit<TextProps, "variant">;

type ListItemBaseProps = Omit<ViewProps, "style" | "hitSlop" | "children"> & {
  /** Supporting text under the title, in the muted foreground. */
  description?: string;
  /** A Lucide icon at the start of the row. */
  icon?: LucideIcon;
  /** Anything at the end of the row: a value (strings are muted Text), a Badge, a Switch… */
  trailing?: ReactNode;
  /** A trailing chevron, for rows that navigate. */
  chevron?: boolean;
  /** Draws the title and icon in the `destructive` Colour Role (e.g. "Delete account"). */
  destructive?: boolean;
  /** Makes the row pressable (role `button`, pressed look from the `list.pressed` Slot). */
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  /** Only for a pressable row: blocks presses, dims it and announces it as disabled. */
  disabled?: boolean;
  /** Only for a pressable row: haptic feedback on press (when `config.haptics` is on). */
  haptic?: PressableHaptic;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
};

/**
 * A row is props-based (`title`, `description`, …), a deliberate exception to "children over
 * content props". `children` is the escape hatch: it replaces the title and description column.
 */
export type ListItemProps = ListItemBaseProps &
  ({ title: string; children?: undefined } | { title?: string; children: ReactNode });

const useStyles = createStyles((t) => {
  const item = slot("list.item", t);
  const section = slot("list.section", t);
  return {
    section: { marginHorizontal: section.marginHorizontal, gap: t.spacing[2] },
    group: {
      borderRadius: section.borderRadius,
      borderCurve: "continuous",
      backgroundColor: t.colors.card,
      overflow: "hidden",
    },
    header: { paddingHorizontal: item.paddingHorizontal },
    footer: { paddingHorizontal: item.paddingHorizontal },
    // Inset by the row padding, iOS style.
    separator: { marginStart: item.paddingHorizontal },
    item: {
      ...item,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: t.spacing[2],
      backgroundColor: t.colors.card,
    },
    pressed: slot("list.pressed", t),
    disabled: { opacity: t.opacity.disabled },
    body: { flex: 1, minWidth: 0 },
    title: slot("list.title", t),
    trailing: { flexDirection: "row", alignItems: "center", gap: t.spacing[2], flexShrink: 0 },
  };
});

const isElementOf = (node: ReactNode, type: unknown): node is ReactElement =>
  isValidElement(node) && node.type === type;

/**
 * A grouped, rounded block of rows (iOS inset-grouped style). Rows are divided by hairline
 * Separators; a ListSectionHeader and ListSectionFooter, wherever they appear among the
 * children, are drawn above and below the group. For long or virtualized lists, render
 * ListItems directly as FlashList / FlatList rows instead: they need no ListSection.
 * `style` is merged last onto the root.
 */
export function ListSection({ children, style, ...props }: ListSectionProps) {
  const styles = useStyles();
  const all = Children.toArray(children);
  const headers = all.filter((c) => isElementOf(c, ListSectionHeader));
  const footers = all.filter((c) => isElementOf(c, ListSectionFooter));
  const rows = all.filter(
    (c) => !isElementOf(c, ListSectionHeader) && !isElementOf(c, ListSectionFooter),
  );

  return (
    <View role="list" style={[styles.section, style]} {...props}>
      {headers}
      {rows.length ? (
        <View style={styles.group}>
          {rows.map((row, i) => (
            <Fragment key={isValidElement(row) && row.key != null ? row.key : i}>
              {i > 0 ? <Separator style={styles.separator} /> : null}
              {row}
            </Fragment>
          ))}
        </View>
      ) : null}
      {footers}
    </View>
  );
}

/** The heading above a ListSection's rows (role `heading`). */
export function ListSectionHeader({ style, ...props }: ListSectionHeaderProps) {
  const styles = useStyles();
  return (
    <Text
      role="heading"
      variant="small"
      color="mutedForeground"
      style={[styles.header, style]}
      {...props}
    />
  );
}

/** A note below a ListSection's rows. */
export function ListSectionFooter({ style, ...props }: ListSectionFooterProps) {
  const styles = useStyles();
  return (
    <Text variant="caption" color="mutedForeground" style={[styles.footer, style]} {...props} />
  );
}

/**
 * One row: icon, title and description, then `trailing` and a chevron. With `onPress` the row is
 * pressable (built on the Pressable Primitive, tap area extended to 48). FlashList-safe: no
 * state, no layout measuring, no parent context and no outer margins, so it can be a
 * virtualized list's row as-is. `style` is merged last onto the root.
 */
export function ListItem({
  title,
  description,
  icon,
  trailing,
  chevron = false,
  destructive = false,
  onPress,
  onLongPress,
  disabled = false,
  haptic,
  children,
  style,
  ...props
}: ListItemProps) {
  const styles = useStyles();
  const { minTouchTarget } = useTheme();
  const tone = destructive ? "destructive" : "foreground";

  const content = (
    <>
      {icon ? <Icon icon={icon} color={tone} /> : null}
      <View style={styles.body}>
        {children ?? (
          <>
            <Text color={tone} style={styles.title}>
              {title}
            </Text>
            {description ? (
              <Text variant="small" color="mutedForeground">
                {description}
              </Text>
            ) : null}
          </>
        )}
      </View>
      {trailing != null || chevron ? (
        <View style={styles.trailing}>
          {typeof trailing === "string" || typeof trailing === "number" ? (
            <Text variant="small" color="mutedForeground" numberOfLines={1}>
              {trailing}
            </Text>
          ) : (
            trailing
          )}
          {chevron ? <Icon icon={ChevronRight} size="sm" color="mutedForeground" /> : null}
        </View>
      ) : null}
    </>
  );

  if (onPress || onLongPress) {
    // Known from the Slot, so the tap area reaches 48 without a layout pass (recycled rows).
    const hitSlop = touchTargetHitSlop(undefined, styles.item.minHeight as number, minTouchTarget);
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        haptic={haptic}
        hitSlop={hitSlop ?? 0}
        pressedStyle={styles.pressed}
        style={[styles.item, disabled ? styles.disabled : null, style]}
        {...props}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View role="listitem" style={[styles.item, style]} {...props}>
      {content}
    </View>
  );
}
