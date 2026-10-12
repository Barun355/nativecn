import { X, type LucideIcon } from "lucide-react-native";
import { createContext, use, useState } from "react";
import { View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";

import { Icon } from "@/registry/components/icon";
import {
  Pressable,
  touchTargetHitSlop,
  type PressableProps,
} from "@/registry/components/primitives/pressable";
import {
  SelectionGroup,
  useSelectionItem,
  type SelectionGroupMultipleProps,
  type SelectionGroupSingleProps,
} from "@/registry/components/primitives/selection-group";
import { Text } from "@/registry/components/text";
import { useControllableState } from "@/registry/hooks/use-controllable-state";
import { slot } from "@/registry/styles";
import { createStyles, useTheme } from "@/registry/theme";

export type ChipProps = Omit<
  PressableProps,
  "children" | "style" | "size" | "pressedStyle" | "haptic" | "loading" | "role"
> & {
  /** The visible text, which is also the accessible name. */
  label: string;
  /** A Lucide icon component shown before the label. */
  icon?: LucideIcon;
  /**
   * The value this Chip stands for inside a ChipGroup (required there). Inside a group the
   * group owns the selection, so `selected`/`defaultSelected`/`onSelectedChange` are ignored.
   */
  value?: string;
  /** Controlled selected state. Passing any of the three selection props makes the Chip a toggle. */
  selected?: boolean;
  /** Starting selected state while uncontrolled. */
  defaultSelected?: boolean;
  /** Called with the next selected state when the user toggles it. */
  onSelectedChange?: (selected: boolean) => void;
  /**
   * Shows a remove (×) button inside the pill. It is its own control, a sibling of the Chip's
   * press (never nested in it), named "Remove <label>", with a 48 tap area. With a `testID`,
   * the button's is `<testID>-remove`.
   */
  onRemove?: () => void;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
};

type ChipGroupOwnProps = {
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
};

/**
 * `single` (default): one Chip at a time, announced as a `radiogroup` of `radio` items.
 * `multiple`: any number, announced as a `group` of `checkbox` items. Both are built on the
 * SelectionGroup Primitive and work controlled (`value` + `onValueChange`) or uncontrolled
 * (`defaultValue`).
 */
export type ChipGroupProps =
  | (Omit<SelectionGroupSingleProps, "itemRole" | "style"> & ChipGroupOwnProps)
  | (Omit<SelectionGroupMultipleProps, "itemRole" | "style"> & ChipGroupOwnProps);

const useStyles = createStyles((t) => {
  // chip.root carries the label's type step too; split it between the root and the label.
  const { fontFamily, fontSize, lineHeight, letterSpacing, ...root } = slot("chip.root", t);
  return {
    root: {
      ...root,
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: t.spacing[1],
      borderCurve: "continuous",
      borderWidth: t.borderWidth.default,
      borderColor: t.colors.border,
      backgroundColor: t.colors.background,
    },
    rootOn: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
    label: { fontFamily, fontSize, lineHeight, letterSpacing },
    press: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", gap: t.spacing[1] },
    remove: { borderRadius: t.radius.full },
    group: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[2] },
    pressed: slot("chip.pressed", t),
    disabled: { opacity: t.opacity.disabled },
  };
});

/** Set by ChipGroup so its Chips join the group's selection. */
const ChipGroupContext = createContext(false);

type ChipViewProps = Omit<
  ChipProps,
  "value" | "selected" | "defaultSelected" | "onSelectedChange"
> & {
  /** `undefined` when the Chip is not selectable (a plain or removable Chip). */
  on: boolean | undefined;
  /** The selection role and state, from the group or the standalone toggle. */
  selectionProps: Partial<PressableProps>;
  onToggle: (() => void) | undefined;
};

