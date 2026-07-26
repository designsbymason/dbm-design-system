import type { ComponentPropsWithoutRef } from "react";

export type ProgressBarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ProgressBarTone =
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface ProgressBarProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * Current progress. Omit for an indeterminate bar (an animated sliding
   * fill) when progress can't be measured yet.
   */
  value?: number;
  /** @default 100 */
  max?: number;
  /** @default 'md' */
  size?: ProgressBarSize;
  /** @default 'brand' */
  tone?: ProgressBarTone;
  /** Accessible label (e.g. `"Uploading file.zip"`). */
  label?: string;
}
