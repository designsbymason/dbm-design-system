import type { Icon as PhosphorIcon } from "@dbm-design-system/icons";
import type { ComponentPropsWithoutRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "destructive";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  /** @default 'primary' */
  variant?: ButtonVariant;
  /** @default 'md' */
  size?: ButtonSize;
  /** Leading icon — a component reference, not a string name. */
  icon?: PhosphorIcon;
  /** Trailing icon — a component reference, not a string name. */
  trailingIcon?: PhosphorIcon;
  /**
   * Shows a spinner in place of the leading icon (or before the label if
   * there is none) and disables interaction while `true`.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Merge props onto the single child element instead of rendering a
   * `<button>` (via Radix `Slot`). Icons and the loading spinner are not
   * rendered in this mode, since `Slot` requires exactly one child.
   * @default false
   */
  asChild?: boolean;
}
