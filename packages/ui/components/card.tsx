import type { ReactNode, Ref } from "react";
import {
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { Pressable, type PressableHaptic } from "@/registry/components/primitives/pressable";
import { Text, type TextProps } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

export type CardProps = Omit<ViewProps, "style" | "hitSlop"> & {
  children?: ReactNode;
  /** Makes the whole card one pressable target (role `button`, pressed look from `card.pressed`). */
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  /** Only for a pressable card: blocks presses, dims it and announces it as disabled. */
  disabled?: boolean;
  /** Only for a pressable card: haptic feedback on press (when `config.haptics` is on). */
  haptic?: PressableHaptic;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
};

export type CardSectionProps = ViewProps & { children?: ReactNode; ref?: Ref<View> };

export type CardTitleProps = Omit<TextProps, "variant">;
export type CardDescriptionProps = Omit<TextProps, "variant">;

const useStyles = createStyles((t) => ({
  root: {
    ...slot("card.root", t),
    backgroundColor: t.colors.card,
    borderColor: t.colors.border,
    borderCurve: "continuous",
  },
  pressed: slot("card.pressed", t),
  disabled: { opacity: t.opacity.disabled },
  header: slot("card.header", t),
  title: slot("card.title", t),
  content: { gap: t.spacing[2] },
  footer: { flexDirection: "row", alignItems: "center", gap: t.spacing[2] },
}));

/**
 * A surface that groups related content. Compose it from CardHeader, CardTitle, CardDescription,
 * CardContent and CardFooter. With `onPress` the whole card becomes one pressable target, built
 * on the Pressable Primitive. `style` is merged last onto the root.
 */
export function Card({
  children,
  onPress,
  onLongPress,
  disabled = false,
  haptic,
  style,
  ...props
}: CardProps) {
  const styles = useStyles();

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        haptic={haptic}
        // A card is taller than the 48 touch target: no tap-area extension, no layout pass.
        hitSlop={0}
        pressedStyle={styles.pressed}
        style={[styles.root, disabled ? styles.disabled : null, style]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.root, style]} {...props}>
      {children}
    </View>
  );
}

/** Holds the CardTitle and CardDescription. */
export function CardHeader({ style, ...props }: CardSectionProps) {
  const styles = useStyles();
  return <View style={[styles.header, style]} {...props} />;
}

/** The card's heading (role `heading`), from the `card.title` Slot. */
export function CardTitle({ style, ...props }: CardTitleProps) {
  const styles = useStyles();
  return <Text variant="h4" style={[styles.title, style]} {...props} />;
}

/** Supporting text under the CardTitle, in the muted foreground. */
export function CardDescription({ color = "mutedForeground", ...props }: CardDescriptionProps) {
  return <Text variant="small" color={color} {...props} />;
}

/** The card's main content. */
export function CardContent({ style, ...props }: CardSectionProps) {
  const styles = useStyles();
  return <View style={[styles.content, style]} {...props} />;
}

/** A row of actions at the bottom of the card. */
export function CardFooter({ style, ...props }: CardSectionProps) {
  const styles = useStyles();
  return <View style={[styles.footer, style]} {...props} />;
}
