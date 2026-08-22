import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Spinner.module.css";
import type { SpinnerProps, SpinnerSize } from "./Spinner.types";
import type { IconTone } from "../Icon";

const sizeClass: Record<SpinnerSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const toneClass: Record<IconTone, string | undefined> = {
  default: styles.toneDefault,
  secondary: styles.toneSecondary,
  brand: styles.toneBrand,
  disabled: styles.toneDisabled,
  "on-brand": styles.toneOnBrand,
  "on-danger": styles.toneOnDanger,
  "on-warning": styles.toneOnWarning,
  "on-success": styles.toneOnSuccess,
  "on-info": styles.toneOnInfo,
  "on-neutral": styles.toneOnNeutral,
};

/**
 * An indeterminate loading indicator — a rotating ring at a token-driven
 * size. Decorative by default (hidden from the accessibility tree); pass
 * `label` to announce the loading state via `role="status"`. Respects
 * `prefers-reduced-motion` (slows rather than stops, since a fully static
 * spinner reads as frozen, not as respecting the preference).
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" tone="brand" label="Loading" />
 * ```
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size = "md", tone, label, className, ...props }, ref) => (
    <span
      ref={ref}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx(
        styles.root,
        sizeClass[size],
        tone && toneClass[tone],
        className,
      )}
      {...props}
    />
  ),
);

Spinner.displayName = "Spinner";
