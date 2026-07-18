import type { ComponentPropsWithoutRef } from "react";

export type SkeletonVariant = "text" | "circular" | "rectangular";

export interface SkeletonProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /** Width — any valid CSS width value (e.g. `'100%'`, `'4rem'`, `120`). */
  width?: string | number;
  /** Height — any valid CSS height value. */
  height?: string | number;
}
