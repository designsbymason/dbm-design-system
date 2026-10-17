import { CalendarBlankIcon, XIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, mergeRefs } from "@dbm-design-system/primitives";
import { Fragment, forwardRef, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { Icon } from "../../atoms/Icon";
import {
  dateDraftToValue,
  emptyDateDraft,
  endOfDateSegment,
  enterDateDigit,
  hasDateContent,
  isImpossibleDate,
  padSegment,
  segmentRange,
  segmentWidth,
  segmentsForFormat,
  stepDateSegment,
  valueToDateDraft,
} from "../../internal/date/dateEntry";
import type { DateBuffer, DateDraft, DateSegment } from "../../internal/date/dateEntry";
import { parseDate } from "../../internal/date/dateValue";
import { digitValue } from "../../internal/time/segmentEntry";
import { Calendar } from "../../molecules/Calendar";
import { Popover } from "../../molecules/Popover";
import styles from "./DatePicker.module.css";
import type { DatePickerLabels, DatePickerProps, DatePickerSize } from "./DatePicker.types";

const defaultLabels: DatePickerLabels = {
  day: "Day",
  month: "Month",
  year: "Year",
  empty: "Empty",
  openPicker: "Choose date",
  pickerName: "Choose a date",
  clear: "Clear date",
  incomplete: "Enter a complete date",
  invalid: "This date doesn't exist",
  unavailable: "This date isn't available",
};

const sizeClass: Record<DatePickerSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const buttonClass: Record<DatePickerSize, string | undefined> = {
  xs: styles.buttonXs,
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
  xl: styles.buttonXl,
};

// `Input`'s own mapping: the icon is one step down from the field's size, so the button stays inside its row.
const iconSizeFor: Record<DatePickerSize, "xs" | "sm" | "md" | "lg"> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

/** The digits typed into a segment and not yet finished, kept so the next digit can complete the number. */
interface Pending {
  segment: DateSegment;
  buffer: DateBuffer;
}

/**
 * A date field: separate day, month and year segments you type into or step with the arrow keys, and a button
 * that opens a `Calendar` in a popover to pick with a pointer. The value is a `"YYYY-MM-DD"` string, the same
 * whichever order the segments are written in, so there is nothing to parse and it submits as it is.
 *
 * Typing follows a native date field: a digit that cannot start a two-digit number is the whole number and moves
 * on (a 4 in the day), one that can waits for the next, and the year takes four. `Backspace` clears a segment,
 * `ArrowUp`/`ArrowDown` step it (the day wraps within its month), `ArrowLeft`/`ArrowRight` move between segments,
 * `Home`/`End` go to its least and greatest, and `Alt`+`ArrowDown` opens the calendar. While a segment is empty,
 * or the three numbers are not a real date (the 31st of February), the value is `""`.
 *
 * A date outside `min`/`max`, or one `isDateDisabled` rules out, is flagged (`aria-invalid`, error styling) and
 * still reported, not refused — refusing a half-typed date would make the field fight the person — and the
 * calendar disables what cannot be reached. The order comes from `format`, never the browser's locale, and every
 * word the field writes is in `labels` (the month and weekday names are the calendar's own, through
 * `calendarProps`).
 *
 * A form can use it as a native control: `required` stops a submit while the field is empty, and a half-filled,
 * impossible or unavailable date stops it too. `onFocus`/`onBlur` fire for the field as a whole, and `commitOn`
 * holds `onValueChange` back until the person is done.
 *
 * `ref` forwards to the group element that holds the segments. The `id` goes on the first segment, which is what
 * a label's `htmlFor` should point at.
 *
 * @example
 * ```tsx
 * <DatePicker aria-label="Start date" defaultValue="2026-10-03" />
 * <DatePicker value={date} onValueChange={setDate} format="dmy" separator="." min="2026-01-01" />
 * <FormField label="Birthday">{(field) => <DatePicker {...field} format="ymd" />}</FormField>
 * ```
 */
export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      value: valueProp,
      defaultValue = "",
      onValueChange,
      commitOn = "change",
      format = "mdy",
      separator = "/",
      min,
      max,
      isDateDisabled,
      weekStartsOn,
      showTodayButton,
      today: todayProp,
      calendarProps,
      size = "md",
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      showPicker = true,
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
      dir,
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
    const segments = segmentsForFormat(format);
    const minDate = parseDate(min) ? min : undefined;
    const maxDate = parseDate(max) ? max : undefined;

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      for (const [prop, text, parsed] of [["min", min, minDate], ["max", max, maxDate]] as const) {
        if (text !== undefined && text !== "" && !parsed) {
          console.warn(`DatePicker: \`${prop}\` must be "YYYY-MM-DD"; got ${JSON.stringify(text)}, ignoring it.`);
        }
      }
      if (!["dmy", "mdy", "ymd"].includes(format)) {
        console.warn(`DatePicker: \`format\` must be "dmy", "mdy" or "ymd"; got ${JSON.stringify(format)}, using "mdy".`);
      }
      // Only the values that make a warning matter, not their identity on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [min, max, format]);

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (ariaLabel || ariaLabelledBy) return;
      console.warn(
        "DatePicker: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label (or put it in a `FormField`), so assistive tech has something to announce for the group of segments.",
      );
      // Once per mount: the point is catching the omission, not repeating it on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The committed value, and what the segments show, which can be ahead of it (a segment emptied, a date half-typed).
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const isControlled = valueProp !== undefined;
    const rawValue = isControlled ? valueProp : uncontrolledValue;
    const value = dateDraftToValue(valueToDateDraft(rawValue));
    const [draft, setDraft] = useState<DateDraft>(() => valueToDateDraft(rawValue));
    // With `commitOn` the segments run ahead of the value on purpose: `dirty` is an edit not yet reported.
    const [dirty, setDirty] = useState(false);
    const draftValue = dateDraftToValue(draft);
    // A value that is no longer what the segments stand for (set from outside) wins, except while an edit is being
    // held back and nothing outside has changed. Adjusted while rendering, not in an effect, so there is never a
    // frame showing the old date.
    const [seenValue, setSeenValue] = useState(value);
    if (seenValue !== value) {
      setSeenValue(value);
      if (value !== draftValue) {
        setDraft(valueToDateDraft(value));
        setDirty(false);
      }
    } else if (!dirty && value !== draftValue) {
      setDraft(valueToDateDraft(value));
    }

    const [pending, setPending] = useState<Pending | null>(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = (openProp ?? uncontrolledOpen) && !disabled && !readOnly && showPicker;
    const setOpen = (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };

    const segmentRefs = useRef<Partial<Record<DateSegment, HTMLInputElement | null>>>({});
    const focusSegment = (segment: DateSegment | undefined) => {
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
    // what keeps two commits in one event from reporting the same date twice.
    const report = (nextValue: string) => {
      if (nextValue === latest.current.value) return;
      latest.current.value = nextValue;
      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    };

    // `awaiting`: a digit has been typed that may still get another. `now`: an explicit action (the clear button, a day
    // chosen in the calendar, a key) that is a decision, not an edit in progress, so it is never held back.
    const commit = (next: DateDraft, { awaiting = false, now = false } = {}) => {
      latest.current.draft = next;
      setDraft(next);
      const nextValue = dateDraftToValue(next);
      const hold =
        !now &&
        (commitOn === "blur" ||
          (commitOn === "complete" && (awaiting || latest.current.open || (nextValue === "" && hasDateContent(next)))));
      setHeld(hold);
      if (!hold) report(nextValue);
    };

    // Reports whatever is being held, as it stands: what leaving the field, closing the calendar or `Enter` does.
    const flush = () => {
      if (!latest.current.dirty) return;
      setHeld(false);
      report(dateDraftToValue(latest.current.draft));
    };

    // The calendar closing, however it was closed (also when `open` is controlled), is the end of choosing.
    useEffect(() => {
      if (!open) flush();
      // `flush` reads only refs.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const outsideConstraints =
      dateDraftToValue(draft) !== "" &&
      ((minDate !== undefined && draftValue < minDate) ||
        (maxDate !== undefined && draftValue > maxDate) ||
        isDateDisabled?.(draftValue) === true);
    const impossible = isImpossibleDate(draft);
    const invalid = hasError || outsideConstraints || impossible;
    const hasContent = hasDateContent(draft);
    const showClear = (clearable ?? onClear !== undefined) && hasContent && !disabled && !readOnly;
    // What a form says when it is asked to submit: a date that is not there yet, not real, or not allowed.
    const validationMessage = impossible
      ? labels.invalid
      : outsideConstraints
        ? labels.unavailable
        : draftValue === "" && hasContent
          ? labels.incomplete
          : "";
    const proxy = useRef<HTMLInputElement>(null);
    useEffect(() => {
      proxy.current?.setCustomValidity(validationMessage);
    }, [validationMessage]);

    // Feeds typed text into the field, starting at `startSegment`: digits into the segments, and a separator to finish
    // the one being typed. One keystroke is one character; a phone's keyboard, an autofill or a paste can deliver
    // several at once ("03102026"), and each goes where the one before it left off.
    const typeText = (startSegment: DateSegment, text: string) => {
      let working = draft;
      let current = startSegment;
      let carried = pending;
      // Whether a digit has gone into `current` since focus arrived there: a separator only finishes a segment that has one.
      let touched = false;
      for (const character of text) {
        let digit = digitValue(character);
        if (digit === undefined) {
          // A separator finishes the segment being typed, if a digit has gone into it.
          const next = segments[segments.indexOf(current) + 1];
          if ((character === separator || /[\s/.,:-]/u.test(character)) && touched && next !== undefined) {
            current = next;
            carried = null;
            touched = false;
          }
          continue;
        }
        for (;;) {
          const buffer = carried?.segment === current ? carried.buffer : undefined;
          const result = enterDateDigit(current, buffer, digit);
          working = { ...working, [current]: result.value };
          touched = true;
          if (!result.done) {
            carried = result.buffer === undefined ? null : { segment: current, buffer: result.buffer };
            break;
          }
          carried = null;
          const next = segments[segments.indexOf(current) + 1];
          if (next === undefined) break;
          current = next;
          touched = false;
          if (result.carry !== undefined) {
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

    const fallbackYear = () => parseDate(todayProp)?.year ?? new Date().getUTCFullYear();

    const onSegmentKeyDown = (event: KeyboardEvent<HTMLInputElement>, segment: DateSegment) => {
      const key = event.key;
      const editable = !disabled && !readOnly;
      if (event.altKey && key === "ArrowDown") {
        event.preventDefault();
        if (showPicker && editable) setOpen(true);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const index = segments.indexOf(segment);
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
          commit(stepDateSegment(draft, segment, key === "ArrowUp" ? 1 : -1, fallbackYear()));
          return;
        case "Home":
        case "End":
          event.preventDefault();
          setPending(null);
          commit(endOfDateSegment(draft, segment, key === "Home" ? "start" : "end"));
          return;
        case "Backspace":
        case "Delete":
          event.preventDefault();
          setPending(null);
          commit({ ...draft, [segment]: undefined });
          return;
      }
      // A separator finishes the segment, whether or not a digit was typed in it, as in a native date field.
      if (key === separator || key.length === 1 && /[\s/.,:-]/u.test(key)) {
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

    // What a keyboard that does not report keys (a phone's), an autofill or a paste inserts: the text it added.
    const onSegmentChange = (event: ChangeEvent<HTMLInputElement>, segment: DateSegment) => {
      if (disabled || readOnly) return;
      const inserted = (event.nativeEvent as InputEvent).data ?? "";
      if (inserted) typeText(segment, inserted);
    };

    // A press on the field's own padding or on a separator (not on a segment or a button) goes to the nearest segment,
    // as in a native date field, so the whole box is a target and the small segments are easy to hit.
    const onFieldMouseDown = (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      // The calendar is portaled, but React still bubbles its events here: only a press inside the field's own box counts.
      if (disabled || !event.currentTarget.contains(target) || target.closest("input, button")) return;
      event.preventDefault();
      let nearest: DateSegment = segments[0]!;
      for (const segment of segments) {
        const element = segmentRefs.current[segment];
        if (element && element.getBoundingClientRect().left <= event.clientX) nearest = segment;
      }
      focusSegment(nearest);
    };

    // The field as a whole, for `onFocus`/`onBlur`: the group and the portaled calendar are one thing, so focus moving
    // between their parts is neither arriving nor leaving.
    const group = useRef<HTMLDivElement | null>(null);
    const panel = useRef<HTMLDivElement | null>(null);
    const inside = useRef(false);
    const withinField = (node: EventTarget | null) =>
      node instanceof Node && (group.current?.contains(node) === true || panel.current?.contains(node) === true);

    const onGroupFocus = (event: FocusEvent<HTMLDivElement>) => {
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
      commit(emptyDateDraft, { now: true });
      onClear?.();
      focusSegment(segments[0]);
    };

    // A day chosen in the calendar fills all three segments at once and ends the choosing.
    const pick = (picked: string) => {
      setPending(null);
      commit(valueToDateDraft(picked), { now: true });
      setOpen(false);
    };

    const segmentText = (segment: DateSegment): string => {
      if (pending?.segment === segment) return padSegment(pending.buffer.value, pending.buffer.count, formatNumber);
      const current = draft[segment];
      return current === undefined ? "" : padSegment(current, segmentWidth(segment), formatNumber);
    };

    const segmentSpec = (segment: DateSegment) => {
      const text = segmentText(segment);
      const { min: rangeMin, max: rangeMax } = segmentRange(draft, segment);
      return {
        label: labels[segment],
        min: rangeMin,
        max: rangeMax,
        now: draft[segment],
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
        dir={dir}
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
                {index > 0 && (
                  <span aria-hidden="true" className={styles.separator}>
                    {separator}
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
                  inputMode="numeric"
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
                  placeholder={segment === "year" ? "––––" : "––"}
                  value={spec.text}
                  className={cx(styles.segment, segment === "year" && styles.year)}
                  onKeyDown={(event) => onSegmentKeyDown(event, segment)}
                  onChange={(event) => onSegmentChange(event, segment)}
                  onFocus={(event) => event.currentTarget.select()}
                  // Only this segment's own unfinished digits: focus moving on to the next segment must not wipe the digit just carried into it.
                  onBlur={() => setPending((current) => (current?.segment === segment ? null : current))}
                />
              </Fragment>
            );
          })}
        </div>
        {showClear && (
          <button type="button" className={cx(styles.iconButton, buttonClass[size])} aria-label={labels.clear} onClick={clear}>
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
                <Icon icon={CalendarBlankIcon} size={iconSizeFor[size]} tone="default" />
              </button>
            </Popover.Trigger>
            <Popover.Content
              ref={panel}
              align="end"
              hideArrow
              aria-label={labels.pickerName}
              className={styles.panel}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                // Focus goes to the day Tab would land on (the chosen one, else today), not to the panel itself.
                (event.currentTarget as HTMLElement).querySelector<HTMLElement>('button[data-date][tabindex="0"]')?.focus();
              }}
            >
              <Calendar
                {...calendarProps}
                value={draftValue}
                onValueChange={pick}
                min={minDate}
                max={maxDate}
                isDateDisabled={isDateDisabled}
                weekStartsOn={weekStartsOn}
                showTodayButton={showTodayButton}
                today={todayProp}
                dir={dir}
                formatNumber={formatNumber}
              />
            </Popover.Content>
          </Popover>
        )}
        {/* The value a form submits and validates. A hidden input is never validated, so this is a date input that is only
            hidden from sight (and from assistive tech, which has the segments): `required` and the custom message above
            give a surrounding form its native checks. Arriving on it, which a browser does to show its message, sends
            focus to the segment that needs attention. */}
        <input
          ref={proxy}
          type="date"
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
DatePicker.displayName = "DatePicker";
