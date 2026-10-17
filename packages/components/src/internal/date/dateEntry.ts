import { daysInMonth, formatDate, formatMonth, isCivilDate } from "./dateValue";

// Typing into the three segments of a date field (`DatePicker`): the order they are written in, which digits finish a
// segment, how the arrow keys step one, and how the three numbers become the `"YYYY-MM-DD"` value. Pure, so the odd
// cases (a 31st in February, a year typed one digit at a time) can be listed and tested.

export type DateSegment = "day" | "month" | "year";

/** The order the segments are written in: day-month-year, month-day-year or year-month-day. */
export type DateFormat = "dmy" | "mdy" | "ymd";

/** What the field chooses: a whole date (`"YYYY-MM-DD"`), or only a month of a year (`"YYYY-MM"`, with no day segment). */
export type DateGranularity = "day" | "month";

/** What the three segments show, each a number or nothing yet. Not always a real date (a 31st in February). */
export interface DateDraft {
  day: number | undefined;
  month: number | undefined;
  year: number | undefined;
}

export const emptyDateDraft: DateDraft = { day: undefined, month: undefined, year: undefined };

const orders: Record<DateFormat, readonly DateSegment[]> = {
  dmy: ["day", "month", "year"],
  mdy: ["month", "day", "year"],
  ymd: ["year", "month", "day"],
};

/** The segments in the order a format writes them; an unknown format reads as month-day-year. Without days, the day goes. */
export function segmentsForFormat(format: DateFormat, granularity: DateGranularity = "day"): readonly DateSegment[] {
  const order = orders[format] ?? orders.mdy;
  return granularity === "month" ? order.filter((segment) => segment !== "day") : order;
}

/** How many digits a segment is drawn with once it is done. */
export const segmentWidth = (segment: DateSegment): number => (segment === "year" ? 4 : 2);

const MAX_YEAR = 9999;

/** The least and greatest a segment can be, given nothing about the others. */
export function segmentBounds(segment: DateSegment): { min: number; max: number } {
  if (segment === "day") return { min: 1, max: 31 };
  if (segment === "month") return { min: 1, max: 12 };
  return { min: 1, max: MAX_YEAR };
}

