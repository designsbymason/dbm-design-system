import { cx } from "@dbm-design-system/primitives";
import { forwardRef } from "react";
import styles from "./Form.module.css";
import type { FormActionsProps } from "./Form.types";

/**
 * A row for the form's buttons: they wrap when they don't fit and take a row each on a phone. Pair it with
 * `Form.Submit`.
 *
 * @example
 * ```tsx
 * <Form.Actions align="end">
 *   <Button variant="ghost" type="reset">Reset</Button>
 *   <Form.Submit>Save</Form.Submit>
 * </Form.Actions>
 * ```
 */
export const FormActions = forwardRef<HTMLDivElement, FormActionsProps>(
  ({ align = "start", className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cx(
        styles.actions,
        align === "end" && styles.alignEnd,
        align === "between" && styles.alignBetween,
        className,
      )}
    />
  ),
);
FormActions.displayName = "Form.Actions";
