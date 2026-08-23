import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useRef } from "react";
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
 * <ProgressCircle
 *   value={3}
 *   max={5}
 *   label="Uploading files"
 *   aria-valuetext="3 of 5 files uploaded"
 *   showValueLabel
 *   formatValueLabel={(value, max) => `${value}/${max}`}
 * />
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
      formatValueLabel,
      className,
      ...props
    },
    ref,
  ) => {
    const isIndeterminate = value === undefined;
    // `max` must be positive for the percentage math below to mean
    // anything — an invalid value (0, negative, or NaN) falls back to the
    // component's own default rather than producing `NaN` in the rendered
    // `strokeDashoffset` (found in review, reproducing ProgressBar's own
    // equivalent bug: `max={0}` produced strokeDashoffset="NaN", which
    // React itself flags with a real console warning).
    const isMaxValid = max > 0;
    const safeMax = isMaxValid ? max : 100;
    const clampedValue = isIndeterminate
      ? undefined
      : Math.min(Math.max(value, 0), safeMax);
    const percentage = isIndeterminate
      ? undefined
      : (clampedValue! / safeMax) * 100;

    const hasWarnedNoAccessibleNameRef = useRef(false);
    const hasWarnedInvalidMaxRef = useRef(false);
    const hasWarnedUnusedFormatRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (
        !label &&
        !props["aria-labelledby"] &&
        !hasWarnedNoAccessibleNameRef.current
      ) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          'ProgressCircle: neither `label` nor `aria-labelledby` was provided — the ring has no visible text of its own, so it has no accessible name at all. Pass `label` (e.g. `label="Uploading file.zip"`) or `aria-labelledby`.',
        );
      }
      if (!isMaxValid && !hasWarnedInvalidMaxRef.current) {
        hasWarnedInvalidMaxRef.current = true;
        console.warn(
          `ProgressCircle: \`max\` must be greater than 0 (received ${max}) — falling back to the default of 100.`,
        );
      }
      if (
        formatValueLabel &&
        !showValueLabel &&
        !hasWarnedUnusedFormatRef.current
      ) {
        hasWarnedUnusedFormatRef.current = true;
        console.warn(
          "ProgressCircle: `formatValueLabel` was provided without `showValueLabel` — the value label isn't rendered, so the formatter is never called. Pass `showValueLabel`, or remove `formatValueLabel`.",
        );
      }
    }

    return (
      <div
        ref={ref}
        {...props}
        // These four are always applied last (after `...props`) so they
        // can never be silently overridden by a same-named prop the
        // caller passes — including `role`/`aria-valuenow`/etc., which
        // TypeScript's JSX checker permits on any component regardless
        // of whether they're declared in its prop type (the `Omit` in
        // ProgressCircle.types stops normal props like `role` from
        // typechecking, but not `aria-*`/`data-*` names — TS special-
        // cases those as always assignable — so this ordering is the
        // actual, load-bearing fix, not the `Omit` alone; see
        // ProgressBar.tsx, where this was first found and fixed).
        role="progressbar"
        aria-label={label}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        className={cx(styles.root, sizeClass[size], className)}
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
          <span className={styles.valueLabel}>
            {formatValueLabel
              ? formatValueLabel(clampedValue!, safeMax)
              : `${Math.round(percentage!)}%`}
          </span>
        )}
      </div>
    );
  },
);

ProgressCircle.displayName = "ProgressCircle";
