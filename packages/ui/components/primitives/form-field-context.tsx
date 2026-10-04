import { createContext, use, useEffect, useMemo, useRef, type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";

export type FormFieldStatus = "error" | "success";

export type FormFieldProps = {
  /** Visible label text. Also becomes the control's accessible name. */
  label?: string;
  /** Helper text read after the name when there is no error. */
  description?: string;
  /** Error message. Read as the control's description and announced once when it appears. */
  error?: string;
  /** Defaults to `"error"` while `error` is set. The screen sets and clears it. */
  status?: FormFieldStatus;
  disabled?: boolean;
  /** Adds "required" to the spoken name. */
  required?: boolean;
  children?: ReactNode;
};

/**
 * Accessibility props for the field's control. iOS has no `aria-labelledby`, so the label
 * text is copied into `aria-label`; the error (or description) becomes the hint. Together with
 * the control's own role this reads "Email, text field, Enter a valid email".
 */
export type FormFieldAccessibilityProps = {
  "aria-label"?: string;
  "aria-disabled"?: boolean;
  accessibilityHint?: string;
};

export type FormFieldState = {
  label?: string;
  description?: string;
  error?: string;
  status?: FormFieldStatus;
  disabled: boolean;
  required: boolean;
  accessibilityProps: FormFieldAccessibilityProps;
};

export const FormFieldContext = createContext<FormFieldState | null>(null);

// TODO(#46): switch to the shared announce() helper once it lands.
function announce(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Behaviour-only provider behind FormField: passes the label, description, error, status,
 * disabled and required down to the control inside it. Renders no views.
 */
export function FormFieldProvider({
  label,
  description,
  error,
  status,
  disabled = false,
  required = false,
  children,
}: FormFieldProps) {
  const lastAnnounced = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Announce once when an error appears (or its text changes), never on unrelated re-renders.
    if (error && error !== lastAnnounced.current) announce(error);
    lastAnnounced.current = error || undefined;
  }, [error]);

  const value = useMemo<FormFieldState>(() => {
    const name = label ? (required ? `${label}, required` : label) : undefined;
    const hint = error || description || undefined;
    return {
      label,
      description,
      error: error || undefined,
      status: status ?? (error ? "error" : undefined),
      disabled,
      required,
      accessibilityProps: {
        ...(name !== undefined && { "aria-label": name }),
        ...(hint !== undefined && { accessibilityHint: hint }),
        ...(disabled && { "aria-disabled": true }),
      },
    };
  }, [label, description, error, status, disabled, required]);

  return <FormFieldContext value={value}>{children}</FormFieldContext>;
}

/** The enclosing FormField's state, or `null` when the control is used on its own. */
export function useFormField(): FormFieldState | null {
  return use(FormFieldContext);
}
