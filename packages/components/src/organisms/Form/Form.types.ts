import type { Responsive, SpaceValue } from "@dbm-design-system/primitives";
import type { ComponentPropsWithoutRef, CSSProperties, FormEvent, ReactNode } from "react";
import type { ButtonProps } from "../../atoms/Button";
import type { FieldLabelSize } from "../../atoms/FieldLabel";
import type { FormErrors, FormValues } from "../../internal/formContext";

export type { FieldValidator, FormErrors, FormValues } from "../../internal/formContext";

/**
 * A rule for the whole form: receives every submitted value and returns the messages to show, by field `name`
 * (a key that matches no field is shown in the summary alone), or nothing when the form is fine. Use it for a rule
 * that spans fields; a rule about one field is that `FormField`'s own `validate`.
 */
export type FormValidator = (values: FormValues) => FormErrors | null | undefined | void;

/**
 * When a field's error is worked out as it is edited, before any submit has been refused. `"submit"` (the
 * default) waits for the first submit; `"blur"` checks a field when focus leaves it; `"change"` checks it on every
 * edit. Whatever this is, once a submit has been refused each field is checked again as it is edited, so an error
 * clears the moment the value is right.
 */
export type FormValidateOn = "submit" | "blur" | "change";

/**
 * Where focus goes when a submit is refused. `"field"` (the default) is the first invalid control, in page order.
 * `"summary"` is the `Form.Summary`, when there is one (a list of links to every problem), falling back to the field.
 */
export type FormFocusTarget = "field" | "summary";

/**
 * Text the form writes itself. Every key is a function of the plain count, and a string with the number in it
 * should write it with the same `formatNumber` the form is given (`05-component-api-conventions.md` §3).
 */
export interface FormLabels {
  /** The summary's heading: "There are 3 problems with this form". */
  summaryTitle: (count: number) => string;
  /** What a screen reader hears when a submit is refused, ahead of the focused field's own name. */
  errorCount: (count: number) => string;
  /** The message for a control the browser calls invalid but gives no message of its own for. */
  invalidValue: string;
}

export interface FormProps
  extends Omit<ComponentPropsWithoutRef<"form">, "onSubmit" | "children" | "action" | "method" | "noValidate"> {
  /** The form's content: fields, groups, a `Form.Summary`, `Form.Actions`. */
  children?: ReactNode;
  /**
   * Called when the form is submitted **and valid**, with what the form holds. May return a promise: the form is
   * then busy (`aria-busy`, disabled, its `Form.Submit` loading) until it settles, and a second submit is ignored
   * meanwhile. A rejection goes to `onSubmitError`. Without `onSubmit`, a valid submit is left to the browser (or
   * to `action`), so a plain form with `action` still works.
   *
   * @param values What the form submits, by field `name`: a string, or an array when a name repeats.
   * @param formData The same entries as the browser's own `FormData`, for a request body.
   * @param event The submit event, already stopped from reloading the page.
   */
  onSubmit?: (values: FormValues, formData: FormData, event: FormEvent<HTMLFormElement>) => void | Promise<unknown>;
  /** Called when an `onSubmit` promise rejects. Without it, the rejection is left for the page to report. */
  onSubmitError?: (error: unknown) => void;
  /** Called when a submit is refused because of errors, with every error found, by field name. */
  onInvalidSubmit?: (errors: FormErrors) => void;
  /**
   * A rule for the whole form, run on submit after each field's own: see {@link FormValidator}. A message for a
   * field that already has one keeps the field's own.
   */
  validate?: FormValidator;
  /**
   * Errors set from outside, by field `name`: a server's answer to a submit ("that email is taken"). Shown beside
   * the form's own, and winning over them for the same field. They stay until `onErrorsChange` is answered, so
   * pass the state back in: when the person edits a field that has one, `onErrorsChange` is called with the object
   * to use instead, without that field.
   */
  errors?: FormErrors;
  /** Called with the `errors` to use instead, when an edit makes one of them out of date, or on reset. */
  onErrorsChange?: (errors: FormErrors) => void;
  /**
   * When a field is checked as it is edited, before any submit has been refused — see {@link FormValidateOn}.
   * @default "submit"
   */
  validateOn?: FormValidateOn;
  /**
   * Moves focus to the first invalid control (or the summary) when a submit is refused — see {@link FormFocusTarget}.
   * `false` leaves focus where it is.
   * @default "field"
   */
  focusTarget?: FormFocusTarget | false;
  /**
   * Disables the whole form: every `FormField` inside is disabled, and a submit does nothing. A form is also
   * disabled, without this, while an `onSubmit` promise is running.
   * @default false
   */
  disabled?: boolean;
  /**
   * The size handed to every `FormField` inside as its default (its label, and the control it hands its size to),
   * as a `FieldGroup`'s `size` is. A field's or group's own size wins.
   */
  size?: FieldLabelSize;
  /**
   * The space between the form's children, as a step on the spacing scale — a single value or a breakpoint map.
   * @default 4
   */
  gap?: Responsive<SpaceValue>;
  /**
   * Whether the browser's own validation bubbles and `:invalid` styling are held back so `Form` can show the
   * errors in the page, in its own words. The browser's rules (`required`, `type="email"`, `pattern`,
   * `minLength`…) still apply: `Form` reads them and shows each message in the field's own error slot.
   * @default true
   */
  noValidate?: boolean;
  /**
   * Text the form writes itself.
   */
  labels?: Partial<FormLabels>;
  /**
   * Writes the counts in `labels` (the summary's heading and the announcement): digits for a script that
   * doesn't use ASCII ones. Callbacks keep plain numbers.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /** Where the form is sent when it is submitted without an `onSubmit` — a URL, or a function that receives the `FormData`. */
  action?: ComponentPropsWithoutRef<"form">["action"];
  /** How the form is sent without an `onSubmit` (`"get"` or `"post"`). */
  method?: "get" | "post" | "dialog";
  /** Lets the browser fill the form's fields in (`"on"`, `"off"`, or an autofill token). */
  autoComplete?: string;
  /** The form's name in `document.forms`. */
  name?: string;
  /** The form's accessible name; a form is only a landmark once it has one. */
  "aria-label"?: string;
  /** Points at an element that names the form (a heading). */
  "aria-labelledby"?: string;
  /** Points at an element that describes the form. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for the form. */
  className?: string;
  /** Inline styles for the form. */
  style?: CSSProperties;
  /** Test identifier for automated testing. */
  "data-testid"?: string;
}

export interface FormSummaryProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "title"> {
  /** The summary's heading, in place of the count sentence from the form's `labels`. */
  title?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for the summary's outer element. */
  className?: string;
  /** Inline styles for the summary's outer element. */
  style?: CSSProperties;
  /** Test identifier for automated testing. */
  "data-testid"?: string;
}

export type FormActionsAlign = "start" | "end" | "between";

export interface FormActionsProps extends ComponentPropsWithoutRef<"div"> {
  /** The buttons. */
  children?: ReactNode;
  /**
   * Where the buttons sit along the row: at the start, at the end, or the first at one end and the rest at the other.
   * @default "start"
   */
  align?: FormActionsAlign;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes. */
  className?: string;
  /** Inline styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. */
  "data-testid"?: string;
}

/** `Form.Submit` takes every `Button` prop except `type` (always `submit`) and `asChild`. */
export type FormSubmitProps = Omit<ButtonProps, "type" | "asChild">;
