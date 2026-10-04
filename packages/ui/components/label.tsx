import type { ReactNode } from "react";

import { Text, type TextProps } from "@/registry/components/text";

export type LabelProps = Omit<TextProps, "variant" | "color"> & {
  /** The label text. */
  children?: ReactNode;
  /** Shows a required marker (*) after the text; screen readers hear "required" instead. */
  required?: boolean;
};

/**
 * A field's visible label: the `label` text Variant, with an optional required marker. Inside a
 * FormField the label is drawn by FormField itself and read as the control's name, so use Label
 * on its own only next to custom controls. `style` is merged last.
 */
export function Label({
  children,
  required = false,
  "aria-label": ariaLabel,
  ...props
}: LabelProps) {
  const name =
    ariaLabel ?? (required && typeof children === "string" ? `${children}, required` : undefined);
  return (
    <Text variant="label" aria-label={name} {...props}>
      {children}
      {required ? (
        <Text variant="label" color="destructive" aria-hidden>
          {" *"}
        </Text>
      ) : null}
    </Text>
  );
}
