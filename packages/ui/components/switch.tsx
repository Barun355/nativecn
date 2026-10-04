import { useEffect } from "react";
import { View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { useFormField } from "@/registry/components/primitives/form-field-context";
import { Pressable, type PressableProps } from "@/registry/components/primitives/pressable";
import { Text } from "@/registry/components/text";
import { useControllableState } from "@/registry/hooks/use-controllable-state";
import { useMotion } from "@/registry/hooks/use-motion";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

export type SwitchProps = Omit<
  PressableProps,
  "children" | "style" | "size" | "pressedStyle" | "haptic" | "loading" | "role"
> & {
  /** Controlled on/off state. */
  checked?: boolean;
  /** Starting state while uncontrolled (default `false`). */
  defaultChecked?: boolean;
  /** Called with the next state when the user toggles it. */
  onCheckedChange?: (checked: boolean) => void;
  /** Visible text next to the switch; it is also the accessible name. */
  label?: string;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
};

const useStyles = createStyles((t) => {
  const track = slot("switch.track", t);
  const inset = t.spacing[0.5];
  const thumb = track.height - inset * 2;
  return {
    root: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing[3],
      alignSelf: "flex-start",
    },
    track: {
      ...track,
      justifyContent: "center",
      paddingHorizontal: inset,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.input,
    },
    trackOn: { backgroundColor: t.colors.primary },
    thumb: {
      width: thumb,
      height: thumb,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.background,
      boxShadow: t.elevation.sm,
    },
    pressed: slot("switch.pressed", t),
    disabled: { opacity: t.opacity.disabled },
  };
});

/**
 * An on/off switch with an optional label. A themed control drawn by nativecn (not the OS
 * Switch), so it looks the same on iOS and Android. Works controlled (`checked` +
 * `onCheckedChange`) or uncontrolled (`defaultChecked`). The thumb slides with the `fast`
 * motion Token and jumps instantly when Reduce Motion is on. Built on the Pressable Primitive:
 * tap area of at least 48, a light haptic tick when `config.haptics` is on. Inside a FormField
 * it reads the field's label and error and takes its `disabled`.
 */
export function Switch({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  label,
  disabled: disabledProp,
  onPress,
  style,
  ...props
}: SwitchProps) {
  const styles = useStyles();
  // Inside a FormField: its label and error become the name and hint, and its `disabled` applies.
  const field = useFormField();
  const disabled = disabledProp ?? field?.disabled ?? false;
  const motion = useMotion();
  const [checked, setChecked] = useControllableState({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });

  // How far the thumb travels from off to on.
  const travel = styles.track.width - styles.track.paddingHorizontal * 2 - styles.thumb.width;
  const offset = useSharedValue(checked ? travel : 0);
  useEffect(() => {
    offset.value = withTiming(checked ? travel : 0, motion.timing("fast"));
  }, [checked, travel, motion, offset]);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  const handlePress = (event: GestureResponderEvent) => {
    setChecked(!checked);
    onPress?.(event);
  };

  return (
    <Pressable
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      haptic="selection"
      size={label == null ? { width: styles.track.width, height: styles.track.height } : undefined}
      pressedStyle={styles.pressed}
      onPress={handlePress}
      style={[styles.root, disabled ? styles.disabled : null, style]}
      {...field?.accessibilityProps}
      {...props}
    >
      <View style={[styles.track, checked ? styles.trackOn : null]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
      {label != null ? <Text variant="label">{label}</Text> : null}
    </Pressable>
  );
}
