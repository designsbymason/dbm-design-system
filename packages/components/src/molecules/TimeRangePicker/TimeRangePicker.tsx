import { ClockIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, mergeRefs } from "@dbm-design-system/primitives";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { FocusEvent } from "react";
import { IconButton } from "../../atoms/IconButton";
import { Text } from "../../atoms/Text";
import { Popover } from "../Popover";
import { TimePicker } from "../TimePicker";
import type { TimePickerLabels } from "../TimePicker";
import { TimePickerColumns } from "../TimePicker/TimePickerColumns";
import {
  compareTime,
  draftToValue,
  durationSeconds,
  formatTime,
  parseTime,
  pickIntoDraft,
  valueToDraft,
} from "../../internal/time/timeValue";
import type { Period, Segment, TimeParts } from "../../internal/time/timeValue";
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

/** The later (or, with `earlier`, the earlier) of two times (as the strings a `TimePicker` takes), or the one that exists. */
function pickOf(a: string | undefined, b: string | undefined, showSeconds: boolean, earlier = false): string | undefined {
  const pa = parseTime(a);
  const pb = parseTime(b);
  if (pa && pb) return formatTime((compareTime(pa, pb) >= 0) !== earlier ? pa : pb, showSeconds);
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
      minDuration,
      maxDuration,
      allowOvernight = false,
      constrainStart = false,
      size = "md",
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      showPicker = true,
      sharedPicker = false,
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
    // Picks made in the shared popover that `commitOn` is holding back, shown in the fields and wheels meanwhile.
    const [held, setHeld] = useState<TimeRangeValue | null>(null);
    const committedStart = typeof pair?.[0] === "string" ? pair[0] : "";
    const committedEnd = typeof pair?.[1] === "string" ? pair[1] : "";
    // A range set from outside while picks are held wins over them, as a `TimePicker`'s value does over a held edit.
    const [seenPair, setSeenPair] = useState(`${committedStart}|${committedEnd}`);
    if (seenPair !== `${committedStart}|${committedEnd}`) {
      setSeenPair(`${committedStart}|${committedEnd}`);
      if (held) setHeld(null);
    }
    const start = held ? held[0] : committedStart;
    const end = held ? held[1] : committedEnd;
    const shared = sharedPicker && showPicker;

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
      setHeld(null);
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
    };

    const startParts = parseTime(start);
    const endParts = parseTime(end);
    // Whether a start and an end make an allowed range: the end isn't before the start (unless it may be the next day) and
    // the length is within the limits. A range is only judged once both ends are whole.
    const rangeAllowed = (from: TimeParts, to: TimeParts) => {
      const length = durationSeconds(from, to, allowOvernight);
      if (length === undefined) return false;
      if (minDuration !== undefined && length < minDuration * 60) return false;
      if (maxDuration !== undefined && length > maxDuration * 60) return false;
      return true;
    };
    const hasLimits = minDuration !== undefined || maxDuration !== undefined;

    // The end can't be before the start (unless it may be the next day), so the start narrows the end's earliest. The start
    // stays free unless `constrainStart` asks: constraining it by the end too would flag the start whenever the end is
    // mid-typing and briefly earlier.
    const endMin = allowOvernight ? min : pickOf(min, start, showSeconds);
    const startMax = constrainStart && !allowOvernight ? pickOf(max, end, showSeconds, true) : max;
    const endBlocked =
      hasLimits || isTimeDisabled
        ? (time: string) => {
            if (isTimeDisabled?.(time)) return true;
            const parts = parseTime(time);
            return hasLimits && startParts !== undefined && parts !== undefined && !rangeAllowed(startParts, parts);
          }
        : undefined;
    const startBlocked =
      isTimeDisabled || (constrainStart && (hasLimits || allowOvernight))
        ? (time: string) => {
            if (isTimeDisabled?.(time)) return true;
            const parts = parseTime(time);
            return constrainStart && hasLimits && endParts !== undefined && parts !== undefined && !rangeAllowed(parts, endParts);
          }
        : undefined;

    // The pair is one field to the outside: focus moving between the ends (or into either one's picker, or the shared
    // one) is not arriving or leaving. Each end already reports only its own arrivals and departures, so a departure
    // that lands in the other end is told apart by where focus went, and an arrival by whether the pair was already focused.
    const rootElement = useRef<HTMLDivElement | null>(null);
    const popoverElement = useRef<HTMLDivElement | null>(null);
    const inside = useRef(false);
    const openedByFocus = useRef(false);
    const [open, setOpen] = useState(false);
    const withinPair = (node: EventTarget | null) =>
      node instanceof Node && (rootElement.current?.contains(node) === true || popoverElement.current?.contains(node) === true);
    const arrive = (event: FocusEvent<HTMLElement>) => {
      if (inside.current) return;
      inside.current = true;
      onFocus?.(event as FocusEvent<HTMLDivElement>);
    };
    const leave = (event: FocusEvent<HTMLElement>) => {
      if (withinPair(event.relatedTarget)) return;
      inside.current = false;
      onBlur?.(event as FocusEvent<HTMLDivElement>);
    };
    const onEndFocus = (event: FocusEvent<HTMLDivElement>) => {
      const entering = !inside.current;
      arrive(event);
      if (shared && openOnFocus && entering && event.target instanceof HTMLInputElement && !open) {
        openedByFocus.current = true;
        setOpen(true);
      }
    };
    // Closing the shared popover is the end of choosing in it: what `commitOn` held is reported.
    const changeOpen = (next: boolean) => {
      setOpen(next);
      if (!next && held) change(held);
    };

    const pickerLabels: Partial<TimePickerLabels> = labels;
    const common = {
      commitOn,
      hourCycle,
      periodPosition,
      showSeconds,
      step,
      secondStep,
      openOnFocus: shared ? false : openOnFocus,
      onFocus: onEndFocus,
      onBlur: leave,
      size,
      hasError,
      disabled,
      readOnly,
      required,
      showPicker: showPicker && !shared,
      clearable,
      labels: pickerLabels,
      formatNumber,
    };

    // The shared popover's wheels read the committed value of each end and write a whole one back.
    const cycle = hourCycle === "24" ? "24" : "12";
    const format = (n: number) => (n < 10 ? (formatNumber ?? String)(0) : "") + (formatNumber ?? String)(n);
    const rulesFor = (which: "start" | "end") => {
      const bound = which === "start" ? { min, max: startMax, blocked: startBlocked } : { min: endMin, max, blocked: endBlocked };
      const { blocked } = bound;
      return {
        min: parseTime(bound.min),
        max: parseTime(bound.max),
        step: step ?? 1,
        secondStep: secondStep ?? 1,
        blocked: blocked ? (parts: TimeParts) => blocked(formatTime(parts, showSeconds)) : undefined,
      };
    };
    const pickFor = (which: "start" | "end") => (segment: Segment, picked: number | Period) => {
      const current = which === "start" ? start : end;
      const next = draftToValue(pickIntoDraft(valueToDraft(current, cycle, showSeconds), segment, picked, cycle, showSeconds), cycle, showSeconds);
      const nextPair: TimeRangeValue = which === "start" ? [next, end] : [start, next];
      if (commitOn === undefined || commitOn === "change") change(nextPair);
      else setHeld(nextPair);
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
          max={startMax}
          isTimeDisabled={startBlocked}
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
          isTimeDisabled={endBlocked}
          name={name ? `${name}[]` : undefined}
          form={form}
          onClear={onClear ? () => onClear("end") : undefined}
          onValueChange={(next) => change([start, next])}
        />
        {shared && (
          <Popover open={open} onOpenChange={changeOpen}>
            <Popover.Trigger asChild>
              <IconButton
                icon={ClockIcon}
                variant="ghost"
                size={size}
                aria-label={labels.openPicker}
                disabled={disabled || readOnly}
                onFocus={arrive}
                onBlur={leave}
              />
            </Popover.Trigger>
            <Popover.Content
              ref={popoverElement}
              align="end"
              hideArrow
              aria-label={labels.pickerName}
              className={styles.sharedContent}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                // Opened by arriving on a segment, focus stays there; otherwise it goes to the start's hours wheel.
                if (openedByFocus.current) return;
                const hours = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="listbox"]')].find(
                  (wheel) => wheel.getAttribute("aria-label") === labels.hour,
                );
                hours?.focus();
              }}
              onCloseAutoFocus={(event) => {
                if (openedByFocus.current) event.preventDefault();
                openedByFocus.current = false;
              }}
              onInteractOutside={(event) => {
                if (openOnFocus && withinPair(event.target)) event.preventDefault();
              }}
              onFocus={arrive}
              onBlur={leave}
            >
              <div className={styles.sharedPicker}>
                {(["start", "end"] as const).map((which) => (
                  <div key={which} role="group" aria-label={labels[which]} className={styles.section}>
                    <Text size="sm" weight="medium" color="secondary" aria-hidden="true">
                      {labels[which]}
                    </Text>
                    <TimePickerColumns
                      draft={valueToDraft(which === "start" ? start : end, cycle, showSeconds)}
                      cycle={cycle}
                      showSeconds={showSeconds}
                      rules={rulesFor(which)}
                      periodFirst={cycle === "12" && periodPosition === "start"}
                      labels={labels}
                      format={format}
                      onPick={pickFor(which)}
                      onDone={() => changeOpen(false)}
                    />
                  </div>
                ))}
              </div>
            </Popover.Content>
          </Popover>
        )}
      </div>
    );
  },
);
TimeRangePicker.displayName = "TimeRangePicker";
