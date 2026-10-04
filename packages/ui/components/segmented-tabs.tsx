import type { LucideIcon } from "lucide-react-native";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import {
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { Icon } from "@/registry/components/icon";
import { Pressable, type PressableProps } from "@/registry/components/primitives/pressable";
import { SelectionGroup, useSelectionItem } from "@/registry/components/primitives/selection-group";
import { Text } from "@/registry/components/text";
import { useControllableState } from "@/registry/hooks/use-controllable-state";
import { useMotion } from "@/registry/hooks/use-motion";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

/**
 * - `segmented`: a filled track with a raised pill under the selected tab (iOS segmented control).
 * - `underline`: tabs on a bottom border with a bar under the selected tab.
 */
const variants = {
  segmented: { list: "segmentedList", trigger: "segmentedTrigger", indicator: "pill" },
  underline: { list: "underlineList", trigger: "underlineTrigger", indicator: "bar" },
} as const;

export type SegmentedTabsVariant = keyof typeof variants;

type SegmentedTabsContextValue = {
  value: string | undefined;
  setValue: (value: string) => void;
  variant: SegmentedTabsVariant;
  disabled: boolean;
};

const SegmentedTabsContext = createContext<SegmentedTabsContextValue | null>(null);

function useSegmentedTabs(part: string): SegmentedTabsContextValue {
  const context = use(SegmentedTabsContext);
  if (!context) throw new Error(`<${part}> must be used inside <SegmentedTabs>.`);
  return context;
}

type TriggerLayout = { x: number; width: number };
type ListContextValue = { reportLayout: (value: string, layout: TriggerLayout) => void };
const ListContext = createContext<ListContextValue | null>(null);

const useStyles = createStyles((t) => {
  const list = slot("segmented-tabs.list", t);
  const trigger = slot("segmented-tabs.trigger", t);
  return {
    root: { gap: t.spacing[4] },
    segmentedList: {
      ...list,
      flexDirection: "row",
      alignItems: "stretch",
      borderCurve: "continuous",
      backgroundColor: t.colors.muted,
    },
    underlineList: {
      height: list.height,
      flexDirection: "row",
      alignItems: "stretch",
      borderBottomWidth: t.borderWidth.default,
      borderBottomColor: t.colors.border,
    },
    trigger: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: t.spacing[2],
      paddingHorizontal: t.spacing[3],
    },
    segmentedTrigger: { ...trigger, borderCurve: "continuous" },
    underlineTrigger: {},
    pressed: slot("segmented-tabs.pressed", t),
    disabled: { opacity: t.opacity.disabled },
    indicator: { position: "absolute", left: 0 },
    pill: {
      top: list.padding,
      bottom: list.padding,
      borderRadius: trigger.borderRadius,
      borderCurve: "continuous",
      backgroundColor: t.colors.background,
      boxShadow: t.elevation.sm,
    },
    bar: {
      bottom: 0,
      height: t.scaleValue(2),
      backgroundColor: t.colors.foreground,
    },
    label: { flexShrink: 1 },
  };
});

export type SegmentedTabsProps = Omit<ViewProps, "children"> & {
  /** The selected tab (controlled). */
  value?: string;
  /** The tab selected first (uncontrolled). */
  defaultValue?: string;
  /** Called with the tab's `value` when the user picks it. */
  onValueChange?: (value: string) => void;
  /** Default `segmented`. */
  variant?: SegmentedTabsVariant;
  /** Disables every tab. */
  disabled?: boolean;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
  children?: ReactNode;
};

/**
 * In-screen tabs: a SegmentedTabsList of SegmentedTabsTriggers, then one SegmentedTabsContent
 * per tab (only the selected one renders). Not navigation: use TabNavigation for the bottom bar.
 * Works controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).
 */
export function SegmentedTabs({
  value: valueProp,
  defaultValue,
  onValueChange,
  variant = "segmented",
  disabled = false,
  style,
  children,
  ...props
}: SegmentedTabsProps) {
  const styles = useStyles();
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((next: string | undefined) => void) | undefined,
  });
  const context = useMemo<SegmentedTabsContextValue>(
    () => ({ value, setValue, variant, disabled }),
    [value, setValue, variant, disabled],
  );

  return (
    <SegmentedTabsContext value={context}>
      <View style={[styles.root, style]} {...props}>
        {children}
      </View>
    </SegmentedTabsContext>
  );
}

export type SegmentedTabsListProps = Omit<ViewProps, "children" | "role"> & {
  /** Layout only, merged last onto the list. */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
  children?: ReactNode;
};

