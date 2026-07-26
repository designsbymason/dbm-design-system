import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./ProgressBar.module.css";
import type {
  ProgressBarProps,
  ProgressBarSize,
  ProgressBarTone,
} from "./ProgressBar.types";

const sizeClass: Record<ProgressBarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const toneClass: Record<ProgressBarTone, string | undefined> = {
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

/**
 * A horizontal progress indicator. Determinate when `value` is set (a
 * fixed-width fill reflecting `value`/`max`); indeterminate — an animated
 * sliding fill — when `value` is omitted, for progress that can't be
 * measured yet. Respects `prefers-reduced-motion` (slows rather than
 * stops the indeterminate animation).
 *
 * @example
 * ```tsx
 * <ProgressBar value={40} label="Uploading file.zip" />
 * <ProgressBar tone="success" value={100} />
 * <ProgressBar label="Loading" />
 * ```
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      size = "md",
      tone = "brand",
      label,
      className,
      ...props
    },
    ref,
  ) => {
    const isIndeterminate = value === undefined;
    const clampedValue = isIndeterminate
      ? undefined
      : Math.min(Math.max(value, 0), max);
    const percentage = isIndeterminate
      ? undefined
      : (clampedValue! / max) * 100;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cx(styles.track, sizeClass[size], className)}
        {...props}
      >
        <div
          className={cx(
            styles.fill,
            toneClass[tone],
            isIndeterminate && styles.indeterminate,
          )}
          style={isIndeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";
