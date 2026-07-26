import { WarningCircleIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import { Icon } from "../Icon";
import styles from "./FieldError.module.css";
import type { FieldErrorProps } from "./FieldError.types";

/**
 * Validation error text for a form field, announced to assistive tech via
 * `role="alert"` as soon as it mounts. Composed by `FormField`; also usable
 * standalone. Pair its `id` with the control's `aria-describedby` for the
 * association screen readers rely on.
 *
 * @example
 * ```tsx
 * <FieldError id="email-error">Enter a valid email address</FieldError>
 * <FieldError icon={false}>Passwords must match</FieldError>
 * ```
 */
export const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ icon = true, className, children, ...props }, ref) => (
    <p ref={ref} role="alert" className={cx(styles.root, className)} {...props}>
      {icon && <Icon icon={WarningCircleIcon} size="xs" className={styles.icon} />}
      {children}
    </p>
  ),
);

FieldError.displayName = "FieldError";
