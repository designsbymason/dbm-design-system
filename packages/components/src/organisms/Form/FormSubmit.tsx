import { forwardRef } from "react";
import { Button } from "../../atoms/Button";
import { useForm } from "../../internal/formContext";
import type { FormSubmitProps } from "./Form.types";

/**
 * The form's submit button: a `Button` with `type="submit"` that shows its loading state while the form's
 * `onSubmit` is running or a rule is being waited for, and is disabled while the form is. Takes every other
 * `Button` prop.
 *
 * @example
 * ```tsx
 * <Form.Submit loadingText="Saving…">Save</Form.Submit>
 * ```
 */
export const FormSubmit = forwardRef<HTMLButtonElement, FormSubmitProps>(
  ({ isLoading, disabled, ...props }, ref) => {
    const form = useForm();
    return (
      <Button
        {...props}
        ref={ref}
        type="submit"
        isLoading={isLoading ?? Boolean(form?.pending || form?.validating)}
        disabled={disabled || form?.disabled}
      />
    );
  },
);
FormSubmit.displayName = "Form.Submit";
