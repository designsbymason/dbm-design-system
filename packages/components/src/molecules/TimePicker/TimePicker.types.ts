import type { ComponentPropsWithoutRef, CSSProperties, FocusEventHandler } from "react";
import type { InputSize } from "../../atoms/Input";
import type { HourCycle } from "../../internal/time/timeValue";

export type TimePickerSize = InputSize;
export type TimePickerHourCycle = HourCycle;
/** When `onValueChange` is called: on every change, once a time is settled, or only when the person is done. */
export type TimePickerCommitOn = "change" | "complete" | "blur";
/** Where the AM/PM segment sits in the 12-hour cycle: after the time ("3:45 PM") or before it ("PM 3:45"). */
export type TimePickerPeriodPosition = "start" | "end";

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
  /** The message a form shows when the field is only partly filled and the form is submitted. @default 'Enter a complete time' */
  incomplete: string;
  /** The message a form shows when the time is outside `min`/`max`, off a step or ruled out by `isTimeDisabled`. @default "This time isn't available" */
  unavailable: string;
}

export interface TimePickerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "children" | "role" | "onFocus" | "onBlur"> {
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
   * When `onValueChange` is called. `"change"` reports every change as it happens, including an in-between time
   * (a first minute digit `3` already makes `"09:03"` before the `0` makes `"09:30"`) and every row a wheel passes.
   * `"complete"` waits until the field is settled: a whole time with no digit still expected, and the picker
   * closed, or the field emptied entirely. `"blur"` reports once, when focus leaves the field, the picker closes,
   * `Enter` is pressed, or the clear button is used. Both held modes also report on blur, so what the owner has
   * always catches up with what is shown, `""` included when the field is left half-filled. The segments always
   * show the latest edit; only the report is held.
   * @default 'change'
   */
  commitOn?: TimePickerCommitOn;
  /**
   * `"12"` shows an hour from 1 to 12 and an AM/PM segment; `"24"` shows 0 to 23. Chosen explicitly and never
   * read from the browser's locale, so the server and the client always agree. The `value` is 24-hour either way.
   * @default '12'
   */
  hourCycle?: TimePickerHourCycle;
  /**
   * In the 12-hour cycle, where the AM/PM segment goes: `"end"` for "3:45 PM", `"start"` for "PM 3:45" (some
   * languages write it that way). The picker's AM/PM wheel moves with it. Chosen explicitly like `hourCycle`,
   * never read from the locale, and ignored with `hourCycle="24"`. The hour, minute and second keep their order.
   * @default 'end'
   */
  periodPosition?: TimePickerPeriodPosition;
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
   * Seconds between the second values the field accepts, when `showSeconds` is on: `15` allows `:00 :15 :30 :45`.
   * Works as `step` does for minutes. Seconds that aren't shown are always `00`.
   * @default 1
   */
  secondStep?: number;
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
   * Rules out particular times — a lunch break, a booked slot. Called with a time as the 24-hour string the field's
   * `value` uses (`"12:30"`, or `"12:30:00"` with `showSeconds`); return `true` for one that isn't available.
   * Like `min`/`max`, a time it rules out is flagged invalid and still reported, not refused, and the picker
   * disables a row when it leaves no available time to reach (an hour only if every one of its minutes is ruled
   * out). Keep it cheap and pure: the picker calls it for many times as it draws.
   */
  isTimeDisabled?: (time: string) => boolean;
  /**
   * Shows the button that opens the picker: a popover of wheels of hours, minutes (and seconds and AM/PM) to scroll
   * or tap, with the chosen row in the middle. Turn it off for a field that is only ever typed into.
   * @default true
   */
  showPicker?: boolean;
  /**
   * Opens the picker when a segment receives focus, by Tab or a click, from outside the field or from its own
   * buttons, so the wheels are there as soon as the person gets to it. Focus stays on the segment, so typing still
   * works, and the segments stop asking a phone for its keyboard (`inputMode="none"`) since the wheels are the
   * input. Reaching the picker or clear button doesn't open it, and neither does moving from one segment to the
   * next, so a picker closed with `Escape` stays closed while the person moves along. Needs `showPicker`.
   * @default false
   */
  openOnFocus?: boolean;
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
   * Called when focus arrives in the field from outside it. Unlike a native `focus` event on the group, moving
   * between the segments, the buttons or into the picker is not leaving or arriving, so it fires once per visit.
   */
  onFocus?: FocusEventHandler<HTMLDivElement>;
  /**
   * Called when focus leaves the field for somewhere outside it (the picker counts as part of the field). The
   * usual place for validate-on-blur; with `commitOn` it fires after the held value has been reported.
   */
  onBlur?: FocusEventHandler<HTMLDivElement>;
  /**
   * Disables the whole field: no segment takes focus, the picker button is inert, and nothing changes.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the field as required: `aria-required` on each segment, and a real form constraint, so a surrounding
   * `<form>` won't submit while the field is empty (the browser's own "fill out this field" message). The same
   * form check also refuses a half-filled field and a time outside `min`/`max`, off a step or ruled out by
   * `isTimeDisabled`, with the `incomplete` and `unavailable` labels as the message. That check lives on a hidden
   * time input that holds the value, which is what is submitted under `name`.
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
   * string (and `""` while the field is empty or incomplete). The input is also what a form validates: see
   * `required`.
   */
  name?: string;
  /** Associates the hidden form input with a `<form>` by id, when this isn't inside it. */
  form?: string;
  /**
   * Every piece of text the field writes itself — segment names, AM and PM, and the button names — for
   * translation. Pass only the keys you want to change.
   * @default { hour: 'Hour', minute: 'Minute', second: 'Second', period: 'AM/PM', am: 'AM', pm: 'PM', empty: 'Empty', openPicker: 'Choose time', pickerName: 'Choose a time', clear: 'Clear time', incomplete: 'Enter a complete time', unavailable: "This time isn't available" }
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
