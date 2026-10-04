import { StyleSheet, TextInput, View } from "react-native";

import { useInputStyles, useTextField, type InputProps } from "@/registry/components/input";
import { Text } from "@/registry/components/text";
import { useControllableState } from "@/registry/hooks/use-controllable-state";
import { createStyles, useTheme } from "@/registry/theme";

export type TextareaProps = Omit<InputProps, "icon" | "multiline" | "secureTextEntry"> & {
  /** Visible rows when empty (default `3`). */
  minRows?: number;
  /** The field grows with its text up to this many rows, then scrolls (default `8`). */
  maxRows?: number;
};

const useStyles = createStyles((t) => ({
  counter: { marginTop: t.spacing[1] },
}));

/**
 * A multi-line text field that grows with its text from `minRows` to `maxRows`. Setting
 * `maxLength` adds a character counter. Same frame, Colour Roles and FormField wiring as Input;
 * FocusChain skips it, so Enter keeps adding new lines. Works controlled (`value` +
 * `onChangeText`) or uncontrolled (`defaultValue`). `style` is merged last onto the root.
 */
export function Textarea({
  size = "md",
  minRows = 3,
  maxRows = 8,
  maxLength,
  value,
  defaultValue,
  onChangeText,
  status,
  disabled,
  editable,
  placeholder,
  placeholderTextColor,
  "aria-label": ariaLabel,
  accessibilityHint,
  onFocus,
  onBlur,
  style,
  ref,
  ...props
}: TextareaProps) {
  const { colors } = useTheme();
  const styles = useInputStyles();
  const own = useStyles();
  const f = useTextField({
    disabled,
    status,
    placeholder,
    "aria-label": ariaLabel,
    accessibilityHint,
    onFocus,
    onBlur,
  });
  const [text, setText] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange: onChangeText,
  });

  const { lineHeight = 0, paddingVertical = 0 } = StyleSheet.flatten(styles.multilineText) as {
    lineHeight?: number;
    paddingVertical?: number;
  };
  const rows = (n: number) => n * lineHeight + 2 * paddingVertical;
  const minHeight = rows(minRows);
  const maxHeight = rows(Math.max(minRows, maxRows));

  return (
    <View style={style}>
      <View
        style={[
          styles.root,
          styles[size],
          styles.autoHeight,
          f.focused ? styles.focused : null,
          f.status ? styles[f.status] : null,
          f.disabled ? styles.disabled : null,
        ]}
      >
        <TextInput
          ref={ref}
          multiline
          editable={!f.disabled && editable !== false}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor ?? colors.mutedForeground}
          selectionColor={colors.primary}
          maxLength={maxLength}
          value={text}
          onChangeText={setText}
          style={[styles.text, styles.multilineText, { minHeight, maxHeight }]}
          {...props}
          {...f.inputProps}
        />
      </View>
      {maxLength != null ? (
        <Text
          variant="caption"
          color="mutedForeground"
          align="right"
          style={own.counter}
          aria-label={`${text.length} of ${maxLength} characters`}
        >
          {`${text.length}/${maxLength}`}
        </Text>
      ) : null}
    </View>
  );
}
