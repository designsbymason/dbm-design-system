import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./FieldHelperText.module.css";
import type { FieldHelperTextProps } from "./FieldHelperText.types";

/**
 * Supplementary helper/hint text for a form field (format hints,
 * character limits, etc.), rendered below the control. Composed by
 * `FormField`; also usable standalone. Pair its `id` with the control's
 * `aria-describedby`.
 *
 * @example
 * ```tsx
 * <FieldHelperText id="password-hint">At least 8 characters</FieldHelperText>
 * ```
 */
export const FieldHelperText = forwardRef<
  HTMLParagraphElement,
  FieldHelperTextProps
>(({ children, disabled = false, className, ...props }, ref) => (
  <p
    ref={ref}
    className={cx(styles.root, disabled && styles.disabled, className)}
    {...props}
  >
    {children}
  </p>
));

FieldHelperText.displayName = "FieldHelperText";
