import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { FieldLabelSize } from "../../atoms/FieldLabel";

/**
 * The props `FormField` computes and hands to its `children` render
 * function — spread these directly onto whatever control is being
 * labeled (`Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Select`, etc.).
 * Every field-control atom in this system already accepts this exact
 * shape (`id`, `aria-labelledby`, `aria-describedby`, `hasError`,
 * `disabled`, `required`), so no atom needs any change to work inside a
 * `FormField` — spreading this object is the entire integration.
 */
export interface FormFieldControlProps {
  /** The control's own DOM id — pair a `FieldLabel`'s `htmlFor` with this too, when the control is a natively labelable element, for the native click-label-to-focus behavior on top of `aria-labelledby` below. */
  id: string;
  /** Points at the field's own label, so the control has a correct accessible name regardless of whether it's a natively labelable element (an `Input`) or a container role (`RadioGroup`'s `role="radiogroup"`, `CheckboxGroup`'s `role="group"`). */
  "aria-labelledby": string;
  /** Points at the rendered helper text and/or error message, when either is present — omitted entirely when neither is. */
  "aria-describedby"?: string;
  /** Whether `FormField`'s own `error` is set. */
  hasError: boolean;
  /** Mirrors `FormField`'s own `disabled`. */
  disabled: boolean;
  /** Mirrors `FormField`'s own `required`. */
  required: boolean;
}

export interface FormFieldProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "id"> {
  /**
   * The field's visible label text, rendered via `FieldLabel`.
   */
  label: ReactNode;
  /**
   * Renders the control, receiving the computed `FormFieldControlProps` to
   * spread directly onto it — e.g.
   * `(fieldProps) => <Input {...fieldProps} />`. `FormField` never renders
   * the control itself; it only computes the ids/state a real field
   * control needs and hands them back, so any control atom works here with
   * zero changes on its own part.
   */
  children: (fieldProps: FormFieldControlProps) => ReactNode;
  /**
   * Supplementary helper/hint text, rendered via `FieldHelperText` below
   * the control. Hidden while `error` is set — the error message replaces
   * it rather than showing both at once, matching the common "one message
   * at a time" convention common to form components, so the field doesn't
   * show two stacked, only-sometimes-relevant lines of text.
   */
  helperText?: ReactNode;
  /**
   * The validation error message, rendered via `FieldError` in place of
   * `helperText` when set. Its mere presence is what marks the field
   * invalid — there's no separate `hasError` boolean; an empty/falsy
   * `error` means valid.
   */
  error?: ReactNode;
  /**
   * Marks the label with a required-indicator asterisk, and sets
   * `required: true` on the computed `FormFieldControlProps` (not every
   * control atom has its own `required` — `CheckboxGroup` deliberately
   * doesn't, since there's no native "at least one" concept — spreading it
   * onto one that doesn't declare it is a harmless no-op prop, same as
   * passing any other unused key).
   * @default false
   */
  required?: boolean;
  /**
   * Disables the field as a whole: dims the label/helper/error text, and
   * sets `disabled: true` on the computed `FormFieldControlProps`.
   * @default false
   */
  disabled?: boolean;
  /**
   * Font size for the `FieldLabel`, matching the control's own size scale.
   * Deliberately not cascaded onto the control itself — this render-prop
   * API already has the consumer author the control explicitly, so sizing
   * it is one more explicit prop on that same line, not a hidden cascade
   * to reason about.
   * @default 'md'
   */
  size?: FieldLabelSize;
  /**
   * Overrides the auto-generated base id (`useId()` otherwise) used to
   * derive the control's, label's, helper text's, and error message's own
   * ids. Rarely needed directly — pass one when a test or router needs a
   * stable, predictable anchor.
   */
  id?: string;
  /** Additional CSS classes for the outer wrapper. */
  className?: string;
  /** Inline styles for the outer wrapper. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute on the outer wrapper; has no visual or
   * behavioral effect.
   */
  "data-testid"?: string;
}
