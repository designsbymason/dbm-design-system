import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./FieldLabel.module.css";
import type { FieldLabelProps, FieldLabelSize } from "./FieldLabel.types";

const sizeClass: Record<FieldLabelSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

/**
 * The label for a form field, sized to match the control it labels and
 * with an optional required-indicator asterisk. Composed by `FormField`;
 * also usable standalone for a hand-built field. Pair its `htmlFor` with
 * the control's `id` (or wrap the control as a child) for the native
 * label/control association.
 *
 * @example
 * ```tsx
 * <FieldLabel htmlFor="email">Email address</FieldLabel>
 * <FieldLabel htmlFor="password" required>Password</FieldLabel>
 * ```
 */
export const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(
  (
    { children, size = "md", required = false, disabled = false, className, ...props },
    ref,
  ) => (
    <label
      ref={ref}
      className={cx(
        styles.root,
        sizeClass[size],
        disabled && styles.disabled,
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className={styles.required} aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </label>
  ),
);

FieldLabel.displayName = "FieldLabel";
