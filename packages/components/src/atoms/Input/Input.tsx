import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Input.module.css";
import type { InputProps, InputSize } from "./Input.types";

const sizeClass: Record<InputSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/**
 * A text input with optional leading/trailing slots (icons, currency
 * symbols, unit labels) and an error state. `ref` forwards to the native
 * `<input>` element, not the wrapper, so `.focus()`/`.value` work as
 * expected; `className` applies to the wrapper (the visual input box).
 *
 * @example
 * ```tsx
 * <Input placeholder="Search" prefix={<Icon icon={MagnifyingGlassIcon} />} />
 * <Input hasError suffix="@example.com" />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ prefix, suffix, hasError = false, size = "md", className, disabled, ...props }, ref) => (
    <span
      className={cx(
        styles.wrapper,
        sizeClass[size],
        hasError && styles.error,
        disabled && styles.disabled,
        className,
      )}
    >
      {prefix && <span className={styles.affix}>{prefix}</span>}
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        className={styles.input}
        {...props}
      />
      {suffix && <span className={styles.affix}>{suffix}</span>}
    </span>
  ),
);

Input.displayName = "Input";
