import { useEffect, useRef, useState } from "react";
import { dateDraftToValue, enterDateDigit, hasDateContent, valueToDateDraft } from "../../internal/date/dateEntry";
import type { DateBuffer, DateDraft, DateGranularity, DateSegment } from "../../internal/date/dateEntry";
import { digitValue } from "../../internal/time/segmentEntry";
import type { DatePickerCommitOn } from "./DatePicker.types";

/** The digits typed into a segment and not yet finished, kept so the next digit can complete the number. */
export interface PendingDigits {
  segment: DateSegment;
  buffer: DateBuffer;
}

export interface DatePickerValueOptions {
  /** The controlled value, or `undefined` for an uncontrolled field. */
  value: string | undefined;
  /** The initial value of an uncontrolled field. */
  defaultValue: string;
  /** Called with the new value whenever it changes (once per change, and held back by `commitOn`). */
  onValueChange: ((value: string) => void) | undefined;
  granularity: DateGranularity;
  commitOn: DatePickerCommitOn;
  /** Whether the calendar is open, which `commitOn="complete"` holds the report back for. */
  open: boolean;
  /** The segments in the order they are written, for typing a date through them. */
  segments: readonly DateSegment[];
  /** The text drawn between the segments, which a typed or pasted copy of it finishes a segment with. */
  separator: string;
}

/**
 * What the date field holds and when it says so: the committed value, the three numbers the segments show (which can
 * run ahead of it while an edit is held back by `commitOn`, or half-typed), and the one place `onValueChange` is
 * called from. Also the typing itself: digits and separators into the segments, one character at a time or a whole
 * pasted string, threading the unfinished digits through it.
 */
export function useDatePickerValue({
  value: valueProp,
  defaultValue,
  onValueChange,
  granularity,
  commitOn,
  open,
  segments,
  separator,
}: DatePickerValueOptions) {
  const toDraft = (text: string) => valueToDateDraft(text, granularity);
  const toValue = (from: DateDraft) => dateDraftToValue(from, granularity);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = valueProp !== undefined;
  const rawValue = isControlled ? valueProp : uncontrolledValue;
  const value = toValue(toDraft(rawValue));

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (rawValue !== "" && value === "") {
      console.warn(
        `DatePicker: ${JSON.stringify(rawValue)} is not a ${granularity === "month" ? '"YYYY-MM"' : '"YYYY-MM-DD"'} date, which is what a field chosen ${granularity === "month" ? "by month" : "by day"} takes, so the field is empty.`,
      );
    }
  }, [rawValue, value, granularity]);

  const [draft, setDraft] = useState<DateDraft>(() => toDraft(rawValue));
  // With `commitOn` the segments run ahead of the value on purpose: `dirty` is an edit not yet reported.
  const [dirty, setDirty] = useState(false);
  const draftValue = toValue(draft);
  // A value that is no longer what the segments stand for (set from outside) wins, except while an edit is being held
  // back and nothing outside has changed. Adjusted while rendering, not in an effect, so there is never a frame showing
  // the old date.
  const [seenValue, setSeenValue] = useState(value);
  if (seenValue !== value) {
    setSeenValue(value);
    if (value !== draftValue) {
      setDraft(toDraft(value));
      setDirty(false);
    }
  } else if (!dirty && value !== draftValue) {
    setDraft(toDraft(value));
  }

  const [pending, setPending] = useState<PendingDigits | null>(null);

  // What handlers that outlive a render read: the latest of each, kept up to date after every render.
  const latest = useRef({ value, draft, open, dirty });
  useEffect(() => {
    latest.current = { value, draft, open, dirty };
  });

  const setHeld = (held: boolean) => {
    latest.current.dirty = held;
    setDirty(held);
  };

  // The one place `onValueChange` is called from. Comparing with the latest value (not the one this render saw) is what
  // keeps two commits in one event from reporting the same date twice.
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
    const nextValue = toValue(next);
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
    report(toValue(latest.current.draft));
  };

  // The calendar closing, however it was closed (also when `open` is controlled), is the end of choosing.
  useEffect(() => {
    if (!open) flush();
    // `flush` reads only refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Feeds typed text into the field, starting at `startSegment`: digits into the segments, and a separator to finish the
  // one being typed. One keystroke is one character; a phone's keyboard, an autofill or a paste can deliver several at
  // once ("03102026"), and each goes where the one before it left off. Returns the segment focus belongs on afterwards.
  const typeText = (startSegment: DateSegment, text: string): DateSegment => {
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
    return current;
  };

  return { value, draft, draftValue, pending, setPending, commit, flush, typeText, toDraft };
}
