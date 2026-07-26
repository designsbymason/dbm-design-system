import type { ComponentPropsWithoutRef } from "react";

export type SkeletonVariant = "text" | "circular" | "rectangular";
export type SkeletonAnimation = "pulse" | "wave" | "none";

export interface SkeletonProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  /**
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /** Width — any valid CSS width value (e.g. `'100%'`, `'4rem'`, `120`). */
  width?: string | number;
  /** Height — any valid CSS height value. */
  height?: string | number;
  /**
   * `'none'` always renders statically — same as the automatic
   * `prefers-reduced-motion` override, but chosen deliberately (e.g. for a
   * dense table where many simultaneous animations would be distracting).
   * @default 'pulse'
   */
  animation?: SkeletonAnimation;
}