function ChipView({
  label,
  icon,
  onRemove,
  on,
  selectionProps,
  onToggle,
  disabled = false,
  onPress,
  onPressIn,
  onPressOut,
  testID,
  style,
  ...props
}: ChipViewProps) {
  const styles = useStyles();
  const { iconSize, minTouchTarget } = useTheme();
  const [pressed, setPressed] = useState(false);
  const color = on ? "primaryForeground" : "foreground";
  const surface = [styles.root, on ? styles.rootOn : null, disabled ? styles.disabled : null];

  const handlePress = (event: GestureResponderEvent) => {
    onToggle?.();
    onPress?.(event);
  };

  const press = {
    role: "button",
    ...selectionProps,
    disabled,
    haptic: on === undefined ? undefined : "selection",
    testID,
    ...props,
  } satisfies PressableProps;
  const content = (
    <>
      {icon ? <Icon icon={icon} size="sm" color={color} /> : null}
      <Text variant="label" color={color} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </>
  );

  if (!onRemove) {
    return (
      <Pressable
        {...press}
        size={{ height: styles.root.height }}
        pressedStyle={styles.pressed}
        style={[...surface, style]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handlePress}
      >
        {content}
      </Pressable>
    );
  }

  // Removable: a plain View draws the pill and holds two sibling controls, the Chip's press
  // and the × button. Nesting one inside the other would put a button inside a button on
  // react-native-web (invalid HTML that screen readers can mis-announce).
  const lead =
    typeof styles.root.paddingHorizontal === "number" ? styles.root.paddingHorizontal : 0;
  const slop = touchTargetHitSlop(undefined, styles.root.height, minTouchTarget);
  return (
    <View style={[...surface, pressed ? styles.pressed : null, style]}>
      <Pressable
        {...press}
        // Reaches 48 high and covers the pill's leading padding.
        hitSlop={{ top: slop?.top ?? 0, bottom: slop?.bottom ?? 0, left: lead, right: 0 }}
        style={styles.press}
        onPressIn={(event) => {
          setPressed(true);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          setPressed(false);
          onPressOut?.(event);
        }}
        onPress={handlePress}
      >
        {content}
      </Pressable>
      <Pressable
        aria-label={`Remove ${label}`}
        disabled={disabled}
        size={{ width: iconSize.sm, height: iconSize.sm }}
        onPress={onRemove}
        testID={testID ? `${testID}-remove` : undefined}
        style={styles.remove}
      >
        <Icon icon={X} size="sm" color={color} />
      </Pressable>
    </View>
  );
}

function StandaloneChip({
  selected: selectedProp,
  defaultSelected,
  onSelectedChange,
  value: _value,
  ...props
}: ChipProps) {
  const selectable =
    selectedProp !== undefined || defaultSelected !== undefined || onSelectedChange !== undefined;
  const [selected, setSelected] = useControllableState({
    value: selectedProp,
    defaultValue: defaultSelected ?? false,
    onChange: onSelectedChange,
  });
  return (
    <ChipView
      {...props}
      on={selectable ? selected : undefined}
      selectionProps={selectable ? { role: "checkbox", "aria-checked": selected } : {}}
      onToggle={selectable ? () => setSelected(!selected) : undefined}
    />
  );
}

function GroupChip({
  value,
  selected: _selected,
  defaultSelected: _defaultSelected,
  onSelectedChange: _onSelectedChange,
  disabled: ownDisabled = false,
  ...props
}: ChipProps) {
  if (__DEV__ && value === undefined) {
    console.warn(`Chip "${props.label}": a Chip inside a ChipGroup needs a \`value\`.`);
  }
  const { selected, disabled, itemProps } = useSelectionItem({
    value: value ?? props.label,
    disabled: ownDisabled,
  });
  const { onPress: select, disabled: _itemDisabled, ...selectionProps } = itemProps;
  return (
    <ChipView
      {...props}
      disabled={disabled}
      on={selected}
      selectionProps={selectionProps}
      onToggle={select}
    />
  );
}

/**
 * A compact, pill-shaped choice. Alone it is a plain Chip, a toggle (when `selected`,
 * `defaultSelected` or `onSelectedChange` is given, announced as a checkbox) or a removable
 * Chip (`onRemove`). Inside a ChipGroup it joins the group's selection by `value`. Built on the
 * Pressable Primitive: pressed look from the `chip.pressed` Slot, tap area of at least 48 and a
 * light haptic tick on selection when `config.haptics` is on.
 */
export function Chip(props: ChipProps) {
  const inGroup = use(ChipGroupContext);
  return inGroup ? <GroupChip {...props} /> : <StandaloneChip {...props} />;
}

/**
 * A wrapping row of Chips with a shared selection: `type="single"` (default) or `"multiple"`.
 * Built on the SelectionGroup Primitive; `disabled` disables every Chip.
 */
export function ChipGroup({ style, ...props }: ChipGroupProps) {
  const styles = useStyles();
  return (
    <ChipGroupContext value>
      <SelectionGroup {...(props as SelectionGroupSingleProps)} style={[styles.group, style]} />
    </ChipGroupContext>
  );
}
