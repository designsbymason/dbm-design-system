// The date model behind `Calendar` (and, later, the date pickers): a calendar date is the string
// `"YYYY-MM-DD"`, and every function here is pure. A date with no time of day has no timezone, so
// nothing here reads the clock or builds a local `Date`: the arithmetic runs on UTC, where a day is
// always 24 hours, and the only place a clock is read is the caller's choice of "today".

/** A calendar date taken apart: `month` runs 1 to 12, `day` from 1. */
export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

/** 0 is Sunday, as `Date#getUTCDay` counts. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

const pad = (value: number, length: number): string => String(value).padStart(length, "0");

/** The number of days in a month of a year (February by the Gregorian leap-year rule). */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** A real date: a year of 1 to 9999, a month of 1 to 12 and a day that month has. */
export function isCivilDate(date: CivilDate): boolean {
  return (
    Number.isInteger(date.year) &&
    Number.isInteger(date.month) &&
    Number.isInteger(date.day) &&
    date.year >= 1 &&
    date.year <= 9999 &&
    date.month >= 1 &&
    date.month <= 12 &&
    date.day >= 1 &&
    date.day <= daysInMonth(date.year, date.month)
  );
}

/** `"2026-10-05"` as a date, or `null` for anything else: another shape, or a day the calendar doesn't have. */
export function parseDate(value: unknown): CivilDate | null {
  if (typeof value !== "string") return null;
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isCivilDate(date) ? date : null;
}

/** `"2026-10"` as the year and month, or `null`. */
export function parseMonth(value: unknown): { year: number; month: number } | null {
  if (typeof value !== "string") return null;
  const match = MONTH_PATTERN.exec(value);
  if (!match) return null;
  const month = { year: Number(match[1]), month: Number(match[2]) };
  return month.year >= 1 && month.month >= 1 && month.month <= 12 ? month : null;
}

/** A date as `"YYYY-MM-DD"`. */
export function formatDate(date: CivilDate): string {
  return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;
}

/** A year and month as `"YYYY-MM"`. */
export function formatMonth(year: number, month: number): string {
  return `${pad(year, 4)}-${pad(month, 2)}`;
}

/** Days since 1970-01-01 (negative before it). UTC, so every day is the same length. */
function toDayNumber(date: CivilDate): number {
  const utc = new Date(0);
  utc.setUTCFullYear(date.year, date.month - 1, date.day);
  return Math.round(utc.getTime() / 86_400_000);
}

function fromDayNumber(dayNumber: number): CivilDate {
  const utc = new Date(dayNumber * 86_400_000);
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

/** The day of the week of a date, 0 (Sunday) to 6 (Saturday). */
export function weekdayOf(date: CivilDate): Weekday {
  // 1970-01-01 was a Thursday.
  return ((((toDayNumber(date) + 4) % 7) + 7) % 7) as Weekday;
}

/** The date `days` after (or, negative, before) a date. Stays within the calendar's years, 1 to 9999. */
export function addDays(date: CivilDate, days: number): CivilDate {
  return clampToCalendar(fromDayNumber(toDayNumber(date) + days));
}

/** The same day of the month `months` later (or earlier), or the month's last day when it has no such day. */
export function addMonths(date: CivilDate, months: number): CivilDate {
  const total = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  return clampToCalendar({ year, month, day: Math.min(date.day, daysInMonth(Math.max(year, 1), month)) });
}

/** The same day of the month `years` later (or earlier), 29 February becoming 28 February in a common year. */
export function addYears(date: CivilDate, years: number): CivilDate {
  return addMonths(date, years * 12);
}

function clampToCalendar(date: CivilDate): CivilDate {
  if (date.year < 1) return { year: 1, month: 1, day: 1 };
  if (date.year > 9999) return { year: 9999, month: 12, day: 31 };
  return date;
}

/** Negative before, zero equal, positive after. Compares whole dates, so a day and its string agree. */
export function compareDates(a: CivilDate, b: CivilDate): number {
  return toDayNumber(a) - toDayNumber(b);
}

/** Whole days from `from` to `to`. */
export function daysBetween(from: CivilDate, to: CivilDate): number {
  return toDayNumber(to) - toDayNumber(from);
}

/**
 * The weeks that show a month, always six of seven days (42 dates), so the grid keeps one height whichever
 * month it shows. The first week starts on `weekStartsOn`; the days before the month and after it belong to
 * the neighbouring months.
 */
export function monthGrid(year: number, month: number, weekStartsOn: Weekday): CivilDate[][] {
  const first: CivilDate = { year, month, day: 1 };
  const lead = (weekdayOf(first) - weekStartsOn + 7) % 7;
  const start = toDayNumber(first) - lead;
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => fromDayNumber(start + week * 7 + day)),
  );
}

/** The date a key press moves to from `date`, or `null` for a key that doesn't move. `weekStartsOn` places Home and End. */
export type DateMove = "day-back" | "day-forward" | "week-back" | "week-forward" | "week-start" | "week-end" | "month-back" | "month-forward" | "year-back" | "year-forward";

export function moveDate(date: CivilDate, move: DateMove, weekStartsOn: Weekday): CivilDate {
  switch (move) {
    case "day-back":
      return addDays(date, -1);
    case "day-forward":
      return addDays(date, 1);
    case "week-back":
      return addDays(date, -7);
    case "week-forward":
      return addDays(date, 7);
    case "week-start":
      return addDays(date, -((weekdayOf(date) - weekStartsOn + 7) % 7));
    case "week-end":
      return addDays(date, 6 - ((weekdayOf(date) - weekStartsOn + 7) % 7));
    case "month-back":
      return addMonths(date, -1);
    case "month-forward":
      return addMonths(date, 1);
    case "year-back":
      return addYears(date, -1);
    case "year-forward":
      return addYears(date, 1);
  }
}

/**
 * The ISO 8601 week number (1 to 53) of the week a date is in, where a week runs Monday to Sunday and belongs to the
 * year that holds its Thursday. For a row of days that starts on another day, pass any date in it that is a Thursday.
 */
export function isoWeekNumber(date: CivilDate): number {
  const isoWeekday = weekdayOf(date) === 0 ? 7 : weekdayOf(date);
  const thursday = addDays(date, 4 - isoWeekday);
  return Math.floor(daysBetween({ year: thursday.year, month: 1, day: 1 }, thursday) / 7) + 1;
}
