import { View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";

import { Pressable, type PressableProps } from "@/registry/components/primitives/pressable";
import {
  SelectionGroup,
  useSelectionItem,
  type SelectionGroupSingleProps,
} from "@/registry/components/primitives/selection-group";
import { Text } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

export type RadioGroupOrientation = "vertical" | "horizontal";

export type RadioGroupProps = Omit<SelectionGroupSingleProps, "type" | "itemRole" | "style"> & {
  /** Controlled selected value. */
  value?: string;
  /** Starting value while uncontrolled. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void;
  /** How the items are laid out (default `vertical`). */
  orientation?: RadioGroupOrientation;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
};

export type RadioGroupItemProps = Omit<
  PressableProps,
  "children" | "style" | "size" | "pressedStyle" | "haptic" | "loading" | "role"
> & {
  /** The value this item selects in its RadioGroup. */
  value: string;
  /** Visible text next to the dot; it is also the accessible name. */
  label?: string;
  disabled?: boolean;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => {
  const dot = slot("radio.dot", t);
  return {
    group: { gap: t.spacing[3] },
    vertical: { flexDirection: "column" },
    horizontal: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[4] },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing[2],
      alignSelf: "flex-start",
    },
    dot: {
      ...dot,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: t.radius.full,
      borderWidth: t.borderWidth.default,
      borderColor: t.colors.input,
      backgroundColor: t.colors.background,
    },
    dotOn: { borderColor: t.colors.primary },
    // The inner dot is half the outer one.
    inner: {
      width: dot.width / 2,
      height: dot.height / 2,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.primary,
    },
    pressed: slot("radio.pressed", t),
    disabled: { opacity: t.opacity.disabled },
  };
});

/**
 * A single choice from a list, built on the SelectionGroup Primitive: announced as a
 * `radiogroup` of `radio` items with `aria-checked`. Works controlled (`value` +
 * `onValueChange`) or uncontrolled (`defaultValue`); `disabled` disables every item.
 */
export function RadioGroup({ orientation = "vertical", style, ...props }: RadioGroupProps) {
  const styles = useStyles();
  return (
    <SelectionGroup
      type="single"
      itemRole="radio"
      style={[styles.group, styles[orientation], style]}
      {...props}
    />
  );
}

/**
 * One option of a RadioGroup: a dot and an optional label. The whole row is the tap target
 * (at least 48) and gives a light haptic tick when `config.haptics` is on.
 */
export function RadioGroupItem({
  value,
  label,
  disabled: ownDisabled = false,
  onPress,
  style,
  ...props
}: RadioGroupItemProps) {
  const styles = useStyles();
  const { selected, disabled, itemProps } = useSelectionItem({ value, disabled: ownDisabled });

  const handlePress = (event: GestureResponderEvent) => {
    itemProps.onPress();
    onPress?.(event);
  };

  return (
    <Pressable
      {...itemProps}
      haptic="selection"
      size={label == null ? { width: styles.dot.width, height: styles.dot.height } : undefined}
      pressedStyle={styles.pressed}
      style={[styles.item, disabled ? styles.disabled : null, style]}
      {...props}
      onPress={handlePress}
    >
      <View style={[styles.dot, selected ? styles.dotOn : null]}>
        {selected ? <View style={styles.inner} /> : null}
      </View>
      {label != null ? <Text variant="label">{label}</Text> : null}
    </Pressable>
  );
}
