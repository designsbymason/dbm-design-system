import { cx, mergeDefined, mergeRefs } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { FocusEvent } from "react";
import { TimePicker } from "../TimePicker";
import type { TimePickerLabels } from "../TimePicker";
import { compareTime, formatTime, parseTime } from "../../internal/time/timeValue";
import styles from "./TimeRangePicker.module.css";
import type { TimeRangePickerLabels, TimeRangePickerProps, TimeRangeValue } from "./TimeRangePicker.types";

const defaultLabels: TimeRangePickerLabels = {
  start: "Start time",
  end: "End time",
  hour: "Hour",
  minute: "Minute",
  second: "Second",
  period: "AM/PM",
  am: "AM",
  pm: "PM",
  empty: "Empty",
  openPicker: "Choose time",
  pickerName: "Choose a time",
  clear: "Clear time",
  incomplete: "Enter a complete time",
  unavailable: "This time isn't available",
};

/** The later of two times (as the strings a `TimePicker` takes), or the one that exists. */
function later(a: string | undefined, b: string | undefined, showSeconds: boolean): string | undefined {
  const pa = parseTime(a);
  const pb = parseTime(b);
  if (pa && pb) return formatTime(compareTime(pa, pb) >= 0 ? pa : pb, showSeconds);
  const only = pa ?? pb;
  return only ? formatTime(only, showSeconds) : undefined;
}

/**
 * A start time and an end time: two `TimePicker`s side by side, joined by a dash, whose values are one
 * `[start, end]` pair. Each end has everything a `TimePicker` has (segments you type into, a picker, seconds,
 * a minute `step`, `hourCycle`, a clear button), and the end can't be before the start: its picker disables what
 * is earlier, and an end earlier than the start is reported as typed and flagged invalid on that end, not
 * refused. The start is not limited by the end.
 *
 * Built by composing two `TimePicker`s (so a change to one reaches both), not a copy of it. `ref` forwards to
 * the group that holds them; `id` goes on the start field's first segment.
 *
 * @example
 * ```tsx
 * <TimeRangePicker aria-label="Opening hours" defaultValue={["09:00", "17:30"]} />
 * <TimeRangePicker value={range} onValueChange={setRange} hourCycle="24" step={15} />
 * ```
 */
export const TimeRangePicker = forwardRef<HTMLDivElement, TimeRangePickerProps>(
  (
    {
      value: valueProp,
      defaultValue = ["", ""],
      onValueChange,
      commitOn,
      hourCycle = "12",
      periodPosition,
      showSeconds = false,
      step,
      secondStep,
      min,
      max,
      isTimeDisabled,
      size = "md",
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      showPicker = true,
      openOnFocus,
      clearable,
      onClear,
      onFocus,
      onBlur,
      name,
      form,
      autoFocus = false,
      labels: labelOverrides,
      formatNumber,
      id,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      className,
      style,
      "data-testid": dataTestId,
      ...props
    },
    ref,
  ) => {
    const labels = mergeDefined(defaultLabels, labelOverrides);
    const [uncontrolled, setUncontrolled] = useState<TimeRangeValue>(defaultValue);
    const isControlled = valueProp !== undefined;
    const pair = isControlled ? valueProp : uncontrolled;
    const start = typeof pair?.[0] === "string" ? pair[0] : "";
    const end = typeof pair?.[1] === "string" ? pair[1] : "";

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (ariaLabel || ariaLabelledBy) return;
      console.warn(
        "TimeRangePicker: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label (or put it in a `FormField`), so assistive tech has something to announce for the pair.",
      );
      // Once per mount: the point is catching the omission, not repeating it on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const change = (next: TimeRangeValue) => {
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
    };

    // The end can't be before the start, so the start narrows the end's earliest. The start stays free: constraining it
    // by the end too would flag the start whenever the end is mid-typing and briefly earlier.
    const endMin = later(min, start, showSeconds);

    // The pair is one field to the outside: focus moving between the ends (or into either one's picker) is not arriving or
    // leaving. Each end already reports only its own arrivals and departures, so a departure that lands in the other end
    // is told apart by where focus went, and an arrival by whether the pair was already focused.
    const rootElement = useRef<HTMLDivElement | null>(null);
    const inside = useRef(false);
    const onEndFocus = (event: FocusEvent<HTMLDivElement>) => {
      if (inside.current) return;
      inside.current = true;
      onFocus?.(event);
    };
    const onEndBlur = (event: FocusEvent<HTMLDivElement>) => {
      const to = event.relatedTarget;
      if (to instanceof Node && rootElement.current?.contains(to)) return;
      inside.current = false;
      onBlur?.(event);
    };

    const pickerLabels: Partial<TimePickerLabels> = labels;
    const common = {
      commitOn,
      hourCycle,
      periodPosition,
      showSeconds,
      step,
      secondStep,
      isTimeDisabled,
      openOnFocus,
      onFocus: onEndFocus,
      onBlur: onEndBlur,
      size,
      hasError,
      disabled,
      readOnly,
      required,
      showPicker,
      clearable,
      labels: pickerLabels,
      formatNumber,
    };

    return (
      <div
        {...props}
        ref={mergeRefs(ref, rootElement)}
        role="group"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        data-testid={dataTestId}
        style={style}
        className={cx(styles.root, className)}
      >
        <TimePicker
          {...common}
          id={id}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- passing on the component's own opt-in prop, not a native attribute
          autoFocus={autoFocus}
          aria-label={labels.start}
          value={start}
          min={min}
          max={max}
          name={name ? `${name}[]` : undefined}
          form={form}
          onClear={onClear ? () => onClear("start") : undefined}
          onValueChange={(next) => change([next, end])}
        />
        <span aria-hidden="true" className={styles.separator}>
          –
        </span>
        <TimePicker
          {...common}
          aria-label={labels.end}
          value={end}
          min={endMin}
          max={max}
          name={name ? `${name}[]` : undefined}
          form={form}
          onClear={onClear ? () => onClear("end") : undefined}
          onValueChange={(next) => change([start, next])}
        />
      </div>
    );
  },
);
TimeRangePicker.displayName = "TimeRangePicker";
