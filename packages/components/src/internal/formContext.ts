import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * What a `<form>` submits, read from the browser's own `FormData`: one entry per `name`, and an array when a name
 * appears more than once (a set of checkboxes, a multiple select). Values are strings, or `File`s from a file input.
 */
export type FormValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>;

/** Error messages by field `name`. Anything falsy means "valid". */
export type FormErrors = Record<string, ReactNode>;

/**
 * A rule for one field: given the field's submitted value (and all the form's values, for a rule that compares
 * fields), return the message to show, or nothing when the value is fine. It may return a promise (a check that
 * asks the server): the form waits for it on submit, and applies the answer of the latest check as the field is
 * edited.
 */
export type FieldValidator = (
  value: FormDataEntryValue | FormDataEntryValue[] | undefined,
  values: FormValues,
) => ReactNode | PromiseLike<ReactNode>;

/**
 * The form's controls from outside it: what a toolbar button, a keyboard shortcut or a parent component needs
 * that a prop can't say. Stable for the form's life, so it is safe in a dependency list. Every method does
 * nothing until the form has mounted.
 */
export interface FormController {
  /** The `<form>` element, or `null` before it has mounted. */
  readonly form: HTMLFormElement | null;
  /** Submits as a click on a submit button does: the checks run and `onSubmit` is called when they pass. */
  submit: () => void;
  /** Resets the controls to their initial values, and clears the form's own errors. */
  reset: () => void;
  /** Moves focus to the control of the field with this `name`. */
  focusField: (name: string) => void;
  /**
   * Runs every rule as a submit would, shows the errors and focuses the first, without calling `onSubmit`.
   * Resolves to whether the form is valid.
   */
  validate: () => Promise<boolean>;
  /** Shows these errors, by field `name`, beside any the form has found; they are replaced by the next check of a field. */
  setErrors: (errors: FormErrors) => void;
  /** Takes away every error the form itself has found (errors passed in as `errors` stay until the caller changes them). */
  clearErrors: () => void;
}

/** What the form is doing and what it has found, for a part of your own that needs to show it. */
export interface FormState {
  /** Whether an `onSubmit` promise is still running. */
  pending: boolean;
  /** Whether a submit is waiting for an asynchronous rule. */
  validating: boolean;
  /** Whether the form is disabled, by its own prop or because it is pending. */
  disabled: boolean;
  /** The errors showing, by field name. */
  errors: FormErrors;
  /** Whether the last submit's `onSubmit` rejected. */
  submitFailed: boolean;
}

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
  /** Whether the field is marked required, which is what a form's required-fields legend is shown for. */
  required: boolean;
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
  /** Whether a submit is waiting for an asynchronous rule. */
  validating: boolean;
  /** Keys whose asynchronous rule is running now, for the field to say so. */
  validatingKeys: ReadonlySet<string>;
  /** Whether the form is disabled, by its own prop or because it is pending. */
  disabled: boolean;
  /** Whether the last submit's `onSubmit` rejected. */
  submitFailed: boolean;
  /** The form-level message: the `error` prop, or the fallback after a rejected `onSubmit`. `null` when none. */
  formError: ReactNode;
  /** Tells the form a `Form.Error` is mounted, so a rejection is shown there rather than left unhandled. */
  registerErrorSlot: () => () => void;
  /** The controls from outside, the same object `controllerRef` gets. */
  controller: FormController;
  /** How `Form.Summary` hands the form its element, so a refused submit can move focus to it. */
  setSummaryElement: (element: HTMLElement | null) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export const FormProvider = FormContext.Provider;

export function useForm(): FormContextValue | null {
  return useContext(FormContext);
}
