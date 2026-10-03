import { ClockIcon, XIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined } from "@dbm-design-system/primitives";
import { Fragment, forwardRef, useEffect, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { Icon } from "../../atoms/Icon";
import { Popover } from "../Popover";
import styles from "./TimePicker.module.css";
import type { TimePickerLabels, TimePickerProps, TimePickerSize } from "./TimePicker.types";
import { TimePickerColumns } from "./TimePickerColumns";
import { digitValue, enterDigit, periodFromLetter } from "../../internal/time/segmentEntry";
import {
  draftToParts,
  draftToValue,
  hourRange,
  isTimeAllowed,
  parseTime,
  segmentsFor,
  stepSegment,
  valueToDraft,
} from "../../internal/time/timeValue";
import type { Period, Segment, TimeDraft } from "../../internal/time/timeValue";

const defaultLabels: TimePickerLabels = {
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
};

const sizeClass: Record<TimePickerSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const buttonClass: Record<TimePickerSize, string | undefined> = {
  xs: styles.buttonXs,
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
  xl: styles.buttonXl,
};

// `Input`'s own mapping: the icon is one step down from the field's size, so the button stays inside its row.
const iconSizeFor: Record<TimePickerSize, "xs" | "sm" | "md" | "lg"> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

const draftKey = { hour: "hour", minute: "minute", second: "second", period: "period" } as const;

/**
 * A time-of-day field: separate hour, minute, (second) and AM/PM segments you type into or step with the arrow
 * keys, and a popover of scrollable columns to pick from with a pointer. The value is a 24-hour string —
 * `"14:30"`, or `"14:30:00"` with `showSeconds` — whichever `hourCycle` is shown, so there is nothing to parse and
 * it submits as it is.
 *
 * Typing follows a native time field: a digit that can't start a two-digit number is the whole number and moves on
 * (a 7 in the minutes), one that can waits for the next. `Backspace` clears a segment, `ArrowUp`/`ArrowDown` step
 * it (wrapping, and along the `step` grid in the minutes), `ArrowLeft`/`ArrowRight` move between segments, and
 * `Home`/`End` go to the ends. While a segment is empty the value is `""`.
 *
 * A time outside `min`/`max`, or a minute off the `step`, is flagged (`aria-invalid`, error styling) and still
 * reported, not refused — refusing a half-typed time would make the field fight the person — and the picker
 * disables what can't be reached. The hour cycle is chosen with `hourCycle`, never read from the browser's locale,
 * and every word it writes is in `labels` ([ADR-0029](../../../../guidelines/adr/0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md)).
 *
 * `ref` forwards to the group element that holds the segments. The `id` goes on the first segment (the hour),
 * which is what a label's `htmlFor` should point at.
 *
 * @example
 * ```tsx
 * <TimePicker aria-label="Start time" defaultValue="09:30" />
 * <TimePicker value={time} onValueChange={setTime} hourCycle="24" step={15} min="08:00" max="18:00" />
 * <FormField label="Reminder">{(field) => <TimePicker {...field} showSeconds />}</FormField>
 * ```
 */
export const TimePicker = forwardRef<HTMLDivElement, TimePickerProps>(
  (
    {
      value: valueProp,
      defaultValue = "",
      onValueChange,
      hourCycle = "12",
      showSeconds = false,
      step: stepProp = 1,
      min,
      max,
      size = "md",
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      showPicker = true,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      onClear,
      name,
      form,
      autoFocus = false,
      labels: labelOverrides,
      formatNumber = String,
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
    const cycle = hourCycle === "24" ? "24" : "12";
    const step = Number.isInteger(stepProp) && stepProp >= 1 && stepProp <= 59 ? stepProp : 1;
    const minParts = parseTime(min);
    const maxParts = parseTime(max);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (step !== stepProp) {
        console.warn(`TimePicker: \`step\` must be a whole number of minutes from 1 to 59; got ${String(stepProp)}, using 1.`);
      }
      for (const [prop, text, parts] of [["min", min, minParts], ["max", max, maxParts]] as const) {
        if (text !== undefined && text !== "" && !parts) {
          console.warn(`TimePicker: \`${prop}\` must be "HH:mm" or "HH:mm:ss" (24-hour); got ${JSON.stringify(text)}, ignoring it.`);
        }
      }
      // Only the values that make a warning matter, not their identity on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stepProp, min, max]);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (ariaLabel || ariaLabelledBy) return;
      console.warn(
        "TimePicker: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label (or put it in a `FormField`), so assistive tech has something to announce for the group of segments.",
      );
      // Once per mount: the point is catching the omission, not repeating it on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The committed value, and what the segments show, which can be ahead of it (a segment emptied, a time half-typed).
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const isControlled = valueProp !== undefined;
    const rawValue = isControlled ? valueProp : uncontrolledValue;
    const parsed = parseTime(rawValue);
    const value = parsed ? draftToValue(valueToDraft(rawValue, cycle, showSeconds), cycle, showSeconds) : "";
    const [draft, setDraft] = useState<TimeDraft>(() => valueToDraft(rawValue, cycle, showSeconds));
    // A value that is no longer what the segments stand for (set from outside, or the hour cycle changed) wins.
    // Adjusted while rendering, not in an effect, so there is never a frame showing the old time.
    if (value !== draftToValue(draft, cycle, showSeconds)) setDraft(valueToDraft(value, cycle, showSeconds));

    const [pending, setPending] = useState<{ segment: Segment; digit: number } | null>(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = (openProp ?? uncontrolledOpen) && !disabled && !readOnly;
    const setOpen = (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };

    const segments = segmentsFor(cycle, showSeconds);
    const segmentRefs = useRef<Partial<Record<Segment, HTMLInputElement | null>>>({});
    const focusSegment = (segment: Segment | undefined) => {
      if (segment) segmentRefs.current[segment]?.focus();
    };

    useEffect(() => {
      if (autoFocus) segmentRefs.current.hour?.focus();
      // On mount only, as a native `autoFocus` is.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const commit = (next: TimeDraft) => {
      setDraft(next);
      const nextValue = draftToValue(next, cycle, showSeconds);
      if (nextValue === value) return;
      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    };

    const format = (n: number) => (n < 10 ? formatNumber(0) : "") + formatNumber(n);

    const parts = draftToParts(draft, cycle, showSeconds);
    const outsideConstraints = parts !== undefined && !isTimeAllowed(parts, { min: minParts, max: maxParts, step });
    const invalid = hasError || outsideConstraints;
    const hasContent = Object.values(draft).some((part) => part !== undefined);

    // Feeds typed text into the field, starting at `segment`: digits into the number segments, a letter into AM/PM, and
    // a separator to finish the one being typed. One keystroke is one character; a phone's keyboard, an autofill or a
    // paste can deliver several at once ("0930p"), and each goes where the one before it left off.
    const typeText = (startSegment: Segment, text: string) => {
      let working = draft;
      let current = startSegment;
      let carried = pending;
      // Whether a digit has gone into `current` since focus arrived there: a separator only finishes a segment that has one.
      let touched = false;
      for (const character of text) {
        if (character === ":" || character === "." || character === "," || character === " ") {
          const next = segments[segments.indexOf(current) + 1];
          if (touched && next !== undefined) {
            current = next;
            carried = null;
            touched = false;
          }
          continue;
        }
        if (current === "period") {
          const period = periodFromLetter(character, { am: labels.am, pm: labels.pm });
          if (period) working = { ...working, period };
          continue;
        }
        let digit = digitValue(character);
        if (digit === undefined) {
          // A letter typed while a number is expected is the period's, once the numbers before it are done: "9:30p".
          const period = segments.includes("period") ? periodFromLetter(character, { am: labels.am, pm: labels.pm }) : undefined;
          if (period && !carried) {
            working = { ...working, period };
            current = "period";
            touched = true;
          }
          continue;
        }
        for (;;) {
          const target = current as Exclude<Segment, "period">;
          const buffer = carried?.segment === target ? carried.digit : undefined;
          const result = enterDigit(target, buffer, digit, cycle);
          working = { ...working, [draftKey[target]]: result.value };
          touched = true;
          if (!result.done) {
            carried = result.buffer === undefined ? null : { segment: target, digit: result.buffer };
            break;
          }
          carried = null;
          const next = segments[segments.indexOf(target) + 1];
          if (next === undefined) break;
          current = next;
          touched = false;
          if (result.carry !== undefined && next !== "period") {
            digit = result.carry;
            continue;
          }
          break;
        }
      }
      setPending(carried);
      commit(working);
      if (current !== startSegment) focusSegment(current);
    };

    const onSegmentKeyDown = (event: KeyboardEvent<HTMLInputElement>, segment: Segment) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key;
      const index = segments.indexOf(segment);
      const editable = !disabled && !readOnly;
      switch (key) {
        case "ArrowLeft":
          event.preventDefault();
          focusSegment(segments[index - 1]);
          return;
        case "ArrowRight":
          event.preventDefault();
          focusSegment(segments[index + 1]);
          return;
        case "Tab":
        case "Enter":
        case "Escape":
          return;
      }
      if (!editable) {
        if (key.length === 1 || key === "Backspace" || key === "Delete" || key.startsWith("Arrow")) event.preventDefault();
        return;
      }
      switch (key) {
        case "ArrowUp":
        case "ArrowDown":
          event.preventDefault();
          setPending(null);
          commit(stepSegment(draft, segment, key === "ArrowUp" ? 1 : -1, cycle, step));
          return;
        case "Home":
        case "End": {
          event.preventDefault();
          setPending(null);
          const first = key === "Home";
          commit(
            segment === "hour"
              ? { ...draft, hour: first ? hourRange(cycle).min : hourRange(cycle).max }
              : segment === "minute"
                ? { ...draft, minute: first ? 0 : Math.floor(59 / step) * step }
                : segment === "second"
                  ? { ...draft, second: first ? 0 : 59 }
                  : { ...draft, period: (first ? "am" : "pm") as Period },
          );
          return;
        }
        case "Backspace":
        case "Delete":
          event.preventDefault();
          setPending(null);
          commit({ ...draft, [draftKey[segment]]: undefined });
          return;
        case ":":
        case ".":
        case ",":
        case " ":
          event.preventDefault();
          setPending(null);
          focusSegment(segments[index + 1]);
          return;
      }
      // A character the keyboard sent as itself. A mobile keyboard sends "Unidentified" and the text through
      // `onChange` instead, which is handled below; anything else typed is refused.
      if (key.length === 1 || key === "Process") {
        if (key === "Process") return;
        event.preventDefault();
        typeText(segment, key);
      }
    };

    // What a keyboard that doesn't report keys (a phone's), an autofill or a paste inserts: the text it added.
    const onSegmentChange = (event: ChangeEvent<HTMLInputElement>, segment: Segment) => {
      if (disabled || readOnly) return;
      const inserted = (event.nativeEvent as InputEvent).data ?? "";
      if (inserted) typeText(segment, inserted);
    };

    // A press on the field's own padding or on a colon (not on a segment or a button) goes to the nearest segment, as in a
    // native time field, so the whole box is a target and the small segments are easy to hit.
    const onFieldMouseDown = (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      // The picker is portaled, but React still bubbles its events here: only a press inside the field's own box counts.
      if (disabled || !event.currentTarget.contains(target) || target.closest("input, button")) return;
      event.preventDefault();
      let nearest: Segment = segments[0]!;
      for (const segment of segments) {
        const element = segmentRefs.current[segment];
        if (element && element.getBoundingClientRect().left <= event.clientX) nearest = segment;
      }
      focusSegment(nearest);
    };

    const clear = () => {
      setPending(null);
      commit({});
      onClear?.();
      focusSegment("hour");
    };

    // Choosing from the picker: whatever the other segments are, a chosen time is a whole one, so the empty ones
    // take the first value they can (minutes 00, AM) rather than leaving the field half-filled.
    const pick = (segment: Segment, picked: number | Period) => {
      const next: TimeDraft = { ...draft, [draftKey[segment]]: picked };
      if (next.hour === undefined) next.hour = cycle === "12" ? 12 : 0;
      if (next.minute === undefined) next.minute = 0;
      if (showSeconds && next.second === undefined) next.second = 0;
      if (cycle === "12" && next.period === undefined) next.period = "am";
      setPending(null);
      commit(next);
    };

    const periodChars = Math.max([...labels.am].length, [...labels.pm].length);
    const segmentText = (segment: Segment): string => {
      if (segment === "period") return draft.period === undefined ? "" : draft.period === "am" ? labels.am : labels.pm;
      const current = draft[draftKey[segment]] as number | undefined;
      if (current === undefined) return pending?.segment === segment ? format(pending.digit) : "";
      return format(current);
    };

    const segmentSpec = (segment: Segment) => {
      const text = segmentText(segment);
      const range = segment === "hour" ? hourRange(cycle) : segment === "period" ? { min: 0, max: 1 } : { min: 0, max: 59 };
      const now =
        segment === "period"
          ? draft.period === undefined ? undefined : draft.period === "am" ? 0 : 1
          : (draft[draftKey[segment]] as number | undefined);
      return {
        label: labels[segment],
        min: range.min,
        max: segment === "minute" ? Math.floor(59 / step) * step : range.max,
        now,
        valueText: text === "" ? labels.empty : text,
        text,
      };
    };

    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a pointer convenience only, like clicking a <label>: a press on the box's padding is sent to the nearest segment, which is already fully keyboard-operable (each is a tab stop), so the group itself needs no role or key handling.
      <div
        {...props}
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-disabled={disabled || undefined}
        data-testid={dataTestId}
        style={style}
        onMouseDown={(event) => {
          onFieldMouseDown(event);
          props.onMouseDown?.(event);
        }}
        className={cx(styles.root, sizeClass[size], invalid && styles.error, disabled && styles.disabled, className)}
      >
        <div className={styles.segments}>
          {segments.map((segment, index) => {
            const spec = segmentSpec(segment);
            return (
              <Fragment key={segment}>
                {index > 0 && segment !== "period" && (
                  <span aria-hidden="true" className={styles.separator}>
                    :
                  </span>
                )}
                <input
                  ref={(element) => {
                    segmentRefs.current[segment] = element;
                  }}
                  // The id a label's `htmlFor` points at lives on the first segment.
                  id={index === 0 ? id : undefined}
                  type="text"
                  role="spinbutton"
                  inputMode={segment === "period" ? "text" : "numeric"}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={spec.label}
                  aria-valuemin={spec.min}
                  aria-valuemax={spec.max}
                  aria-valuenow={spec.now}
                  aria-valuetext={spec.valueText}
                  aria-invalid={invalid || undefined}
                  aria-required={required || undefined}
                  disabled={disabled}
                  readOnly={readOnly}
                  placeholder="––"
                  value={spec.text}
                  className={cx(styles.segment, segment === "period" && styles.period)}
                  style={segment === "period" ? ({ "--time-picker-period-chars": periodChars } as CSSProperties) : undefined}
                  onKeyDown={(event) => onSegmentKeyDown(event, segment)}
                  onChange={(event) => onSegmentChange(event, segment)}
                  onFocus={(event) => event.currentTarget.select()}
                  onBlur={() => setPending(null)}
                />
              </Fragment>
            );
          })}
        </div>
        {onClear && hasContent && !disabled && !readOnly && (
          <button
            type="button"
            className={cx(styles.iconButton, buttonClass[size])}
            aria-label={labels.clear}
            onClick={clear}
          >
            <Icon icon={XIcon} size={iconSizeFor[size]} tone="default" />
          </button>
        )}
        {showPicker && (
          <Popover open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className={cx(styles.iconButton, buttonClass[size])}
                aria-label={labels.openPicker}
                disabled={disabled || readOnly}
              >
                <Icon icon={ClockIcon} size={iconSizeFor[size]} tone="default" />
              </button>
            </Popover.Trigger>
            <Popover.Content
              align="end"
              hideArrow
              aria-label={labels.pickerName}
              className={styles.picker}
              onOpenAutoFocus={(event) => {
                // Focus goes to the chosen option (or the first) in the first column, not the panel itself.
                event.preventDefault();
                const target = (event.currentTarget as HTMLElement).querySelector<HTMLElement>('[role="option"][tabindex="0"]');
                target?.focus();
              }}
            >
              <TimePickerColumns
                draft={draft}
                cycle={cycle}
                showSeconds={showSeconds}
                step={step}
                min={minParts}
                max={maxParts}
                labels={labels}
                format={format}
                onPick={pick}
                onDone={() => setOpen(false)}
              />
            </Popover.Content>
          </Popover>
        )}
        {name && <input type="hidden" name={name} form={form} value={value} disabled={disabled} />}
      </div>
    );
  },
);
TimePicker.displayName = "TimePicker";