/** The row of tabs (`tablist`), with the selected-tab indicator that slides between them. */
export function SegmentedTabsList({ style, children, ...props }: SegmentedTabsListProps) {
  const { value, setValue, variant, disabled } = useSegmentedTabs("SegmentedTabsList");
  const styles = useStyles();
  const motion = useMotion();
  const v = variants[variant];

  const [layouts, setLayouts] = useState<Record<string, TriggerLayout>>({});
  const reportLayout = useCallback((key: string, layout: TriggerLayout) => {
    setLayouts((prev) => {
      const current = prev[key];
      if (current && current.x === layout.x && current.width === layout.width) return prev;
      return { ...prev, [key]: layout };
    });
  }, []);
  const listContext = useMemo(() => ({ reportLayout }), [reportLayout]);

  // The indicator jumps into place the first time, then slides (instantly under Reduce Motion).
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const visible = useSharedValue(0);
  const placed = useRef(false);
  const target = value === undefined ? undefined : layouts[value];
  useEffect(() => {
    if (!target) {
      visible.value = 0;
      placed.current = false;
      return;
    }
    if (placed.current) {
      const timing = motion.timing("fast");
      x.value = withTiming(target.x, timing);
      width.value = withTiming(target.width, timing);
    } else {
      x.value = target.x;
      width.value = target.width;
      placed.current = true;
    }
    visible.value = 1;
  }, [target, motion, x, width, visible]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: visible.value,
    transform: [{ translateX: x.value }],
  }));

  return (
    <ListContext value={listContext}>
      <SelectionGroup
        type="single"
        itemRole="tab"
        value={value ?? ""}
        onValueChange={setValue}
        disabled={disabled}
        style={[styles[v.list], style]}
        {...props}
      >
        <Animated.View
          testID="segmented-tabs-indicator"
          pointerEvents="none"
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.indicator, styles[v.indicator], indicatorStyle]}
        />
        {children}
      </SelectionGroup>
    </ListContext>
  );
}

export type SegmentedTabsTriggerProps = Omit<
  PressableProps,
  "children" | "style" | "pressedStyle" | "role" | "haptic" | "loading"
> & {
  /** Identifies the tab; the matching SegmentedTabsContent shows while it is selected. */
  value: string;
  /** The visible text, which is also the accessible name. */
  label: string;
  /** A Lucide icon component shown before the label. */
  icon?: LucideIcon;
  /** Layout only, merged last onto the tab. */
  style?: StyleProp<ViewStyle>;
};

/** One tab: `role="tab"` with `aria-selected`, a light haptic tick when chosen. */
export function SegmentedTabsTrigger({
  value,
  label,
  icon,
  disabled: ownDisabled = false,
  onPress,
  onLayout,
  style,
  ...props
}: SegmentedTabsTriggerProps) {
  const { variant } = useSegmentedTabs("SegmentedTabsTrigger");
  const list = use(ListContext);
  if (!list) throw new Error("<SegmentedTabsTrigger> must be used inside <SegmentedTabsList>.");
  const styles = useStyles();
  const { selected, disabled, itemProps } = useSelectionItem({ value, disabled: ownDisabled });
  const color = selected ? "foreground" : "mutedForeground";

  const { reportLayout } = list;
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout?.(event);
      const { x, width } = event.nativeEvent.layout;
      reportLayout(value, { x, width });
    },
    [onLayout, reportLayout, value],
  );

  const handlePress = (event: GestureResponderEvent) => {
    itemProps.onPress();
    onPress?.(event);
  };

  return (
    <Pressable
      {...props}
      {...itemProps}
      onPress={handlePress}
      onLayout={handleLayout}
      haptic="selection"
      pressedStyle={styles.pressed}
      style={[
        styles.trigger,
        styles[variants[variant].trigger],
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {icon ? <Icon icon={icon} size="sm" color={color} /> : null}
      <Text variant="label" color={color} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

export type SegmentedTabsContentProps = Omit<ViewProps, "role"> & {
  /** Shown only while the tab with this `value` is selected. */
  value: string;
  /** Layout only, merged last. */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
};

/** The panel for one tab (`tabpanel`). Only the selected tab's Content is rendered. */
export function SegmentedTabsContent({ value, style, ...props }: SegmentedTabsContentProps) {
  const { value: selected } = useSegmentedTabs("SegmentedTabsContent");
  if (selected !== value) return null;
  return <View role="tabpanel" style={style} {...props} />;
}
