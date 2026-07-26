import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface FieldErrorProps extends ComponentPropsWithoutRef<"p"> {
  /**
   * Shows a small warning icon before the message.
   * @default true
   */
  icon?: boolean;
  children: ReactNode;
}
