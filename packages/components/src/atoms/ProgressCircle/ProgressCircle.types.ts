import type { ComponentPropsWithoutRef } from "react";

export type ProgressCircleSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ProgressCircleTone =
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface ProgressCircleProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * Current progress. Omit for an indeterminate ring (a continuously
   * spinning arc) when progress can't be measured yet.
   */
  value?: number;
  /** @default 100 */
  max?: number;
  /** @default 'md' */
  size?: ProgressCircleSize;
  /** @default 'brand' */
  tone?: ProgressCircleTone;
  /** Accessible label (e.g. `"Uploading file.zip"`). */
  label?: string;
  /**
   * Shows the rounded percentage as text in the center. Has no effect
   * while indeterminate, since there's no percentage to show.
   * @default false
   */
  showValueLabel?: boolean;
}
