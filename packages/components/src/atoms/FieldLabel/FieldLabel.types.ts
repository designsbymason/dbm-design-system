import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type FieldLabelSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface FieldLabelProps extends ComponentPropsWithoutRef<"label"> {
  /**
   * Font size, matching the size scale of the field control it labels
   * (`Input`, `Textarea`, `Select`, etc.).
   * @default 'md'
   */
  size?: FieldLabelSize;
  /**
   * Shows a decorative required-indicator asterisk after the label text.
   * Purely visual — hidden from assistive tech (`aria-hidden`), since the
   * associated control's own `required`/`aria-required` attribute is what
   * actually conveys that semantics.
   * @default false
   */
  required?: boolean;
  /**
   * Dims the label to match a disabled field control.
   * @default false
   */
  disabled?: boolean;
  children: ReactNode;
}
