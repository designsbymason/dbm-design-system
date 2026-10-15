import { forwardRef, useEffect } from "react";
import { useForm } from "../../internal/formContext";
import { Alert } from "../../molecules/Alert";
import { hasMessage } from "./formHelpers";
import type { FormErrorProps } from "./Form.types";

/**
 * A message about the form as a whole, for a failure no field owns: the request didn't reach the server, a
 * permission was refused. It shows the form's `error` prop, or `labels.submitFailed` after an `onSubmit` promise
 * rejects, as a danger `Alert` that is announced when it appears, and shows nothing while there is no error. Its
 * being in the form is also what keeps a rejection from being left for the page to report.
 *
 * @example
 * ```tsx
 * <Form error={serverMessage} onSubmit={save}>
 *   <Form.Error />
 *   …
 * </Form>
 * ```
 */
export const FormError = forwardRef<HTMLDivElement, FormErrorProps>(({ children, className, ...props }, ref) => {
  const form = useForm();
  const registerErrorSlot = form?.registerErrorSlot;
  useEffect(() => registerErrorSlot?.(), [registerErrorSlot]);

  const outsideForm = form === null;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && outsideForm) {
      console.warn("Form.Error: rendered outside a <Form>, so there is no form error to show. Put it inside the form.");
    }
  }, [outsideForm]);
  if (!form || !hasMessage(form.formError)) return null;
  return (
    <div {...props} ref={ref} className={className}>
      <Alert tone="danger">
        <Alert.Description>{children ?? form.formError}</Alert.Description>
      </Alert>
    </div>
  );
});
FormError.displayName = "Form.Error";
