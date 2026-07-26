import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./ProgressCircle.module.css";
import type {
  ProgressCircleProps,
  ProgressCircleSize,
  ProgressCircleTone,
} from "./ProgressCircle.types";

const sizeClass: Record<ProgressCircleSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const toneClass: Record<ProgressCircleTone, string | undefined> = {
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A circular progress indicator — `ProgressBar`'s ring-shaped counterpart,
 * sharing its value/max/tone/label API. Determinate when `value` is set (a
 * filled arc reflecting `value`/`max`); indeterminate — a continuously
 * spinning arc — when `value` is omitted. Respects `prefers-reduced-motion`
 * (slows rather than stops the indeterminate animation).
 *
 * @example
 * ```tsx
 * <ProgressCircle value={40} label="Uploading file.zip" showValueLabel />
 * <ProgressCircle tone="success" value={100} />
 * <ProgressCircle label="Loading" />
 * ```
 */
export const ProgressCircle = forwardRef<HTMLDivElement, ProgressCircleProps>(
  (
    {
      value,
      max = 100,
      size = "md",
      tone = "brand",
      label,
      showValueLabel = false,
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
        className={cx(styles.root, sizeClass[size], className)}
        {...props}
      >
        <svg
          className={cx(styles.svg, isIndeterminate && styles.spin)}
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            className={styles.track}
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
          />
          <circle
            className={cx(styles.fill, toneClass[tone])}
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeDasharray={
              isIndeterminate
                ? `${CIRCUMFERENCE * 0.25} ${CIRCUMFERENCE}`
                : CIRCUMFERENCE
            }
            strokeDashoffset={
              isIndeterminate ? 0 : CIRCUMFERENCE * (1 - percentage! / 100)
            }
          />
        </svg>
        {showValueLabel && !isIndeterminate && (
          <span className={styles.valueLabel}>{Math.round(percentage!)}%</span>
        )}
      </div>
    );
  },
);

ProgressCircle.displayName = "ProgressCircle";
