import { useCallback, useEffect, useRef, useState, type Ref } from "react";
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";

import { useFocusChainField } from "@/registry/components/primitives/focus-chain";
import { useFormField } from "@/registry/components/primitives/form-field-context";
import { Text } from "@/registry/components/text";
import { useControllableState } from "@/registry/hooks/use-controllable-state";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

export type InputOTPStatus = "error" | "success";

/** The border Colour Role of a cell in each state. */
const cellBorders = {
  idle: "input",
  active: "ring",
  error: "destructive",
  success: "success",
} as const;

/** The character shown in a filled cell while `secure` is on. */
const SECURE_DOT = "•";

export type InputOTPProps = Omit<
  TextInputProps,
  | "value"
  | "defaultValue"
  | "onChangeText"
  | "maxLength"
  | "secureTextEntry"
  | "multiline"
  | "style"
  | "editable"
> & {
  /** The number of digits (default `6`). */
  length?: number;
  /** The controlled code. */
  value?: string;
  /** The starting code while uncontrolled (default `""`). */
  defaultValue?: string;
  /** Called with the digits-only code on every change, including a paste. */
  onChangeText?: (code: string) => void;
  /** Called once with the code each time the last cell is filled. */
  onComplete?: (code: string) => void;
  /** Colours the cells and announces the change. The screen sets and clears it. */
  status?: InputOTPStatus;
  /** Shows a dot instead of each digit, and hides the code from screen readers. */
  secure?: boolean;
  /** Blocks typing and is announced as disabled. */
  disabled?: boolean;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
  /** The hidden TextInput that drives the cells (`focus()`, `blur()`, `clear()`). */
  ref?: Ref<TextInput>;
};

/** Keep digits only, at most `length` of them (a pasted "123 456" becomes "123456"). */
export function sanitizeCode(text: string, length: number): string {
  return text.replace(/\D/g, "").slice(0, length);
}

const useStyles = createStyles((t) => ({
  root: { alignSelf: "flex-start" },
  cells: { ...slot("input-otp.root", t), flexDirection: "row" },
  cell: {
    ...slot("input-otp.cell", t),
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
    borderWidth: t.borderWidth.default,
    backgroundColor: t.colors.background,
  },
  idle: { borderColor: t.colors[cellBorders.idle] },
  active: { borderColor: t.colors[cellBorders.active] },
  error: { borderColor: t.colors[cellBorders.error] },
  success: { borderColor: t.colors[cellBorders.success] },
  // The real TextInput covers the cells, so a tap focuses it and a long press offers Paste. Its
  // text and caret are transparent (not `opacity: 0`, which hides it from VoiceOver).
  input: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    color: "transparent",
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
  },
  disabled: { opacity: t.opacity.disabled },
}));

/**
 * A one-time code field: one hidden TextInput drives `length` visible cells, so typing, deleting,
 * SMS/Keychain autofill (`one-time-code`) and paste all behave like one field. Numeric keyboard;
 * `onComplete` fires when the last cell is filled. Inside FormField it takes its label, status and
 * disabled state; inside FocusChain it joins as one field. Screen readers read one field:
 * "Code, 6 digits". Precedence: `disabled` > `status`.
 */
export function InputOTP({
  length = 6,
  value,
  defaultValue = "",
  onChangeText,
  onComplete,
  status,
  secure = false,
  disabled,
  style,
  ref,
  testID,
  onFocus,
  onBlur,
  returnKeyType,
  onSubmitEditing,
  submitBehavior,
  "aria-label": ariaLabel,
  accessibilityHint,
  ...props
}: InputOTPProps) {
  const field = useFormField();
  const styles = useStyles();

  const isDisabled = disabled ?? field?.disabled ?? false;
  const shownStatus = isDisabled ? undefined : (status ?? field?.status);

  const [raw, setCode] = useControllableState({
    value,
    defaultValue,
    onChange: onChangeText,
  });
  const code = sanitizeCode(raw, length);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<TextInput | null>(null);
  const setRefs = useCallback(
    (node: TextInput | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const chain = useFocusChainField(inputRef, {
    disabled: isDisabled,
    returnKeyType,
    onSubmitEditing,
    submitBehavior,
  });

  const handleChangeText = (text: string) => {
    if (isDisabled) return;
    const next = sanitizeCode(text, length);
    if (next === code) return;
    setCode(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleFocus: TextInputProps["onFocus"] = (event) => {
    setFocused(true);
    onFocus?.(event);
  };
  const handleBlur: TextInputProps["onBlur"] = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  // The spoken name: "Code, 6 digits" (or the FormField label, e.g. "Verification code, required").
  const name = ariaLabel ?? field?.accessibilityProps["aria-label"] ?? "Code";
  const spokenName = `${name}, ${length} digits`;
  const hint = accessibilityHint ?? field?.accessibilityProps.accessibilityHint;

  // Announce a new status once. A FormField already announces its own error text.
  const announced = useRef<InputOTPStatus | undefined>(undefined);
  useEffect(() => {
    if (shownStatus && shownStatus !== announced.current && !field?.error) {
      announce(`${name}: ${shownStatus}`);
    }
    announced.current = shownStatus;
  }, [shownStatus, name, field?.error]);

  const activeIndex = focused && !isDisabled ? Math.min(code.length, length - 1) : -1;

  return (
    <View testID={testID} style={[styles.root, isDisabled ? styles.disabled : null, style]}>
      <View
        style={styles.cells}
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
      >
        {Array.from({ length }, (_, i) => {
          const char = code[i];
          const border = shownStatus ?? (i === activeIndex ? "active" : "idle");
          return (
            <View
              key={i}
              testID={testID ? `${testID}-cell-${i}` : undefined}
              style={[styles.cell, styles[border]]}
            >
              {char != null ? <Text variant="h3">{secure ? SECURE_DOT : char}</Text> : null}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={setRefs}
        testID={testID ? `${testID}-input` : undefined}
        value={code}
        onChangeText={handleChangeText}
        editable={!isDisabled}
        keyboardType="number-pad"
        inputMode="numeric"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        secureTextEntry={secure}
        autoCorrect={false}
        spellCheck={false}
        caretHidden
        contextMenuHidden={false}
        selectionColor="transparent"
        underlineColorAndroid="transparent"
        aria-label={spokenName}
        aria-disabled={isDisabled}
        accessibilityHint={hint}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...chain}
        {...props}
        style={styles.input}
      />
    </View>
  );
}