/** The draft a `"YYYY-MM-DD"` (or, by month, `"YYYY-MM"`) value stands for; a value that is not a real one is an empty draft. */
export function valueToDateDraft(value: string, granularity: DateGranularity = "day"): DateDraft {
  if (granularity === "month") {
    const month = /^(\d{4})-(\d{2})$/.exec(value);
    const year = month ? Number(month[1]) : 0;
    const number = month ? Number(month[2]) : 0;
    return year >= 1 && number >= 1 && number <= 12 ? { day: undefined, month: number, year } : emptyDateDraft;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return emptyDateDraft;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isCivilDate(date) ? { day: date.day, month: date.month, year: date.year } : emptyDateDraft;
}

/** The dates a draft is, as the value: `""` until all three are there and make a real date (the month and year, by month). */
export function dateDraftToValue(draft: DateDraft, granularity: DateGranularity = "day"): string {
  const { day, month, year } = draft;
  if (granularity === "month") return month === undefined || year === undefined ? "" : formatMonth(year, month);
  if (day === undefined || month === undefined || year === undefined) return "";
  const date = { year, month, day };
  return isCivilDate(date) ? formatDate(date) : "";
}

/** True when all three numbers are there but are not a real date (the 31st of February). */
export function isImpossibleDate(draft: DateDraft): boolean {
  const { day, month, year } = draft;
  if (day === undefined || month === undefined || year === undefined) return false;
  return !isCivilDate({ year, month, day });
}

/** True when any segment has something in it. */
export const hasDateContent = (draft: DateDraft): boolean =>
  draft.day !== undefined || draft.month !== undefined || draft.year !== undefined;

/** The most days the draft's month can have: its own when the month is known, a leap year's when the year is not. */
function dayLimit(draft: DateDraft): number {
  if (draft.month === undefined) return 31;
  return daysInMonth(draft.year ?? 2000, draft.month);
}

/** The least and greatest a segment can be given the other two: the day's greatest follows its month and year. */
export function segmentRange(draft: DateDraft, segment: DateSegment): { min: number; max: number } {
  const bounds = segmentBounds(segment);
  return segment === "day" ? { min: bounds.min, max: dayLimit(draft) } : bounds;
}

/** The digits typed into one segment so far: their number and how many there were ("007" is 7 over three digits). */
export interface DateBuffer {
  value: number;
  count: number;
}

export interface DateDigitResult {
  /** The segment's number now, or `undefined` while the digits typed don't make one yet (a lone 0). */
  value: number | undefined;
  /** The digits kept so the next one can finish the number; `undefined` when entry is done. */
  buffer: DateBuffer | undefined;
  /** True when this segment is finished and focus should move on. */
  done: boolean;
  /** A digit that did not fit this segment, to start the next one with (typing "3" then "5" in the day: day 3, then 5). */
  carry?: number;
}

/**
 * Feeds one digit into a segment. Day and month follow a native date field: a first digit that could still begin a
 * valid two-digit number waits for a second, one that could not is the whole number. The year takes up to four.
 */
export function enterDateDigit(segment: DateSegment, buffer: DateBuffer | undefined, digit: number): DateDigitResult {
  if (segment === "year") {
    const count = (buffer?.count ?? 0) + 1;
    const value = (buffer?.value ?? 0) * 10 + digit;
    const done = count >= 4;
    return { value: value >= 1 ? value : undefined, buffer: done ? undefined : { value, count }, done };
  }
  const { min, max } = segmentBounds(segment);
  if (buffer === undefined) {
    if (digit > Math.floor(max / 10)) return { value: digit >= min ? digit : undefined, buffer: undefined, done: true };
    return { value: digit >= min ? digit : undefined, buffer: { value: digit, count: 1 }, done: false };
  }
  const combined = buffer.value * 10 + digit;
  if (combined >= min && combined <= max) return { value: combined, buffer: undefined, done: true };
  if (buffer.value >= min) return { value: buffer.value, buffer: undefined, done: true, carry: digit };
  // A 0 waiting and another 0: still nothing valid; keep waiting.
  return { value: undefined, buffer: { value: combined, count: buffer.count + 1 }, done: false };
}

/**
 * One step of the arrow keys on a segment. A day and a month wrap (the 31st goes to the 1st, in a month that has
 * 31); an empty one starts at its least going up and its greatest going down. A year does not wrap: an empty year
 * starts from `fallbackYear`.
 */
export function stepDateSegment(draft: DateDraft, segment: DateSegment, direction: 1 | -1, fallbackYear: number): DateDraft {
  if (segment === "year") {
    const next = draft.year === undefined ? fallbackYear : draft.year + direction;
    return { ...draft, year: Math.min(MAX_YEAR, Math.max(1, next)) };
  }
  const { min } = segmentBounds(segment);
  const max = segment === "day" ? dayLimit(draft) : 12;
  const current = draft[segment];
  if (current === undefined) return { ...draft, [segment]: direction === 1 ? min : max };
  const next = current + direction;
  return { ...draft, [segment]: next > max ? min : next < min ? max : next };
}

/** `Home` and `End` on a segment: its least or its greatest. */
export function endOfDateSegment(draft: DateDraft, segment: DateSegment, end: "start" | "end"): DateDraft {
  const { min, max } = segmentBounds(segment);
  const limit = segment === "day" ? dayLimit(draft) : max;
  return { ...draft, [segment]: end === "start" ? min : limit };
}

/** The number drawn in a segment: padded to its width, or the digits typed so far while it is unfinished. */
export function padSegment(value: number, width: number, formatNumber: (n: number) => string): string {
  const digits = String(value);
  return formatNumber(0).repeat(Math.max(0, width - digits.length)) + [...digits].map((d) => formatNumber(Number(d))).join("");
}
