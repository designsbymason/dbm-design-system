import type { Responsive, SpaceValue } from "@dbm-design-system/primitives";
import type {
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  CSSProperties,
  FocusEventHandler,
  FormEvent,
  FormEventHandler,
  ReactNode,
  Ref,
} from "react";
import type { ButtonProps } from "../../atoms/Button";
import type { FieldLabelSize } from "../../atoms/FieldLabel";
import type { FormController, FormErrors, FormValues } from "../../internal/formContext";

export type {
  FieldValidator,
  FormController,
  FormErrors,
  FormState,
  FormValues,
} from "../../internal/formContext";

/**
 * A rule for the whole form: receives every submitted value and returns the messages to show, by field `name`
 * (a key that matches no field is shown in the summary alone), or nothing when the form is fine. It may return a
 * promise. Use it for a rule that spans fields; a rule about one field is that `FormField`'s own `validate`. It is
 * also run as a field is edited (only that field's message is taken), so keep it cheap.
 */
export type FormValidator = (
  values: FormValues,
) => FormErrors | null | undefined | void | PromiseLike<FormErrors | null | undefined | void>;

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
  /** A required control with nothing in it. */
  valueMissing: string;
  /** A value that is the wrong kind for the control: `type` is `"email"`, `"url"` or another input type. */
  typeMismatch: (type: string) => string;
  /** A value that doesn't match the control's `pattern`. */
  patternMismatch: string;
  /** A value shorter than `minLength`. */
  tooShort: (minimum: number) => string;
  /** A value longer than `maxLength`. */
  tooLong: (maximum: number) => string;
  /** A value below `min`; `minimum` is the attribute as written (a number, a date). */
  rangeUnderflow: (minimum: string) => string;
  /** A value above `max`; `maximum` is the attribute as written. */
  rangeOverflow: (maximum: string) => string;
  /** A number that isn't a multiple of `step`. */
  stepMismatch: string;
  /** Something the control can't read as a value (text in a number field). */
  badInput: string;
  /** What the required-fields legend says beside its asterisk: "Required fields". */
  requiredLegend: string;
  /** What `Form.Error` says when an `onSubmit` promise rejects and no `error` was given. */
  submitFailed: string;
  /** What a field shows when its asynchronous rule couldn't run (it threw or rejected). */
  validationFailed: string;
}

export interface FormProps
  extends Omit<
    ComponentPropsWithoutRef<"form">,
    | "onSubmit"
    | "children"
    | "action"
    | "method"
    | "noValidate"
    | "encType"
    | "target"
    | "autoComplete"
    | "name"
    | "onChange"
    | "onBlur"
    | "onReset"
  > {
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
  /**
   * Called when an `onSubmit` promise rejects. Without it, a rejection is shown by a `Form.Error` when there is
   * one in the form, and otherwise left for the page to report.
   */
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
   * A message about the form as a whole, for a `Form.Error` to show: "We couldn't reach the server". Controlled:
   * clear it from `onSubmit` or `onErrorsChange` when it no longer applies. Without it, `Form.Error` shows
   * `labels.submitFailed` after a rejected `onSubmit`.
   */
  error?: ReactNode;
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
   * Explains the asterisk on a required field's label, as a line above the fields: `true` writes the asterisk and
   * `labels.requiredLegend` ("Required fields"); content of your own is shown as it is, in place of that. Shown only
   * while at least one `FormField` in the form is required, so it never explains a mark that isn't there.
   * @default false
   */
  requiredLegend?: boolean | ReactNode;
  /**
   * Text the form writes itself: the summary's heading and the count it announces, and a message for each way the
   * browser can call a value wrong (`valueMissing`, `typeMismatch`, `tooShort`…), so a page in any language
   * isn't shown the browser's own wording.
   */
  labels?: Partial<FormLabels>;
  /**
   * Writes the counts in `labels` (the summary's heading and the announcement): digits for a script that
   * doesn't use ASCII ones. Callbacks keep plain numbers.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * Hands the form's controls — `submit`, `reset`, `focusField`, `validate`, `setErrors`, `clearErrors` — to code
   * outside it, such as a toolbar button. Inside the form, `useFormController()` returns the same object.
   */
  controllerRef?: Ref<FormController>;
  /** Where the form is sent when it is submitted without an `onSubmit` — a URL, or a function that receives the `FormData`. */
  action?: ComponentPropsWithoutRef<"form">["action"];
  /** How the form is sent without an `onSubmit` (`"get"` or `"post"`). */
  method?: "get" | "post" | "dialog";
  /** How a `post` is encoded: `"multipart/form-data"` when the form has a file input. */
  encType?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  /** Where the response to a native submit is shown: `"_self"` (the default), `"_blank"`, or a frame's name. */
  target?: string;
  /** Lets the browser fill the form's fields in (`"on"`, `"off"`, or an autofill token). */
  autoComplete?: string;
  /** The form's name in `document.forms`. */
  name?: string;
  /**
   * Called when a control inside the form changes, **in addition to** the form's own handling of it (the live check
   * of a field, clearing an outside error). Not called for a change from a form portaled inside this one.
   */
  onChange?: ChangeEventHandler<HTMLFormElement>;
  /**
   * Called when focus leaves a control inside the form, **in addition to** the form's own handling of it (the
   * check of a field when `validateOn` asks for one).
   */
  onBlur?: FocusEventHandler<HTMLFormElement>;
  /**
   * Called when the form is reset, **in addition to** the form's own handling of it (clearing its errors). A
   * control you drive with state is not reset by the browser: clear that state here.
   */
  onReset?: FormEventHandler<HTMLFormElement>;
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

export interface FormErrorProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** Replaces the message: the form's `error`, or `labels.submitFailed`. Shown only while the form has an error. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for the outer element. */
  className?: string;
  /** Inline styles for the outer element. */
  style?: CSSProperties;
  /** Test identifier for automated testing. */
  "data-testid"?: string;
}

export type FormActionsAlign = "start" | "end" | "between";

export interface FormActionsProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
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

/**
 * `Form.Submit` takes every `Button` prop except `type` (always `submit`) and `asChild`. The ones listed here are
 * redeclared, in the order a reader meets them, so the Properties table and the Controls panel read the same way.
 */
export interface FormSubmitProps
  extends Omit<
    ButtonProps,
    | "type"
    | "asChild"
    | "children"
    | "isLoading"
    | "loadingText"
    | "disabled"
    | "variant"
    | "size"
    | "id"
    | "className"
    | "style"
    | "data-testid"
  > {
  /** The button's label. */
  children?: ButtonProps["children"];
  /**
   * Shows the loading state: the spinner, `loadingText` and a disabled button. Follows the form while its
   * `onSubmit` promise is running; set it to take over.
   * @default "follows the form"
   */
  isLoading?: boolean;
  /** Text shown in place of the label while loading. */
  loadingText?: string;
  /**
   * Disables the button. It is also disabled while the form is.
   * @default false
   */
  disabled?: boolean;
  /**
   * The button's style, as on `Button`.
   * @default "primary"
   */
  variant?: ButtonProps["variant"];
  /**
   * The button's size, as on `Button`.
   * @default "md"
   */
  size?: ButtonProps["size"];
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes. */
  className?: string;
  /** Inline styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. */
  "data-testid"?: string;
}
