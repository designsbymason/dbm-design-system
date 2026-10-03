import { ClockIcon, XIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, mergeRefs } from "@dbm-design-system/primitives";
import { Fragment, forwardRef, useEffect, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { Icon } from "../../atoms/Icon";
import { Popover } from "../Popover";
import styles from "./TimePicker.module.css";
import type { TimePickerLabels, TimePickerProps, TimePickerSize } from "./TimePicker.types";
import { TimePickerColumns } from "./TimePickerColumns";
import { digitValue, enterDigit, periodFromLetter } from "../../internal/time/segmentEntry";
import {
  draftToParts,
  draftToValue,
  emptyDraft,
  formatTime,
  hourRange,
  isTimeAllowed,
  parseTime,
  pickIntoDraft,
  segmentsFor,
  stepSegment,
  valueToDraft,
} from "../../internal/time/timeValue";
import type { Period, Segment, TimeDraft, TimeParts } from "../../internal/time/timeValue";

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
  incomplete: "Enter a complete time",
  unavailable: "This time isn't available",
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

/** Something to clear: any number, or a period that isn't the empty field's own AM. */
const hasContentOf = (draft: TimeDraft, cycle: "12" | "24") =>
  draft.hour !== undefined ||
  draft.minute !== undefined ||
  draft.second !== undefined ||
  (draft.period !== undefined && draft.period !== emptyDraft(cycle).period);

/**
 * A time-of-day field: separate hour, minute, (second) and AM/PM segments you type into or step with the arrow
 * keys, and a popover of wheels to scroll or tap through with a pointer or a swipe. The value is a 24-hour string —
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
 * A form can use it as a native control: `required` stops a submit while the field is empty, and a half-filled or
 * unavailable time stops it too (see `required`). `onFocus`/`onBlur` fire for the field as a whole, not for each
 * segment, `commitOn` holds `onValueChange` back until the person is done, `isTimeDisabled` and `secondStep`
 * narrow what is available, `periodPosition` writes AM/PM first, and `openOnFocus` opens the picker on arrival.
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
      commitOn = "change",
      hourCycle = "12",
      periodPosition = "end",
      showSeconds = false,
      step: stepProp = 1,
      secondStep: secondStepProp = 1,
      min,
      max,
      isTimeDisabled,
      size = "md",
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      showPicker = true,
      openOnFocus = false,
      clearable,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      onClear,
      onFocus,
      onBlur,
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
    const secondStep = Number.isInteger(secondStepProp) && secondStepProp >= 1 && secondStepProp <= 59 ? secondStepProp : 1;
    const minParts = parseTime(min);
    const maxParts = parseTime(max);
    const periodFirst = cycle === "12" && periodPosition === "start";
    const segments = segmentsFor(cycle, showSeconds, periodFirst);
    const blocked = isTimeDisabled ? (parts: TimeParts) => isTimeDisabled(formatTime(parts, showSeconds)) : undefined;
    const rules = { min: minParts, max: maxParts, step, secondStep, blocked };

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (step !== stepProp) {
        console.warn(`TimePicker: \`step\` must be a whole number of minutes from 1 to 59; got ${String(stepProp)}, using 1.`);
      }
      if (secondStep !== secondStepProp) {
        console.warn(`TimePicker: \`secondStep\` must be a whole number of seconds from 1 to 59; got ${String(secondStepProp)}, using 1.`);
      }
      for (const [prop, text, parts] of [["min", min, minParts], ["max", max, maxParts]] as const) {
        if (text !== undefined && text !== "" && !parts) {
          console.warn(`TimePicker: \`${prop}\` must be "HH:mm" or "HH:mm:ss" (24-hour); got ${JSON.stringify(text)}, ignoring it.`);
        }
      }
      // Only the values that make a warning matter, not their identity on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stepProp, secondStepProp, min, max]);

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
    // With `commitOn` the segments run ahead of the value on purpose: `dirty` is an edit not yet reported.
    const [dirty, setDirty] = useState(false);
    const draftValue = draftToValue(draft, cycle, showSeconds);
    // A value that is no longer what the segments stand for (set from outside, or the hour cycle changed) wins, except
    // while an edit is being held back and nothing outside has changed. Adjusted while rendering, not in an effect,
    // so there is never a frame showing the old time.
    const syncKey = `${value}|${cycle}|${String(showSeconds)}`;
    const [seenKey, setSeenKey] = useState(syncKey);
    if (seenKey !== syncKey) {
      setSeenKey(syncKey);
      if (value !== draftValue) {
        setDraft(valueToDraft(value, cycle, showSeconds));
        setDirty(false);
      }
    } else if (!dirty && value !== draftValue) {
      setDraft(valueToDraft(value, cycle, showSeconds));
    }

    const [pending, setPending] = useState<{ segment: Segment; digit: number } | null>(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = (openProp ?? uncontrolledOpen) && !disabled && !readOnly;
    const setOpen = (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };

    const segmentRefs = useRef<Partial<Record<Segment, HTMLInputElement | null>>>({});
    const focusSegment = (segment: Segment | undefined) => {
      if (segment) segmentRefs.current[segment]?.focus();
    };

    useEffect(() => {
      if (autoFocus) segmentRefs.current[segments[0]!]?.focus();
      // On mount only, as a native `autoFocus` is.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // What handlers that outlive a render read: the latest of each, kept up to date after every render.
    const latest = useRef({ value, draft, open, dirty });
    useEffect(() => {
      latest.current = { value, draft, open, dirty };
    });

    const setHeld = (held: boolean) => {
      latest.current.dirty = held;
      setDirty(held);
    };

    // The one place `onValueChange` is called from. Comparing with the latest value (not the one this render saw) is
    // what keeps two commits in one event from reporting the same time twice.
    const report = (nextValue: string) => {
      if (nextValue === latest.current.value) return;
      latest.current.value = nextValue;
      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    };

    // `awaiting`: a digit has been typed that may still get a second one. `now`: an explicit action (the clear button, a
    // key) that is a decision, not an edit in progress, so it is never held back.
    const commit = (next: TimeDraft, { awaiting = false, now = false } = {}) => {
      latest.current.draft = next;
      setDraft(next);
      const nextValue = draftToValue(next, cycle, showSeconds);
      const hold =
        !now &&
        (commitOn === "blur" ||
          (commitOn === "complete" &&
            (awaiting || latest.current.open || (nextValue === "" && hasContentOf(next, cycle)))));
      setHeld(hold);
      if (!hold) report(nextValue);
    };

    // Reports whatever is being held, as it stands: what leaving the field, closing the picker or `Enter` does.
    const flush = () => {
      if (!latest.current.dirty) return;
      setHeld(false);
      report(draftToValue(latest.current.draft, cycle, showSeconds));
    };

    // The picker closing, however it was closed (also when `open` is controlled), is the end of choosing.
    useEffect(() => {
      if (!open) flush();
      // `flush` reads only refs and the cycle and seconds of this render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const format = (n: number) => (n < 10 ? formatNumber(0) : "") + formatNumber(n);

    const parts = draftToParts(draft, cycle, showSeconds);
    const outsideConstraints = parts !== undefined && !isTimeAllowed(parts, rules);
    const invalid = hasError || outsideConstraints;
    const hasContent = hasContentOf(draft, cycle);
    const showClear = (clearable ?? onClear !== undefined) && hasContent && !disabled && !readOnly;
    // What a form says when it is asked to submit: a time that isn't there yet, or one that isn't allowed.
    const validationMessage = outsideConstraints ? labels.unavailable : parts === undefined && hasContent ? labels.incomplete : "";
    const proxy = useRef<HTMLInputElement>(null);
    useEffect(() => {
      proxy.current?.setCustomValidity(validationMessage);
    }, [validationMessage]);

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
          if (period) {
            working = { ...working, period };
            // A period written first hands over to the hour once it is chosen, as a number segment does when it is full.
            const next = segments[segments.indexOf("period") + 1];
            if (next !== undefined) {
              current = next;
              carried = null;
              touched = false;
            }
          }
          continue;
        }
        let digit = digitValue(character);
        if (digit === undefined) {
          // A letter typed while a number is expected is the period's, once the numbers before it are done: "9:30p".
          const period = segments.includes("period") ? periodFromLetter(character, { am: labels.am, pm: labels.pm }) : undefined;
          if (period && !carried) {
            working = { ...working, period };
            // With the period last, what follows it is the period itself; written first, the number goes on where it was.
            if (!periodFirst) {
              current = "period";
              touched = true;
            }
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
      commit(working, { awaiting: carried !== null });
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
        case "Enter":
          // A native field reports its value on Enter; here it also ends a held edit.
          flush();
          return;
        case "Tab":
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
          commit(stepSegment(draft, segment, key === "ArrowUp" ? 1 : -1, cycle, step, secondStep));
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
                  ? { ...draft, second: first ? 0 : Math.floor(59 / secondStep) * secondStep }
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

    // The field as a whole, for `onFocus`/`onBlur` and `openOnFocus`: the group and the portaled picker are one thing, so
    // focus moving between their parts is neither arriving nor leaving.
    const group = useRef<HTMLDivElement | null>(null);
    const picker = useRef<HTMLDivElement | null>(null);
    const inside = useRef(false);
    // The picker was opened by arriving in the field, so focus has stayed on the segment and should stay there.
    const openedByFocus = useRef(false);
    const withinField = (node: EventTarget | null) =>
      node instanceof Node && (group.current?.contains(node) === true || picker.current?.contains(node) === true);

    const onGroupFocus = (event: FocusEvent<HTMLDivElement>) => {
      const segmentElements: unknown[] = Object.values(segmentRefs.current);
      // A segment reached from anywhere but another segment: from outside, from the field's buttons (Shift+Tab backwards
      // into the field lands on the picker button first) or from a click. Moving along the segments never reopens it.
      if (
        openOnFocus &&
        showPicker &&
        !disabled &&
        !readOnly &&
        !open &&
        segmentElements.includes(event.target) &&
        !segmentElements.includes(event.relatedTarget)
      ) {
        openedByFocus.current = true;
        setOpen(true);
      }
      if (inside.current) return;
      inside.current = true;
      onFocus?.(event);
    };

    const onGroupBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (withinField(event.relatedTarget)) return;
      inside.current = false;
      flush();
      onBlur?.(event);
    };

    const clear = () => {
      setPending(null);
      commit(emptyDraft(cycle), { now: true });
      onClear?.();
      focusSegment(segments[0]);
    };

    // Choosing from the picker: whatever the other segments are, a chosen time is a whole one, so the empty ones
    // take the first value they can (minutes 00, AM) rather than leaving the field half-filled.
    const pick = (segment: Segment, picked: number | Period) => {
      setPending(null);
      commit(pickIntoDraft(draft, segment, picked, cycle, showSeconds));
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
        max: segment === "minute" ? Math.floor(59 / step) * step : segment === "second" ? Math.floor(59 / secondStep) * secondStep : range.max,
        now,
        valueText: text === "" ? labels.empty : text,
        text,
      };
    };

    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a pointer convenience only, like clicking a <label>: a press on the box's padding is sent to the nearest segment, which is already fully keyboard-operable (each is a tab stop), so the group itself needs no role or key handling.
      <div
        {...props}
        ref={mergeRefs(ref, group)}
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
        onFocus={onGroupFocus}
        onBlur={onGroupBlur}
        className={cx(styles.root, sizeClass[size], invalid && styles.error, disabled && styles.disabled, className)}
      >
        <div className={styles.segments}>
          {segments.map((segment, index) => {
            const spec = segmentSpec(segment);
            return (
              <Fragment key={segment}>
                {index > 0 && segment !== "period" && segments[index - 1] !== "period" && (
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
                  inputMode={segment === "period" ? "text" : openOnFocus && showPicker ? "none" : "numeric"}
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
        {showClear && (
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
              ref={picker}
              align="end"
              hideArrow
              aria-label={labels.pickerName}
              className={styles.picker}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                // Opened by arriving in the field, focus stays on the segment being typed into; otherwise it goes to the
                // hours wheel (not the AM/PM one, even when that is drawn first), not the panel itself.
                if (openedByFocus.current) return;
                const wheels = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="listbox"]')];
                (wheels.find((wheel) => wheel.getAttribute("aria-label") === labels.hour) ?? wheels[0])?.focus();
              }}
              onCloseAutoFocus={(event) => {
                // Focus never left the segment, so there is nothing to give back to the button.
                if (openedByFocus.current) event.preventDefault();
                openedByFocus.current = false;
              }}
              onInteractOutside={(event) => {
                // With the picker opening on focus it sits open beside the segments: a click or Tab among them is not a
                // dismissal. Anything outside the field still is.
                if (openOnFocus && withinField(event.target)) event.preventDefault();
              }}
            >
              <TimePickerColumns
                draft={draft}
                cycle={cycle}
                showSeconds={showSeconds}
                rules={rules}
                periodFirst={periodFirst}
                labels={labels}
                format={format}
                onPick={pick}
                onDone={() => setOpen(false)}
              />
            </Popover.Content>
          </Popover>
        )}
        {/* The value a form submits and validates. A hidden input is never validated, so this is a time input that is only
            hidden from sight (and from assistive tech, which has the segments): `required` and the custom message above
            give a surrounding form its native checks. Arriving on it, which a browser does to show its message, sends
            focus to the segment that needs attention. */}
        <input
          ref={proxy}
          type="time"
          tabIndex={-1}
          aria-hidden="true"
          className={styles.proxy}
          name={name}
          form={form}
          value={value}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          onChange={() => {}}
          onFocus={() => {
            const empty = segments.find((segment) => segmentText(segment) === "");
            focusSegment(empty ?? segments[0]);
          }}
        />
      </div>
    );
  },
);
TimePicker.displayName = "TimePicker";
