import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { InputSize } from "../../atoms/Input";
import type { HourCycle } from "../../internal/time/timeValue";

export type TimePickerSize = InputSize;
export type TimePickerHourCycle = HourCycle;

/**
 * Every piece of text `TimePicker` writes itself. Pass a partial object to translate any of it; the rest
 * stays English. Written once, here, so a translation is one object and nothing is hardcoded in markup.
 */
export interface TimePickerLabels {
  /** The hour segment's accessible name, and its wheel's in the picker. @default 'Hour' */
  hour: string;
  /** The minute segment's accessible name, and its wheel's. @default 'Minute' */
  minute: string;
  /** The second segment's accessible name, and its wheel's. @default 'Second' */
  second: string;
  /** The AM/PM segment's accessible name, and its wheel's. @default 'AM/PM' */
  period: string;
  /** The text for the morning period, shown and announced. @default 'AM' */
  am: string;
  /** The text for the afternoon period, shown and announced. @default 'PM' */
  pm: string;
  /** What a screen reader hears for a segment with nothing in it. @default 'Empty' */
  empty: string;
  /** The accessible name of the button that opens the picker. @default 'Choose time' */
  openPicker: string;
  /** The accessible name of the picker itself, once open. @default 'Choose a time' */
  pickerName: string;
  /** The accessible name of the clear button. @default 'Clear time' */
  clear: string;
}

export interface TimePickerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "children" | "role"> {
  /**
   * Overall size, on the shared scale; its height matches `Input` and `Button` at the same step.
   * @default 'md'
   */
  size?: TimePickerSize;
  /**
   * Shows the error state: a danger-coloured border and `aria-invalid`. A time outside `min`/`max`, or a
   * minute off the `step`, shows it too without this.
   * @default false
   */
  hasError?: boolean;
  /**
   * The time, as a 24-hour string: `"14:30"`, or `"14:30:00"` when `showSeconds` is set. Use `""` (or
   * leave it out) for no time. The value is the same whichever `hourCycle` is shown, and while the
   * field is only partly filled it is `""`. A string that isn't a valid time reads as empty.
   */
  value?: string;
  /**
   * The initial time for uncontrolled usage — ignored once `value` is provided.
   * @default ''
   */
  defaultValue?: string;
  /**
   * Called with the new value whenever it changes: a complete time as `"HH:mm"` (or `"HH:mm:ss"`), or `""`
   * when a segment is cleared and the time is no longer complete.
   */
  onValueChange?: (value: string) => void;
  /**
   * `"12"` shows an hour from 1 to 12 and an AM/PM segment; `"24"` shows 0 to 23. Chosen explicitly and never
   * read from the browser's locale, so the server and the client always agree. The `value` is 24-hour either way.
   * @default '12'
   */
  hourCycle?: TimePickerHourCycle;
  /**
   * Shows a seconds segment (and a seconds wheel in the picker), and makes the value `"HH:mm:ss"`.
   * @default false
   */
  showSeconds?: boolean;
  /**
   * Minutes between the minute values the field accepts: `15` allows `:00 :15 :30 :45`. The arrow keys move
   * along the grid and the picker lists only those minutes; a typed minute off the grid is flagged invalid.
   * @default 1
   */
  step?: number;
  /**
   * The earliest allowed time, as `"HH:mm"` (or `"HH:mm:ss"`). An earlier time is flagged invalid, not
   * refused, and the picker disables the options before it.
   */
  min?: string;
  /**
   * The latest allowed time, as `"HH:mm"` (or `"HH:mm:ss"`). A later time is flagged invalid, not refused, and
   * the picker disables the options after it.
   */
  max?: string;
  /**
   * Shows the button that opens the picker: a popover of wheels of hours, minutes (and seconds and AM/PM) to scroll
   * or tap, with the chosen row in the middle. Turn it off for a field that is only ever typed into.
   * @default true
   */
  showPicker?: boolean;
  /** The controlled open state of the picker. Omit (along with `defaultOpen`) to manage it internally. */
  open?: boolean;
  /**
   * The initial open state of the picker for uncontrolled usage — ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called with the picker's new open state whenever it changes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Shows a clear ("×") button while any segment has something in it. Pass it to turn the button on without
   * having anything to do when it is used; `onClear` also turns it on, and `clearable={false}` turns it off
   * whatever else is passed. Clearing empties the field itself (the AM/PM segment goes back to AM).
   * @default false
   */
  clearable?: boolean;
  /**
   * Called after the clear button has emptied the field (unlike `Input`'s own `onClear`, the field empties
   * itself first, so this is only a notification). Passing it also shows the button, unless
   * `clearable={false}`.
   */
  onClear?: () => void;
  /**
   * Disables the whole field: no segment takes focus, the picker button is inert, and nothing changes.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the field as required for assistive technology (`aria-required`). A `TimePicker` doesn't validate
   * natively; a `FormField`'s `error` is where an empty required field is reported.
   * @default false
   */
  required?: boolean;
  /**
   * Makes the field read-only: its segments can be focused and read but not changed, and the picker and
   * the clear button are hidden.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Focuses the first segment when the field mounts. (React's own `autoFocus` only works on a native form
   * control, so this is done with a ref and an effect.)
   * @default false
   */
  autoFocus?: boolean;
  /**
   * The name a surrounding `<form>` submits the value under, through a hidden input holding the 24-hour
   * string (and `""` while the field is empty or incomplete).
   */
  name?: string;
  /** Associates the hidden form input with a `<form>` by id, when this isn't inside it. */
  form?: string;
  /**
   * Every piece of text the field writes itself — segment names, AM and PM, and the button names — for
   * translation. Pass only the keys you want to change.
   * @default { hour: 'Hour', minute: 'Minute', second: 'Second', period: 'AM/PM', am: 'AM', pm: 'PM', empty: 'Empty', openPicker: 'Choose time', pickerName: 'Choose a time', clear: 'Clear time' }
   */
  labels?: Partial<TimePickerLabels>;
  /**
   * Writes a number in the digits you want shown: `(n) => n.toLocaleString("ar-EG")`. Used for the digits
   * on screen, in the picker and in what a screen reader hears, so what is seen is what is announced; typing
   * digits of any script still works. Never defaulted to a locale.
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * The field's accessible name when there is no visible label to point `aria-labelledby` at. Applied to
   * the group the segments sit in.
   */
  "aria-label"?: string;
  /** Points at the visible label that names the field. A `FormField` passes this. */
  "aria-labelledby"?: string;
  /** Points at helper or error text. A `FormField` passes this. */
  "aria-describedby"?: string;
  /**
   * Standard DOM id, applied to the **first segment** (the hour) — which is what a `FieldLabel`'s `htmlFor`
   * should point at, so clicking the label focuses the field. A `FormField` already does this.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
