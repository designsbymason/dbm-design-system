import { createContext, useContext } from "react";
import type { ReactNode, RefObject } from "react";

/**
 * What a `<form>` submits, read from the browser's own `FormData`: one entry per `name`, and an array when a name
 * appears more than once (a set of checkboxes, a multiple select). Values are strings, or `File`s from a file input.
 */
export type FormValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>;

/** Error messages by field `name`. Anything falsy means "valid". */
export type FormErrors = Record<string, ReactNode>;

/**
 * A rule for one field: given the field's submitted value (and all the form's values, for a rule that compares
 * fields), return the message to show, or nothing when the value is fine.
 */
export type FieldValidator = (
  value: FormDataEntryValue | FormDataEntryValue[] | undefined,
  values: FormValues,
) => ReactNode;

/** What a `FormField` tells the `Form` around it about itself. Read at the moment of validation. */
export interface FormFieldRegistration {
  /** The key the field's error is stored under: its `name`, or its control's id when it has none. */
  key: string;
  /** The `name` its value is submitted under, if it has one; a rule needs it to find the value. */
  name: string | undefined;
  /** The DOM id of its control (the one `FormField` hands back as `id`). */
  controlId: string;
  /** Its label, which the error summary shows beside the message. */
  label: ReactNode;
  /** Its own rule, if any. */
  validate: FieldValidator | undefined;
}

/**
 * What a `Form` hands down to the `FormField`s and `Form.*` parts inside it. `null` outside a form, so a
 * `FormField` on its own is unchanged. Lives in `internal/` because a molecule (`FormField`) reads it and may not
 * import from the organism that provides it; it is not part of the public API.
 */
export interface FormContextValue {
  /** Errors to show, by field name: the form's own and the ones passed from outside. */
  errors: FormErrors;
  /** Registers a field's name, control, label and rule; returns the function that takes it out again. */
  registerField: (registration: FormFieldRegistration) => () => void;
  /** The registered field with this key, if there is one. */
  getField: (key: string) => FormFieldRegistration | undefined;
  /** Moves focus to the control of the field with this key, as the summary's links do. */
  focusField: (key: string) => void;
  /** The summary's heading for this many problems, from the form's `labels`. */
  summaryTitle: (count: number) => string;
  /** Whether an `onSubmit` is still running. */
  pending: boolean;
  /** Whether the form is disabled, by its own prop or because it is pending. */
  disabled: boolean;
  /** Where `Form.Summary` puts its element, so a refused submit can move focus to it. */
  summaryRef: RefObject<HTMLElement | null>;
}

const FormContext = createContext<FormContextValue | null>(null);

export const FormProvider = FormContext.Provider;

export function useForm(): FormContextValue | null {
  return useContext(FormContext);
}
