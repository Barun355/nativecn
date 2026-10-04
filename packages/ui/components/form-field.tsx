import type { Ref } from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { Label } from "@/registry/components/label";
import {
  FormFieldProvider,
  type FormFieldProps as FormFieldContextProps,
} from "@/registry/components/primitives/form-field-context";
import { Text } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

export type FormFieldProps = FormFieldContextProps &
  Omit<ViewProps, "children" | "style"> & {
    /** Layout only, merged last onto the root. */
    style?: StyleProp<ViewStyle>;
    ref?: Ref<View>;
  };

const useStyles = createStyles((t) => ({
  root: { ...slot("form-field.root", t) },
}));

// The label, description and error are read through the control (its name and hint), so their
// visible copies are hidden from screen readers to avoid reading them twice.
const hiddenFromScreenReaders = {
  "aria-hidden": true,
  importantForAccessibility: "no-hide-descendants",
} as const;

/**
 * Lays out a form control with its Label, description and error, and links them to it: the
 * control inside (Input, Textarea, ...) reads "Email, text field, Enter a valid email". The
 * error replaces the description, sets the `error` status and is announced once when it appears.
 * `status` and `disabled` pass down to the control. `style` is merged last.
 */
export function FormField({
  label,
  description,
  error,
  required = false,
  status,
  disabled = false,
  children,
  style,
  ...props
}: FormFieldProps) {
  const styles = useStyles();
  return (
    <View style={[styles.root, style]} {...props}>
      {label ? (
        <Label required={required} {...hiddenFromScreenReaders}>
          {label}
        </Label>
      ) : null}
      <FormFieldProvider
        label={label}
        description={description}
        error={error}
        required={required}
        status={status}
        disabled={disabled}
      >
        {children}
      </FormFieldProvider>
      {error ? (
        <Text variant="small" color="destructive" {...hiddenFromScreenReaders}>
          {error}
        </Text>
      ) : description ? (
        <Text variant="small" color="mutedForeground" {...hiddenFromScreenReaders}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}
