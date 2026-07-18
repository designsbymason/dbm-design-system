import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type InputSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "prefix" | "size"> {
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
}
