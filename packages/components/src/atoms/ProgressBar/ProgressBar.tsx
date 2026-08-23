import { cx } from "@dbm-design-system/primitives";
import { forwardRef, useRef } from "react";
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
 * <ProgressBar value={40} label="Uploading file.zip" showValueLabel />
 * <ProgressBar
 *   value={3}
 *   max={5}
 *   label="Uploading files"
 *   aria-valuetext="3 of 5 files uploaded"
 *   showValueLabel
 *   formatValueLabel={(value, max) => `${value} of ${max} files`}
 * />
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
    // component's own default rather than producing `Infinity`/`NaN` in
    // the rendered `width` (found in review: `max={0}` silently produced
    // `style={{ width: "Infinity%" }}`, an invalid CSS value the browser
    // drops with no signal anything was wrong).
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
          'ProgressBar: neither `label` nor `aria-labelledby` was provided — the progress bar has no visible text of its own, so it has no accessible name at all. Pass `label` (e.g. `label="Uploading file.zip"`) or `aria-labelledby`.',
        );
      }
      if (!isMaxValid && !hasWarnedInvalidMaxRef.current) {
        hasWarnedInvalidMaxRef.current = true;
        console.warn(
          `ProgressBar: \`max\` must be greater than 0 (received ${max}) — falling back to the default of 100.`,
        );
      }
      if (
        formatValueLabel &&
        !showValueLabel &&
        !hasWarnedUnusedFormatRef.current
      ) {
        hasWarnedUnusedFormatRef.current = true;
        console.warn(
          "ProgressBar: `formatValueLabel` was provided without `showValueLabel` — the value label isn't rendered, so the formatter is never called. Pass `showValueLabel`, or remove `formatValueLabel`.",
        );
      }
    }

    return (
      <div className={styles.root}>
        <div
          ref={ref}
          {...props}
          // These four are always applied last (after `...props`) so they
          // can never be silently overridden by a same-named prop the
          // caller passes — including `role`/`aria-valuenow`/etc., which
          // TypeScript's JSX checker permits on any component regardless
          // of whether they're declared in its prop type (a real gap
          // found and fixed during review: the `Omit` in ProgressBar.types
          // stops normal props like `role` from typechecking, but not
          // `aria-*`/`data-*` names — TS special-cases those as always
          // assignable — so this ordering is the actual, load-bearing fix,
          // not the `Omit` alone).
          role="progressbar"
          aria-label={label}
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          className={cx(styles.track, sizeClass[size], className)}
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

ProgressBar.displayName = "ProgressBar";
