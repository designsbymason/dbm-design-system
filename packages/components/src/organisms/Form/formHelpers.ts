import type { ReactNode } from "react";
import type { FormErrors, FormValues } from "../../internal/formContext";
import type { FormLabels } from "./Form.types";

export const makeDefaultLabels = (formatNumber: (value: number) => string): FormLabels => {
  const shown = (value: string) =>
    value !== "" && !Number.isNaN(Number(value)) ? formatNumber(Number(value)) : value;
  return {
    summaryTitle: (count) =>
      count === 1 ? "There is 1 problem with this form" : `There are ${formatNumber(count)} problems with this form`,
    errorCount: (count) => (count === 1 ? "1 error." : `${formatNumber(count)} errors.`),
    invalidValue: "This value is not valid.",
    requiredLegend: "Required fields",
    valueMissing: "Fill out this field.",
    typeMismatch: (type) =>
      type === "email" ? "Enter an email address." : type === "url" ? "Enter a web address." : "Use the right format for this field.",
    patternMismatch: "Use the format that was asked for.",
    tooShort: (minimum) =>
      minimum === 1 ? "Use at least 1 character." : `Use at least ${formatNumber(minimum)} characters.`,
    tooLong: (maximum) =>
      maximum === 1 ? "Use 1 character or fewer." : `Use ${formatNumber(maximum)} characters or fewer.`,
    rangeUnderflow: (minimum) => `Choose ${shown(minimum)} or more.`,
    rangeOverflow: (maximum) => `Choose ${shown(maximum)} or less.`,
    stepMismatch: "Choose one of the values that is allowed.",
    badInput: "Enter a value this field can read.",
    submitFailed: "Something went wrong, so nothing was sent. Try again.",
    validationFailed: "This couldn't be checked. Try again.",
  };
};

// What a person can put focus on: the control itself, or the first of them inside a container (a radio group's
// `div` is the control's id, and the thing to focus is the radio in it).
const FOCUSABLE =
  'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function focusWithin(element: Element) {
  const target = element.matches(FOCUSABLE) ? element : element.querySelector(FOCUSABLE);
  if (target instanceof HTMLElement) target.focus();
}

// What a browser calls a form control that takes part in constraint validation.
export type ConstraintControl = Element & {
  name: string;
  validity: ValidityState;
  validationMessage: string;
  willValidate: boolean;
};

export function isConstraintControl(element: Element): element is ConstraintControl {
  return "validity" in element && "willValidate" in element;
}

export function readValues(formData: FormData): FormValues {
  const values: FormValues = {};
  for (const [key, value] of formData.entries()) {
    const existing = values[key];
    if (existing === undefined) values[key] = value;
    else values[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
  }
  return values;
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as PromiseLike<unknown>).then === "function";
}

export function hasKeys(errors: FormErrors) {
  return Object.keys(errors).length > 0;
}

export function hasMessage(message: ReactNode) {
  return message !== null && message !== undefined && message !== false && message !== "";
}

/**
 * Whether an event came from this form's own controls. React sends an event from a portaled child (a dialog with a
 * form of its own, rendered inside this one) up to this form's handlers through the React tree, though its DOM is
 * elsewhere, so a handler that acts on anything it hears would validate or submit the wrong form.
 */
export function belongsTo(form: HTMLFormElement, target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  const owner = "form" in target ? (target as { form: HTMLFormElement | null }).form : null;
  return (owner ?? target.closest("form")) === form;
}

// The message for a control the browser calls invalid, in the page's words for the way it is wrong. A message the
// control wrote itself (a custom validity) is the control's own and is kept as it is.
export function messageFor(element: ConstraintControl, labels: FormLabels): string {
  const validity = element.validity;
  const input = element as unknown as HTMLInputElement;
  if (validity.customError && element.validationMessage) return element.validationMessage;
  if (validity.valueMissing) return labels.valueMissing;
  if (validity.typeMismatch) return labels.typeMismatch(input.type || "text");
  if (validity.patternMismatch) return labels.patternMismatch;
  if (validity.tooShort) return labels.tooShort(input.minLength);
  if (validity.tooLong) return labels.tooLong(input.maxLength);
  if (validity.rangeUnderflow) return labels.rangeUnderflow(input.min);
  if (validity.rangeOverflow) return labels.rangeOverflow(input.max);
  if (validity.stepMismatch) return labels.stepMismatch;
  if (validity.badInput) return labels.badInput;
  return element.validationMessage || labels.invalidValue;
}
