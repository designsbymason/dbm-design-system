import type { ComponentPropsWithoutRef, CSSProperties, FocusEventHandler } from "react";
import type {
  TimePickerCommitOn,
  TimePickerHourCycle,
  TimePickerLabels,
  TimePickerPeriodPosition,
  TimePickerSize,
} from "../TimePicker";

/** `[start, end]`, each a 24-hour `"HH:mm"` (or `"HH:mm:ss"`) string, or `""` while that end is empty. */
export type TimeRangeValue = [start: string, end: string];

/** Everything `TimePicker` writes itself, plus the two names this component adds. */
export interface TimeRangePickerLabels extends TimePickerLabels {
  /** The start field's accessible name. @default 'Start time' */
  start: string;
  /** The end field's accessible name. @default 'End time' */
  end: string;
}

export interface TimeRangePickerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "children" | "role" | "onFocus" | "onBlur"> {
  /**
   * Overall size of both fields, on the shared scale.
   * @default 'md'
   */
  size?: TimePickerSize;
  /**
   * Shows the error state on both ends. An end earlier than the start shows it on that end without this.
   * @default false
   */
  hasError?: boolean;
  /**
   * The range, as `[start, end]` 24-hour strings: `["09:00", "17:30"]`. Use `""` for an end with no time yet.
   * Controlled: pair it with `onValueChange`.
   */
  value?: TimeRangeValue;
  /**
   * The initial range for uncontrolled usage — ignored once `value` is provided.
   * @default ['', '']
   */
  defaultValue?: TimeRangeValue;
  /**
   * Called with the new `[start, end]` whenever either end changes. An end that is empty or still half-filled is
   * `""`. An end earlier than the start is reported as typed and flagged invalid, not refused.
   */
  onValueChange?: (value: TimeRangeValue) => void;
  /**
   * When `onValueChange` is called, for each end: on every change, once that end is settled, or when focus leaves
   * it; see `TimePicker`.
   * @default 'change'
   */
  commitOn?: TimePickerCommitOn;
  /**
   * `"12"` shows each end with an AM/PM segment; `"24"` does not. Chosen explicitly, never read from the locale.
   * @default '12'
   */
  hourCycle?: TimePickerHourCycle;
  /**
   * In the 12-hour cycle, whether each end's AM/PM comes after the time (`"end"`, "3:45 PM") or before it
   * (`"start"`, "PM 3:45").
   * @default 'end'
   */
  periodPosition?: TimePickerPeriodPosition;
  /**
   * Shows a seconds segment on both ends, making each value `"HH:mm:ss"`.
   * @default false
   */
  showSeconds?: boolean;
  /**
   * Minutes between the minute values either end accepts: `15` allows `:00 :15 :30 :45`.
   * @default 1
   */
  step?: number;
  /**
   * Seconds between the second values either end accepts, with `showSeconds`: `15` allows `:00 :15 :30 :45`.
   * @default 1
   */
  secondStep?: number;
  /** The earliest time either end may be, as `"HH:mm"`. The end's earliest is also the start. */
  min?: string;
  /** The latest time either end may be, as `"HH:mm"`. */
  max?: string;
  /**
   * Rules out particular times for either end, with the 24-hour string each end's value uses; return `true` for a
   * time that isn't available. Flagged and still reported, as `min`/`max` are; see `TimePicker`.
   */
  isTimeDisabled?: (time: string) => boolean;
  /**
   * The shortest the range may be, in minutes, from the start to the end. An end that makes it shorter is flagged
   * invalid and still reported, and the end's picker disables what would; with `constrainStart`, so does the
   * start's. Nothing is checked until both ends are complete.
   */
  minDuration?: number;
  /**
   * The longest the range may be, in minutes, from the start to the end. Flagged and disabled as `minDuration` is.
   */
  maxDuration?: number;
  /**
   * Lets the end be earlier than the start, meaning the next day: 22:00 to 02:00 is four hours. The value stays a
   * pair of times of day, with no date. Without it an end before the start is flagged. Equal times are a range of
   * no length, not a full day. `minDuration` and `maxDuration` count across midnight.
   * @default false
   */
  allowOvernight?: boolean;
  /**
   * Limits the start by the end as the end is by the start: a start after the end is flagged and the start's picker
   * disables it (and, with the duration limits, whatever would make the range too short or long). Off by default
   * because the start would be flagged whenever the end is mid-typing and briefly earlier. With `allowOvernight` the
   * start has no latest, only the duration limits apply.
   * @default false
   */
  constrainStart?: boolean;
  /**
   * Shows each end's picker button.
   * @default true
   */
  showPicker?: boolean;
  /**
   * Replaces the two pickers with one: a single button after the end opens one popover holding the start's wheels
   * and the end's side by side, so both can be set in one visit. Needs `showPicker`. Picks follow `commitOn`: with
   * `"complete"` or `"blur"` they are held until the popover closes.
   * @default false
   */
  sharedPicker?: boolean;
  /**
   * Opens an end's picker when focus lands on one of its segments other than from another of its own segments; see
   * `TimePicker`. Moving from one end to the other opens the other's picker too. With `sharedPicker` it opens the
   * shared popover when focus arrives in the pair, and moving between the ends leaves it open.
   * @default false
   */
  openOnFocus?: boolean;
  /**
   * Shows a clear ("×") button while any end has something in it. Pass it to turn the button on without
   * having anything to do when it is used; `onClear` also turns it on, and `clearable={false}` turns it off
   * whatever else is passed. Clearing empties that end.
   * @default false
   */
  clearable?: boolean;
  /**
   * Called, with which end, after a clear button has emptied that end. Passing it also shows the buttons,
   * unless `clearable={false}`.
   */
  onClear?: (end: "start" | "end") => void;
  /**
   * Called when focus arrives in the range from outside it. Moving between the two ends, their buttons or their
   * pickers is not arriving, so it fires once per visit to the pair.
   */
  onFocus?: FocusEventHandler<HTMLDivElement>;
  /**
   * Called when focus leaves the range for somewhere outside it, for validating the pair once the person has
   * left both ends.
   */
  onBlur?: FocusEventHandler<HTMLDivElement>;
  /**
   * Disables both ends.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks both ends as required: a form won't submit while either is empty, and a half-filled or unavailable end
   * stops it too; see `TimePicker`.
   * @default false
   */
  required?: boolean;
  /**
   * Makes both ends read-only.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Focuses the start field's first segment on mount.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * The name a surrounding `<form>` submits both values under — `name[]`, as `RangeSlider` does — through hidden
   * inputs, start first.
   */
  name?: string;
  /** Associates the hidden form inputs with a `<form>` by id. */
  form?: string;
  /**
   * Every piece of text the fields write themselves, and the two end names, for translation. Pass only the keys
   * you want to change.
   * @default { start: 'Start time', end: 'End time', hour: 'Hour', minute: 'Minute', second: 'Second', period: 'AM/PM', am: 'AM', pm: 'PM', empty: 'Empty', openPicker: 'Choose time', pickerName: 'Choose a time', clear: 'Clear time', incomplete: 'Enter a complete time', unavailable: "This time isn't available" }
   */
  labels?: Partial<TimeRangePickerLabels>;
  /** Writes a number in the digits you want shown; see `TimePicker`. @default String */
  formatNumber?: (value: number) => string;
  /** The range's accessible name when there is no visible label to point `aria-labelledby` at. */
  "aria-label"?: string;
  /** Points at the visible label that names the range. A `FormField` passes this. */
  "aria-labelledby"?: string;
  /** Points at helper or error text. A `FormField` passes this. */
  "aria-describedby"?: string;
  /**
   * Standard DOM id, applied to the **start** field's first segment — what a `FieldLabel`'s `htmlFor` should point
   * at. A `FormField` does this.
   */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
