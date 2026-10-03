// The time model behind `TimePicker`: pure functions, no React. A value is a 24-hour
// string, "HH:mm" (or "HH:mm:ss" when seconds are shown); what the field *shows* is a
// draft of separate segments, because a person types one segment at a time and the
// field spends most of its life with some of them still empty.

export type HourCycle = "12" | "24";
export type Period = "am" | "pm";
export type Segment = "hour" | "minute" | "second" | "period";

/** A complete time of day, in 24-hour terms. */
export interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
}

/** What the segments show: the hour in the field's own cycle (1–12 or 0–23), any of them empty. */
export interface TimeDraft {
  hour?: number | undefined;
  minute?: number | undefined;
  second?: number | undefined;
  period?: Period | undefined;
}

const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Reads "HH:mm" or "HH:mm:ss"; anything else (or a field out of range) is `undefined`. */
export function parseTime(value: string | null | undefined): TimeParts | undefined {
  if (typeof value !== "string") return undefined;
  const match = TIME_PATTERN.exec(value);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  if (hours > 23 || minutes > 59 || seconds > 59) return undefined;
  return { hours, minutes, seconds };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Writes the 24-hour string: "HH:mm", or "HH:mm:ss" with `showSeconds`. */
export function formatTime(parts: TimeParts, showSeconds: boolean): string {
  const base = `${pad(parts.hours)}:${pad(parts.minutes)}`;
  return showSeconds ? `${base}:${pad(parts.seconds)}` : base;
}

/** Negative, zero or positive, like a sort comparator. */
export function compareTime(a: TimeParts, b: TimeParts): number {
  return a.hours * 3600 + a.minutes * 60 + a.seconds - (b.hours * 3600 + b.minutes * 60 + b.seconds);
}

/** The lowest and highest hour a segment can hold in a cycle. */
export function hourRange(cycle: HourCycle): { min: number; max: number } {
  return cycle === "12" ? { min: 1, max: 12 } : { min: 0, max: 23 };
}

/** The segments a field shows, in order. */
export function segmentsFor(cycle: HourCycle, showSeconds: boolean): Segment[] {
  const segments: Segment[] = ["hour", "minute"];
  if (showSeconds) segments.push("second");
  if (cycle === "12") segments.push("period");
  return segments;
}

/** A complete time as a draft: 15:05 in the 12-hour cycle is 3, 5, pm. */
export function partsToDraft(parts: TimeParts, cycle: HourCycle, showSeconds: boolean): TimeDraft {
  const draft: TimeDraft = { minute: parts.minutes };
  if (showSeconds) draft.second = parts.seconds;
  if (cycle === "24") {
    draft.hour = parts.hours;
  } else {
    draft.hour = parts.hours % 12 === 0 ? 12 : parts.hours % 12;
    draft.period = parts.hours < 12 ? "am" : "pm";
  }
  return draft;
}

/** The time a draft stands for, or `undefined` while any segment the field shows is still empty. */
export function draftToParts(draft: TimeDraft, cycle: HourCycle, showSeconds: boolean): TimeParts | undefined {
  const { hour, minute, second, period } = draft;
  if (hour === undefined || minute === undefined) return undefined;
  if (showSeconds && second === undefined) return undefined;
  let hours = hour;
  if (cycle === "12") {
    if (period === undefined) return undefined;
    hours = (hour % 12) + (period === "pm" ? 12 : 0);
  }
  return { hours, minutes: minute, seconds: showSeconds ? (second ?? 0) : 0 };
}

/** The string a draft stands for: "" while it is incomplete. */
export function draftToValue(draft: TimeDraft, cycle: HourCycle, showSeconds: boolean): string {
  const parts = draftToParts(draft, cycle, showSeconds);
  return parts ? formatTime(parts, showSeconds) : "";
}

/**
 * What an empty field shows: nothing in the numbers, and in the 12-hour cycle AM, so a cleared field (and a new one) reads
 * "-- : -- AM" rather than leaving the period to be chosen before a time can be complete.
 */
export function emptyDraft(cycle: HourCycle): TimeDraft {
  return cycle === "12" ? { period: "am" } : {};
}

/** A draft from a value string; the empty draft for "" or anything unreadable. */
export function valueToDraft(value: string | undefined, cycle: HourCycle, showSeconds: boolean): TimeDraft {
  const parts = parseTime(value);
  return parts ? partsToDraft(parts, cycle, showSeconds) : emptyDraft(cycle);
}

export interface TimeConstraints {
  min?: TimeParts | undefined;
  max?: TimeParts | undefined;
  /** Minutes between allowed minute values; 1 allows any. */
  step: number;
}

/** Whether a time satisfies the range and the minute step: what a native time input calls its validity. */
export function isTimeAllowed(parts: TimeParts, { min, max, step }: TimeConstraints): boolean {
  if (min && compareTime(parts, min) < 0) return false;
  if (max && compareTime(parts, max) > 0) return false;
  return parts.minutes % step === 0;
}

/** Steps a number within [min, max] by `delta`, wrapping at the ends. */
export function wrap(value: number, delta: number, min: number, max: number): number {
  const size = max - min + 1;
  return ((((value - min + delta) % size) + size) % size) + min;
}

/** The minute after (`direction` 1) or before (-1) `current` on a grid of `step`, wrapping; from nothing, the first or last. */
export function stepMinute(current: number | undefined, direction: 1 | -1, step: number): number {
  const last = Math.floor(59 / step) * step;
  if (current === undefined) return direction === 1 ? 0 : last;
  if (direction === 1) {
    const next = (Math.floor(current / step) + 1) * step;
    return next > 59 ? 0 : next;
  }
  const previous = (Math.ceil(current / step) - 1) * step;
  return previous < 0 ? last : previous;
}

/** Steps one segment of a draft up (1) or down (-1), by the arrow keys; empty segments start from an end. */
export function stepSegment(
  draft: TimeDraft,
  segment: Segment,
  direction: 1 | -1,
  cycle: HourCycle,
  step: number,
): TimeDraft {
  switch (segment) {
    case "hour": {
      const { min, max } = hourRange(cycle);
      const next = draft.hour === undefined ? (direction === 1 ? min : max) : wrap(draft.hour, direction, min, max);
      return { ...draft, hour: next };
    }
    case "minute":
      return { ...draft, minute: stepMinute(draft.minute, direction, step) };
    case "second": {
      const next = draft.second === undefined ? (direction === 1 ? 0 : 59) : wrap(draft.second, direction, 0, 59);
      return { ...draft, second: next };
    }
    case "period":
      return { ...draft, period: draft.period === undefined ? (direction === 1 ? "am" : "pm") : draft.period === "am" ? "pm" : "am" };
  }
}

const toSeconds = (parts: TimeParts) => parts.hours * 3600 + parts.minutes * 60 + parts.seconds;

/**
 * Whether any time from `from` to `to` (both included) is inside the `min`–`max` range, either end of which
 * may be absent. The picker uses it to disable an option no allowed time could still be reached through: an
 * hour is allowed if some time within it is.
 */
export function overlapsRange(from: TimeParts, to: TimeParts, min?: TimeParts, max?: TimeParts): boolean {
  if (min && toSeconds(to) < toSeconds(min)) return false;
  if (max && toSeconds(from) > toSeconds(max)) return false;
  return true;
}
