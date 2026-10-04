import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { InputSize } from "../../atoms/Input";

/** What characters a `PinInput` accepts. */
export type PinInputType = "numeric" | "alphanumeric" | "text";

/** The text a `PinInput` writes itself. */
export interface PinInputLabels {
  /** The accessible name of the show/hide button. @default "Show code" */
  reveal: string;
}

export interface PinInputProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    | "type"
    | "size"
    | "value"
    | "defaultValue"
    | "onChange"
    | "maxLength"
    | "minLength"
    | "pattern"
    | "inputMode"
    | "placeholder"
    | "prefix"
  > {
  /**
   * The number of characters in the code, drawn as one cell each.
   * @default 6
   */
  length?: number;
  /**
   * Which characters are accepted. `numeric` takes digits only and asks a phone for its number pad;
   * `alphanumeric` takes letters and digits; `text` takes anything. Anything else a person types or pastes is
   * dropped, so a pasted `123-456` becomes `123456`.
   * @default "numeric"
   */
  type?: PinInputType;
  /**
   * The controlled value, a plain string. Pair with `onValueChange`, or the code will appear frozen.
   */
  value?: string;
  /**
   * The initial value when uncontrolled.
   * @default ""
   */
  defaultValue?: string;
  /**
   * Called with the whole code each time it changes, as the person types, pastes or deletes.
   */
  onValueChange?: (value: string) => void;
  /**
   * Called with the whole code when a change fills every cell, and not for a value you pass in. Use it to submit
   * automatically.
   */
  onComplete?: (value: string) => void;
  /**
   * The box of each cell, on the shared size scale. A cell is as tall as an `Input` or `Button` of the same step.
   * @default "md"
   */
  size?: InputSize;
  /**
   * Splits the cells into groups of these sizes, for a code read in chunks (`[3, 3]` for `123 456`). The sizes
   * should add up to `length`; any cells left over make a last group.
   */
  groups?: number[];
  /**
   * What is drawn between groups.
   * @default A dash
   */
  separator?: ReactNode;
  /**
   * Hides each character behind a dot, for a PIN rather than a code that arrives by text message. Set
   * `revealable` to let the person look.
   * @default false
   */
  mask?: boolean;
  /**
   * Adds a button that shows and hides a masked code. Ignored without `mask`.
   * @default false
   */
  revealable?: boolean;
  /**
   * Whether a masked code is showing. Pair with `onRevealedChange`.
   */
  revealed?: boolean;
  /**
   * Whether a masked code starts showing, when uncontrolled.
   * @default false
   */
  defaultRevealed?: boolean;
  /**
   * Called when the show/hide button is pressed, with whether the code is now showing.
   */
  onRevealedChange?: (revealed: boolean) => void;
  /**
   * A hint drawn in each empty cell, one character per cell; a single character is repeated in every cell
   * (`"○"`). Decorative: it is not read out.
   */
  placeholder?: string;
  /**
   * Marks the code as invalid, visually and with `aria-invalid`.
   * @default false
   */
  hasError?: boolean;
  /**
   * Disables the field and the show/hide button.
   * @default false
   */
  disabled?: boolean;
  /**
   * Stops editing without disabling the field: the cells can still be focused and read.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Makes the code required for form validation. A code that is started but short also fails validation.
   * @default false
   */
  required?: boolean;
  /**
   * The browser's autofill hint. The default lets a phone offer a code that has just arrived by text message.
   * @default "one-time-code"
   */
  autoComplete?: string;
  /**
   * The name the code is submitted under in a surrounding `<form>`, as one string.
   */
  name?: string;
  /**
   * Text this component writes itself, for translation. Missing keys keep their English defaults.
   * @default { reveal: "Show code" }
   */
  labels?: Partial<PinInputLabels>;
  /**
   * The accessible name of the field when there is no visible label.
   */
  "aria-label"?: string;
  /**
   * The id of the element that names the field.
   */
  "aria-labelledby"?: string;
  /**
   * The id of the helper or error text that describes the field.
   */
  "aria-describedby"?: string;
  /**
   * The id of the native `<input>`, so a `FieldLabel`'s `htmlFor` can point at it.
   */
  id?: string;
  /**
   * Extra classes, on the outermost box.
   */
  className?: string;
  /**
   * Inline styles, on the outermost box.
   */
  style?: CSSProperties;
  /**
   * A test identifier, on the native `<input>`.
   */
  "data-testid"?: string;
}
