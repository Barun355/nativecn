import { Search, X } from "lucide-react-native";
import { useCallback, useRef, useState, type Ref } from "react";
import {
  Pressable as RNPressable,
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { Icon } from "@/registry/components/icon";
import { Pressable, touchTargetHitSlop } from "@/registry/components/primitives/pressable";
import { Spinner } from "@/registry/components/spinner";
import { useControllableState } from "@/registry/hooks/use-controllable-state";
import { slot } from "@/registry/styles";
import { createStyles, useTheme } from "@/registry/theme";

export type SearchFieldProps = Omit<
  TextInputProps,
  "style" | "value" | "defaultValue" | "onChangeText" | "secureTextEntry" | "multiline"
> & {
  /** The query (controlled). */
  value?: string;
  /** The starting query while uncontrolled. */
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  /** Called with the query when the keyboard's Search key is pressed. */
  onSubmit?: (value: string) => void;
  /** Default `"Search"`; also the accessible name when there is no `aria-label`. */
  placeholder?: string;
  /** A spinner replaces the search icon and the field is announced busy; typing still works. */
  loading?: boolean;
  /** Not editable and dimmed. */
  disabled?: boolean;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<TextInput>;
};

const useStyles = createStyles((t) => {
  // Not destructured straight from slot(): once inlined, that literal fails excess-property checks.
  const input = slot("input.root", t);
  const { fontSize, fontFamily, letterSpacing } = input;
  return {
    root: {
      ...slot("search-field.root", t),
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing[2],
      borderCurve: "continuous",
      borderWidth: t.borderWidth.default,
      borderColor: "transparent",
      backgroundColor: t.colors.muted,
    },
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
    // The focus ring: the `ring` Colour Role, drawn outside the frame.
    focused: {
      borderColor: t.colors.ring,
      outlineColor: t.colors.ring,
      outlineStyle: "solid",
      outlineWidth: t.borderWidth.default * 2,
    },
    disabled: { opacity: t.opacity.disabled },
    pressed: slot("button.pressed", t),
  };
});

/**
 * A search box: a search icon, the query and a clear (×) button that appears while there is
 * text. The keyboard's return key reads "Search" and calls `onSubmit(value)`. Works controlled
 * (`value` + `onChangeText`) or uncontrolled. TextInput props pass through; `style` is merged
 * last onto the root.
 */
export function SearchField({
  value,
  defaultValue,
  onChangeText,
  onSubmit,
  onSubmitEditing,
  placeholder = "Search",
  placeholderTextColor,
  loading = false,
  disabled = false,
  editable,
  "aria-label": ariaLabel,
  onFocus,
  onBlur,
  style,
  ref,
  ...props
}: SearchFieldProps) {
  const { colors, iconSize, minTouchTarget } = useTheme();
  const styles = useStyles();
  const [text, setText] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange: onChangeText,
  });
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<TextInput | null>(null);
  const setRef = useCallback(
    (node: TextInput | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const clear = () => {
    setText("");
    inputRef.current?.focus();
  };

  const side = iconSize.sm;
  const isEditable = !disabled && editable !== false;
  const frameStyle: StyleProp<ViewStyle> = [
    styles.root,
    focused ? styles.focused : null,
    disabled ? styles.disabled : null,
    style,
  ];
  // TextInput has no hitSlop, so the frame extends the tap area to 48 above and below. The
  // height is known before layout (the Style Slot, or a height set through `style`).
  const { height: frameHeight } = StyleSheet.flatten(frameStyle) ?? {};
  const hitSlop = touchTargetHitSlop(
    undefined,
    typeof frameHeight === "number" ? frameHeight : undefined,
    minTouchTarget,
  );

  return (
    // A tap on the frame or within its hitSlop focuses the field. The frame is invisible to
    // screen readers, which reach the searchbox (and the clear button) directly.
    <RNPressable
      accessible={false}
      focusable={false}
      importantForAccessibility="no"
      disabled={!isEditable}
      hitSlop={hitSlop}
      onPress={isEditable ? () => inputRef.current?.focus() : undefined}
      style={frameStyle}
    >
      {loading && !disabled ? (
        // The field itself is announced busy, so the Spinner stays silent.
        <Spinner size="md" color="mutedForeground" aria-hidden />
      ) : (
        <Icon icon={Search} size="md" color="mutedForeground" />
      )}
      <TextInput
        ref={setRef}
        role="searchbox"
        aria-label={ariaLabel ?? placeholder}
        aria-disabled={disabled}
        aria-busy={loading && !disabled}
        editable={isEditable}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor ?? colors.mutedForeground}
        selectionColor={colors.primary}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={(e) => {
          onSubmitEditing?.(e);
          onSubmit?.(text);
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={styles.text}
        {...props}
      />
      {text.length > 0 && !disabled ? (
        <Pressable
          aria-label="Clear search"
          size={{ width: side, height: side }}
          pressedStyle={styles.pressed}
          onPress={clear}
        >
          <Icon icon={X} size="sm" color="mutedForeground" />
        </Pressable>
      ) : null}
    </RNPressable>
  );
}
