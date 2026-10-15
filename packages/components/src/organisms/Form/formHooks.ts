import { useEffect, useMemo } from "react";
import {
  useForm,
  type FormController,
  type FormState,
} from "../../internal/formContext";

const INERT_CONTROLLER: FormController = {
  form: null,
  submit: () => undefined,
  reset: () => undefined,
  focusField: () => undefined,
  validate: () => Promise.resolve(true),
  setErrors: () => undefined,
  clearErrors: () => undefined,
};

/**
 * The form's controls, from a part of your own inside it: `submit()`, `reset()`, `validate()`, `focusField(name)`,
 * `setErrors()` and `clearErrors()`. One object for the form's life. Outside a `Form` it does nothing, with a
 * development warning.
 *
 * @example
 * ```tsx
 * function SaveShortcut() {
 *   const form = useFormController();
 *   useHotkey("mod+s", () => form.submit());
 *   return null;
 * }
 * ```
 */
export function useFormController(): FormController {
  const form = useForm();
  const outsideForm = form === null;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && outsideForm) {
      console.warn("useFormController: called outside a <Form>, so it controls nothing. Call it from a component rendered inside the form.");
    }
  }, [outsideForm]);
  return form?.controller ?? INERT_CONTROLLER;
}

const IDLE_STATE: FormState = { pending: false, validating: false, disabled: false, errors: {}, submitFailed: false };

/**
 * What the form is doing and what it has found — `pending`, `validating`, `disabled`, `errors`, `submitFailed` — for
 * a part of your own that shows it (a "Saving…" label, a count in a tab). Outside a `Form` it reports an idle,
 * error-free form.
 *
 * @example
 * ```tsx
 * function ErrorCount() {
 *   const { errors } = useFormState();
 *   return <Badge tone="danger">{Object.keys(errors).length}</Badge>;
 * }
 * ```
 */
export function useFormState(): FormState {
  const form = useForm();
  return useMemo(
    () =>
      form
        ? {
            pending: form.pending,
            validating: form.validating,
            disabled: form.disabled,
            errors: form.errors,
            submitFailed: form.submitFailed,
          }
        : IDLE_STATE,
    [form],
  );
}
