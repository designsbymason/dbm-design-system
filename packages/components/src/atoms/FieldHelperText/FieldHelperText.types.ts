import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface FieldHelperTextProps extends ComponentPropsWithoutRef<"p"> {
  /**
   * Dims the text to match a disabled field control.
   * @default false
   */
  disabled?: boolean;
  children: ReactNode;
}
