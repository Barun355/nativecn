import { Check, Minus } from "lucide-react-native";
import { View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";

import { Icon } from "@/registry/components/icon";
import { useFormField } from "@/registry/components/primitives/form-field-context";
import { Pressable, type PressableProps } from "@/registry/components/primitives/pressable";
import { Text } from "@/registry/components/text";
import { useControllableState } from "@/registry/hooks/use-controllable-state";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

export type CheckboxProps = Omit<
  PressableProps,
  "children" | "style" | "size" | "pressedStyle" | "haptic" | "loading" | "role"
> & {
  /** Controlled checked state. */
  checked?: boolean;
  /** Starting checked state while uncontrolled (default `false`). */
  defaultChecked?: boolean;
  /** Called with the next checked state when the user toggles it. */
  onCheckedChange?: (checked: boolean) => void;
  /** Visible text next to the box; it is also the accessible name. */
  label?: string;
  /**
   * Shows a dash and is announced as "mixed" (e.g. a "select all" with some items checked).
   * Pressing it checks the box; the screen decides when to clear it.
   */
  indeterminate?: boolean;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => ({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    alignSelf: "flex-start",
  },
  box: {
    ...slot("checkbox.box", t),
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
    borderWidth: t.borderWidth.default,
    borderColor: t.colors.input,
    backgroundColor: t.colors.background,
  },
  boxOn: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  boxError: { borderColor: t.colors.destructive },
  pressed: slot("checkbox.pressed", t),
  disabled: { opacity: t.opacity.disabled },
}));

/**
 * A checkbox with an optional label. Works controlled (`checked` + `onCheckedChange`) or
 * uncontrolled (`defaultChecked`); `indeterminate` shows a dash and is announced as mixed.
 * Built on the Pressable Primitive: the whole row is the tap target (at least 48), it gives a
 * light haptic tick when `config.haptics` is on, and nothing fires while disabled. Inside a
 * FormField it reads the field's label and error, takes its `disabled`, and an error outlines
 * the box in `destructive`.
 */
export function Checkbox({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  label,
  indeterminate = false,
  disabled: disabledProp,
  onPress,
  style,
  ...props
}: CheckboxProps) {
  const styles = useStyles();
  // Inside a FormField: its label and error become the name and hint, and its `disabled` applies.
  const field = useFormField();
  const disabled = disabledProp ?? field?.disabled ?? false;
  const [checked, setChecked] = useControllableState({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });
  const on = checked || indeterminate;

  const handlePress = (event: GestureResponderEvent) => {
    // An indeterminate box always becomes checked.
    setChecked(indeterminate ? true : !checked);
    onPress?.(event);
  };

  const box = styles.box;
  return (
    <Pressable
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      haptic="selection"
      // Without a label the box is the whole target, so its size is known before layout.
      size={label == null ? { width: box.width, height: box.height } : undefined}
      pressedStyle={styles.pressed}
      onPress={handlePress}
      style={[styles.root, disabled ? styles.disabled : null, style]}
      {...field?.accessibilityProps}
      {...props}
    >
      <View style={[box, on ? styles.boxOn : field?.status === "error" ? styles.boxError : null]}>
        {on ? (
          <Icon
            icon={indeterminate ? Minus : Check}
            size="sm"
            color="primaryForeground"
            strokeWidth={3}
          />
        ) : null}
      </View>
      {label != null ? <Text variant="label">{label}</Text> : null}
    </Pressable>
  );
}
