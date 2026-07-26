import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type InputSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface InputProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "prefix" | "size"
> {
  /** Leading slot content — an icon, currency symbol, etc. */
  prefix?: ReactNode;
  /** Trailing slot content. */
  suffix?: ReactNode;
  /**
   * Marks the input as invalid, visually and via `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /** @default 'md' */
  size?: InputSize;
  /**
   * Shows a clear ("×") button after `suffix` whenever the input has a
   * value, calling this when it's clicked. Clearing the value — whether
   * that's your own controlled `value` state or the uncontrolled DOM
   * value — is the caller's responsibility.
   */
  onClear?: () => void;
}
