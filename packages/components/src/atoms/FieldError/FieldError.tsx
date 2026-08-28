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
 * <FieldError disabled>Enter a valid email address</FieldError>
 * <FieldError icon={CircleIcon}>Custom glyph</FieldError>
 * ```
 */
export const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ children, icon = true, disabled = false, className, ...props }, ref) => {
    const iconComponent = icon === false ? null : icon === true ? WarningCircleIcon : icon;

    return (
      // `{...props}` is spread before the computed `role`/`className` so a
      // same-named prop a consumer passes can never silently override them —
      // the JSX-attribute-ordering bug already found and fixed on Skeleton/
      // ProgressBar/ProgressCircle/Spinner/Button/IconButton/Checkbox
      // (05-component-api-conventions.md §3). `role="alert"` is this
      // component's entire reason for existing (the screen-reader
      // announcement), so this one matters more than most.
      <p
        ref={ref}
        {...props}
        role="alert"
        className={cx(styles.root, disabled && styles.disabled, className)}
      >
        {iconComponent && <Icon icon={iconComponent} size="xs" className={styles.icon} />}
        {children}
      </p>
    );
  },
);

FieldError.displayName = "FieldError";
