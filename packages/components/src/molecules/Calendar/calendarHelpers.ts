import { formatDate, formatMonth, isoWeekNumber, parseDate, weekdayOf } from "../../internal/date/dateValue";
import type { CivilDate, DateMove } from "../../internal/date/dateValue";

/** Months counted from year 0: January of year 1 is 12, December 9999 is 119,999. */
export const FIRST_MONTH = 12;
export const LAST_MONTH = 9999 * 12 + 11;
/** At most this many months side by side. */
export const MAX_MONTHS = 4;
/** How far a finger must travel sideways, in pixels, to turn the month, and how much further than it travels up or down. */
export const SWIPE_DISTANCE = 48;
export const SWIPE_DOMINANCE = 2;
/** How far ahead of the start of a range the unavailable dates are looked for, when a range may not run over them. */
export const SCAN_DAYS = 732;

/** Today in the browser's own timezone, as `"YYYY-MM-DD"`. */
export function readClock(): string {
  const now = new Date();
  return formatDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}
export const subscribeToNothing = (): (() => void) => () => undefined;
export const noClockOnTheServer = (): undefined => undefined;

/** The month a calendar shows when nothing else says: this month in UTC, which a server and a browser agree on. */
export function utcMonth(): string {
  const now = new Date();
  return formatMonth(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

/** A string that is a real date, else `""`. */
export const dateOrNone = (value: unknown): string => (parseDate(value) ? (value as string) : "");

/** The ISO week number of a row of days: that of its Thursday, which is in the same week as most of the row. */
export const weekNumberOf = (week: CivilDate[]): number =>
  isoWeekNumber(week.find((civil) => weekdayOf(civil) === 4) ?? (week[0] as CivilDate));

/** The `"YYYY-MM"` of a month index (months counted from year 0). */
export const monthOfIndex = (index: number): string => formatMonth(Math.floor(index / 12), (index % 12) + 1);

/** A whole number of at least `least`, else `fallback`. */
export const wholeNumber = (value: unknown, least: number, fallback: number): number =>
  typeof value === "number" && Number.isInteger(value) && value >= least ? value : fallback;

export const keyMoves: Record<string, DateMove | undefined> = {
  ArrowLeft: "day-back",
  ArrowRight: "day-forward",
  ArrowUp: "week-back",
  ArrowDown: "week-forward",
  Home: "week-start",
  End: "week-end",
  PageUp: "month-back",
  PageDown: "month-forward",
};

export const dayElement = (target: EventTarget | null): HTMLButtonElement | null =>
  target instanceof Element ? target.closest<HTMLButtonElement>("button[data-date]") : null;

/** Says nothing: stands in for the announcer when the calendar's announcements are off. */
export const noSay = (): void => undefined;
