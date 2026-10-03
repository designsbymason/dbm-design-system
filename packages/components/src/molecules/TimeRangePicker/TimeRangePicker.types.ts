import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { TimePickerHourCycle, TimePickerLabels, TimePickerSize } from "../TimePicker";

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
  extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange" | "children" | "role"> {
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
   * `"12"` shows each end with an AM/PM segment; `"24"` does not. Chosen explicitly, never read from the locale.
   * @default '12'
   */
  hourCycle?: TimePickerHourCycle;
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
  /** The earliest time either end may be, as `"HH:mm"`. The end's earliest is also the start. */
  min?: string;
  /** The latest time either end may be, as `"HH:mm"`. */
  max?: string;
  /**
   * Shows each end's picker button.
   * @default true
   */
  showPicker?: boolean;
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
   * Disables both ends.
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the range as required for assistive technology.
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
   * @default { start: 'Start time', end: 'End time', hour: 'Hour', minute: 'Minute', second: 'Second', period: 'AM/PM', am: 'AM', pm: 'PM', empty: 'Empty', openPicker: 'Choose time', pickerName: 'Choose a time', clear: 'Clear time' }
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
