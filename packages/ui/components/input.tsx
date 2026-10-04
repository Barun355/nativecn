import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState, type Ref } from "react";
import {
  Pressable as RNPressable,
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { Icon, type IconSize } from "@/registry/components/icon";
import { useFocusChainField } from "@/registry/components/primitives/focus-chain";
import {
  useFormField,
  type FormFieldState,
  type FormFieldStatus,
} from "@/registry/components/primitives/form-field-context";
import { Pressable, touchTargetHitSlop } from "@/registry/components/primitives/pressable";
import { slot } from "@/registry/styles";
import { createStyles, useTheme } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

export type InputSize = "sm" | "md" | "lg";
export type InputStatus = FormFieldStatus;

const iconSizes = { sm: "sm", md: "md", lg: "lg" } as const satisfies Record<InputSize, IconSize>;

export type InputProps = Omit<TextInputProps, "style"> & {
  /** Default `md`. */
  size?: InputSize;
  /** A Lucide icon shown before the text (decorative). */
  icon?: LucideIcon;
  /** Error or success colours, announced once. Inside a FormField it defaults to the field's. */
  status?: InputStatus;
  /** Not editable, dimmed and skipped by FocusChain. Inside a FormField it defaults to the field's. */
  disabled?: boolean;
  /** Layout only, merged last onto the root (the bordered frame). */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<TextInput>;
};

/** The frame's styles, shared by Input and Textarea (same Style Slots, same Colour Roles). */
export const useInputStyles = createStyles((t) => {
  const { fontSize, lineHeight, fontFamily, letterSpacing, ...frame } = slot("input.root", t);
  return {
    root: {
      ...frame,
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing[2],
      borderCurve: "continuous",
      backgroundColor: t.colors.background,
      borderColor: t.colors.input,
    },
    sm: slot("input.sm", t),
    md: {},
    lg: slot("input.lg", t),
    text: {
      flex: 1,
      alignSelf: "stretch",
      margin: 0,
      padding: 0,
      color: t.colors.foreground,
      fontSize,
      fontFamily,
      letterSpacing,
    },
    /** Textarea: the frame grows with its content. */
    autoHeight: { height: "auto", alignItems: "stretch" },
    multilineText: { lineHeight, paddingVertical: t.spacing[2], textAlignVertical: "top" },
    // The focus ring: the `ring` Colour Role, drawn outside the border.
    focused: {
      borderColor: t.colors.ring,
      outlineColor: t.colors.ring,
      outlineStyle: "solid",
      outlineWidth: t.borderWidth.default * 2,
    },
    error: { borderColor: t.colors.destructive, outlineColor: t.colors.destructive },
    success: { borderColor: t.colors.success, outlineColor: t.colors.success },
    disabled: { opacity: t.opacity.disabled },
    pressed: slot("button.pressed", t),
  };
});

/**
 * The extra tap area above and below a text field's frame so it reaches `min` (the 48 touch
 * target), from the frame's height. The height is known before layout (a Size's Style Slot, or
 * a height set through `style`), so the tap area is right from the first frame. Width is left
 * alone: fields are wide.
 */
function fieldHitSlop(frameStyle: StyleProp<ViewStyle>, min: number) {
  const { height } = StyleSheet.flatten(frameStyle) ?? {};
  return touchTargetHitSlop(undefined, typeof height === "number" ? height : undefined, min);
}

export type TextFieldOptions = Pick<
  TextInputProps,
  "placeholder" | "aria-label" | "accessibilityHint" | "onFocus" | "onBlur"
> & {
  disabled?: boolean;
  status?: InputStatus;
};

export type TextField = {
  /** The enclosing FormField, or `null`. */
  field: FormFieldState | null;
  disabled: boolean;
  status: InputStatus | undefined;
  focused: boolean;
  /** Spread onto the TextInput: accessible name and hint, disabled state and focus tracking. */
  inputProps: Pick<
    TextInputProps,
    "aria-label" | "aria-disabled" | "accessibilityHint" | "onFocus" | "onBlur"
  >;
};

/**
 * The shared behaviour of text fields (Input, Textarea): reads the enclosing FormField,
 * tracks focus for the ring and announces a new `status`. Precedence: `disabled` > `status`. A FormField's error is announced by the FormField itself.
 */
export function useTextField({
  disabled: disabledProp,
  status: statusProp,
  placeholder,
  "aria-label": ariaLabel,
  accessibilityHint,
  onFocus,
  onBlur,
}: TextFieldOptions): TextField {
  const field = useFormField();
  const disabled = disabledProp ?? field?.disabled ?? false;
  const status = disabled ? undefined : (statusProp ?? field?.status);
  const [focused, setFocused] = useState(false);

  const name = ariaLabel ?? field?.label ?? placeholder;
  const fieldError = field?.error;
  const announced = useRef<InputStatus | undefined>(undefined);
  useEffect(() => {
    if (status && status !== announced.current && !fieldError) {
      announce(name ? `${name}: ${status}` : status);
    }
    announced.current = status;
  }, [status, name, fieldError]);

  const a11y = field?.accessibilityProps;
  return {
    field,
    disabled,
    status,
    focused,
    inputProps: {
      "aria-label": ariaLabel ?? a11y?.["aria-label"],
      accessibilityHint: accessibilityHint ?? a11y?.accessibilityHint,
      "aria-disabled": disabled,
      onFocus: (e) => {
        setFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setFocused(false);
        onBlur?.(e);
      },
    },
  };
}

/**
 * A single-line text field. Colours come from the Colour Roles (`input` border, `ring` focus
 * ring, `destructive`/`success` status); Sizes from the `input.*` Style Slots. With
 * `secureTextEntry` it adds a Show/Hide password toggle. Inside a FormField it takes the label as
 * its name and the error as its hint, and inside a FocusChain its return key reads Next/Done.
 * TextInput props pass through; `style` is merged last onto the frame.
 */
export function Input({
  size = "md",
  icon,
  status,
  disabled,
  secureTextEntry,
  editable,
  placeholder,
  placeholderTextColor,
  returnKeyType,
  onSubmitEditing,
  submitBehavior,
  "aria-label": ariaLabel,
  accessibilityHint,
  onFocus,
  onBlur,
  style,
  ref,
  ...props
}: InputProps) {
  const { colors, iconSize, minTouchTarget } = useTheme();
  const styles = useInputStyles();
  const inputRef = useRef<TextInput | null>(null);
  // Merge the own ref (stable, for FocusChain) with the user's `ref` prop.
  const setRef = useCallback(
    (node: TextInput | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const f = useTextField({
    disabled,
    status,
    placeholder,
    "aria-label": ariaLabel,
    accessibilityHint,
    onFocus,
    onBlur,
  });
  const [revealed, setRevealed] = useState(false);
  const chain = useFocusChainField(inputRef, {
    disabled: f.disabled || editable === false,
    multiline: props.multiline,
    returnKeyType,
    onSubmitEditing,
    submitBehavior,
  });

  const toggleSide = iconSize[iconSizes[size]];
  const isEditable = !f.disabled && editable !== false;
  const frameStyle: StyleProp<ViewStyle> = [
    styles.root,
    styles[size],
    f.focused ? styles.focused : null,
    f.status ? styles[f.status] : null,
    f.disabled ? styles.disabled : null,
    style,
  ];
  const hitSlop = fieldHitSlop(frameStyle, minTouchTarget);

  return (
    // The frame extends the tap area to 48 (TextInput has no hitSlop): a tap on the frame or
    // within its hitSlop focuses the field. It is invisible to screen readers, which reach the
    // TextInput (and the password toggle) directly.
    <RNPressable
      accessible={false}
      focusable={false}
      importantForAccessibility="no"
      disabled={!isEditable}
      hitSlop={hitSlop}
      onPress={isEditable ? () => inputRef.current?.focus() : undefined}
      style={frameStyle}
    >
      {icon ? <Icon icon={icon} size={iconSizes[size]} color="mutedForeground" /> : null}
      <TextInput
        ref={setRef}
        editable={isEditable}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor ?? colors.mutedForeground}
        selectionColor={colors.primary}
        secureTextEntry={!!secureTextEntry && !revealed}
        style={styles.text}
        {...props}
        {...chain}
        {...f.inputProps}
      />
      {secureTextEntry ? (
        <Pressable
          aria-label={revealed ? "Hide password" : "Show password"}
          disabled={f.disabled}
          size={{ width: toggleSide, height: toggleSide }}
          pressedStyle={styles.pressed}
          onPress={() => setRevealed((r) => !r)}
        >
          <Icon icon={revealed ? EyeOff : Eye} size={iconSizes[size]} color="mutedForeground" />
        </Pressable>
      ) : null}
    </RNPressable>
  );
}
