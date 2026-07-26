import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Skeleton.module.css";
import type {
  SkeletonAnimation,
  SkeletonProps,
  SkeletonVariant,
} from "./Skeleton.types";

const variantClass: Record<SkeletonVariant, string | undefined> = {
  text: styles.variantText,
  circular: styles.variantCircular,
  rectangular: styles.variantRectangular,
};

const animationClass: Record<SkeletonAnimation, string | undefined> = {
  pulse: styles.animationPulse,
  wave: styles.animationWave,
  none: undefined,
};

/**
 * A placeholder shape shown while real content is loading, with a `pulse`
 * (default) or `wave` animation. Purely decorative (hidden from the
 * accessibility tree) — pair with a live region elsewhere in the loading UI
 * if you need to announce loading state to assistive tech. Respects
 * `prefers-reduced-motion`.
 *
 * @example
 * ```tsx
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="text" width="80%" />
 * <Skeleton variant="rectangular" animation="wave" />
 * ```
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = "text",
      animation = "pulse",
      width,
      height,
      className,
      style,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cx(
        styles.root,
        variantClass[variant],
        animationClass[animation],
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  ),
);

Skeleton.displayName = "Skeleton";
