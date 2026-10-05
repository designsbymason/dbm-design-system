import type { ComponentPropsWithoutRef, CSSProperties } from "react";

/**
 * The size of the calendar, on the standard 5-step scale (`05-component-api-conventions.md` §2). It sets
 * the size of a day's square (the same step as `IconButton`, so a day is as tall as a `Button` of that size)
 * and of the text in it.
 */
export type CalendarSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * What choosing a date means.
 *
 * - `"single"` (the default) — one date.
 * - `"range"` — a first date and a last: the first choice is the start, the second the end, and a third
 *   starts a new range.
 */
export type CalendarMode = "single" | "range";

/** The day a week starts on, as `Date#getDay` counts: 0 is Sunday, 1 Monday, … 6 Saturday. */
export type CalendarWeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A chosen range: the first and the last date as `"YYYY-MM-DD"` strings, `""` for one not chosen yet. A range
 * whose start is chosen and end isn't, `["2026-10-05", ""]`, is a range in progress.
 */
export type CalendarRangeValue = readonly [start: string, end: string];

/** The facts about one day that its accessible name is built from. All plain numbers. */
export interface CalendarDayInfo {
  /** The year, for example `2026`. */
  year: number;
  /** The month, 1 (January) to 12. */
  month: number;
  /** The day of the month, from 1. */
  day: number;
  /** The day of the week, 0 (Sunday) to 6 (Saturday). */
  weekday: number;
}

/**
 * Every piece of text the component supplies itself — accessible names, the month and weekday names, and
 * the month heading. English by default; pass your own to translate them.
 */
export interface CalendarLabels {
  /** The accessible name of the calendar as a whole. @default "Calendar" */
  calendar: string;
  /** The accessible name of the previous-month button. @default "Previous month" */
  previousMonth: string;
  /** The accessible name of the next-month button. @default "Next month" */
  nextMonth: string;
  /**
   * The twelve month names, January first, written in full. They make up the default heading and day names, so
   * translating these translates both.
   * @default ["January", "February", …, "December"]
   */
  months: readonly string[];
  /**
   * The seven weekday names, Sunday first (whichever day the week starts on), written in full. They name the
   * column headings and the days.
   * @default ["Sunday", "Monday", …, "Saturday"]
   */
  weekdays: readonly string[];
  /**
   * The seven weekday names as they are drawn in the column headings, Sunday first. Keep each one the start of
   * the full name in `weekdays`, so what a heading shows is part of what it is called.
   * @default ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
   */
  weekdaysShort: readonly string[];
  /**
   * The heading above the grid, and what is announced when the month changes, given the plain year and month
   * (1 to 12). Write the year with your own `formatNumber`.
   * @default `${months[month - 1]} ${year}`, the year written with `formatNumber`
   */
  monthYear: (year: number, month: number) => string;
  /**
   * The accessible name of a day, given the plain numbers. It should contain the number the day shows, as the
   * label-in-name rule expects, so write the day with your own `formatNumber`.
   * @default `${weekdays[weekday]}, ${months[month - 1]} ${day}, ${year}`, the day and year written with `formatNumber`
   */
  day: (info: CalendarDayInfo) => string;
  /** Added to the name of today's date. @default "today" */
  today: string;
  /** Added to the name of the first date of a range. @default "range start" */
  rangeStart: string;
  /** Added to the name of the last date of a range. @default "range end" */
  rangeEnd: string;
}

/** The props that single and range mode share. */
interface CalendarBaseProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "className" | "style" | "id" | "defaultValue" | "onChange" | "dir"
  > {
  /**
   * The month on show, as `"YYYY-MM"` — controlled. Pair with `onMonthChange` to update it, or the buttons and
   * keys that change month will appear frozen. Without it the calendar shows the chosen date's month, or the
   * month of `defaultMonth`, or the current month.
   */
  month?: string;
  /**
   * The month an *uncontrolled* calendar starts on, as `"YYYY-MM"`; it then tracks the month itself. Ignored
   * once `month` is also given.
   * @default the month of the chosen date, else the current month
   */
  defaultMonth?: string;
  /**
   * Called when the month on show changes — by the previous and next buttons, by Page Up and Page Down, or by
   * moving onto a date in another month — with the new month as `"YYYY-MM"`.
   */
  onMonthChange?: (month: string) => void;
  /**
   * The earliest date that can be chosen, as `"YYYY-MM-DD"`. Earlier dates are unavailable, the keys never move
   * focus before it, and the previous-month button is unavailable once the month on show holds it.
   */
  min?: string;
  /**
   * The latest date that can be chosen, as `"YYYY-MM-DD"`. The mirror of `min`.
   */
  max?: string;
  /**
   * A rule for dates that can't be chosen, given a date as `"YYYY-MM-DD"` — weekends, holidays, days that are
   * fully booked. They are drawn dimmed and marked unavailable, and can still be moved onto with the keyboard
   * (so the arrow keys never skip over them), but not chosen. Together with `min` and `max`.
   */
  isDateDisabled?: (date: string) => boolean;
  /**
   * The day a week starts on, 0 (Sunday) to 6 (Saturday). The columns, and Home and End, follow it. It is
   * explicit and never read from the browser's locale, so a server and a browser agree.
   * @default 0
   */
  weekStartsOn?: CalendarWeekStart;
  /**
   * Shows the days of the neighbouring months that fill the first and last weeks, dimmed. They can be chosen,
   * which moves the calendar to their month. With `false` those cells are left empty.
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * Today's date as `"YYYY-MM-DD"`, which is marked in the grid. Left out, the calendar reads the clock in the
   * browser once it has mounted, so a server-rendered page and its first client render agree. Pass it to mark
   * another day as today, or to fix the date in a test or a screenshot.
   */
  today?: string;
  /**
   * The size of the calendar. A day is a square as tall as an `IconButton` of this step, and the calendar is
   * seven of them wide (less, on a screen narrower than that).
   * @default "md"
   */
  size?: CalendarSize;
  /**
   * Makes every date and both month buttons unavailable. They stay focusable (they are `aria-disabled` rather
   * than natively disabled), so keyboard focus isn't lost.
   * @default false
   */
  disabled?: boolean;
  /**
   * Shows the chosen date or range but doesn't let it change. Moving between months and moving focus over the
   * dates still work.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Moves keyboard focus to the date that Tab would land on, when the calendar mounts. As a calendar is a grid
   * of buttons, React's own `autoFocus` has nothing to act on.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * Announces the new month to screen readers whenever the month on show changes — "November 2026" — through a
   * visually hidden status region. Set it to `false` if your own content already announces the change.
   * @default true
   */
  announce?: boolean;
  /**
   * The reading direction the calendar is drawn in. It is passed on and defaulted, not read from the page: under
   * `"rtl"` the first day of the week is at the right, the month buttons and their arrows swap sides, and the
   * left and right arrow keys follow the picture.
   * @default "ltr"
   */
  dir?: "ltr" | "rtl";
  /**
   * The text the component supplies itself — accessible names, month and weekday names, the heading. Any you
   * leave out keep their English default.
   */
  labels?: Partial<CalendarLabels>;
  /**
   * How a day or a year is written, for a language or region whose numerals differ from the plain 5 and 2026:
   * given a number, returns the text to show. Used for the number in every day, the year in the heading and, by
   * the default labels, in the accessible names, so what a day shows is always contained in its name. For example
   * `new Intl.NumberFormat("ar-EG").format`. Your own `labels` functions are given the plain numbers.
   * @default (value) => String(value)
   */
  formatNumber?: (value: number) => string;
  /** An accessible name for the calendar. Defaults to `labels.calendar` ("Calendar"). */
  "aria-label"?: string;
  /** The id of an element that names the calendar; takes the place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Additional CSS classes, applied to the outermost element. */
  className?: string;
  /** Inline styles, merged onto the outermost element. */
  style?: CSSProperties;
  /** A DOM id, applied to the outermost element. */
  id?: string;
  /** Test identifier, rendered as the DOM `data-testid` attribute on the outermost element. */
  "data-testid"?: string;
}

/** `Calendar` choosing one date. */
export interface CalendarSingleProps extends CalendarBaseProps {
  /**
   * What choosing a date means. A single date is the default.
   * @default "single"
   */
  mode?: "single";
  /**
   * The chosen date as `"YYYY-MM-DD"`, `""` for none — controlled. Pair with `onValueChange` to update it, or
   * the calendar will appear frozen. A value that isn't a real date reads as none, with a warning in
   * development.
   */
  value?: string;
  /**
   * The date an *uncontrolled* calendar starts with, as `"YYYY-MM-DD"`; it then tracks the choice itself.
   * Ignored once `value` is also given.
   * @default ""
   */
  defaultValue?: string;
  /**
   * Called when a date is chosen, with it as `"YYYY-MM-DD"`. Not called for the date that is already chosen,
   * or when `disabled`, `readOnly` or the rules make the date unavailable.
   */
  onValueChange?: (value: string) => void;
}

/** `Calendar` choosing a first and a last date. */
export interface CalendarRangeProps extends CalendarBaseProps {
  /** Chooses a range: the first date is the start, the second the end. */
  mode: "range";
  /**
   * The chosen range as `[start, end]` of `"YYYY-MM-DD"` strings, `""` for an end not chosen yet — controlled.
   * Pair with `onValueChange`. A range whose end is before its start is shown as it is.
   */
  value?: CalendarRangeValue;
  /**
   * The range an *uncontrolled* calendar starts with. Ignored once `value` is also given.
   * @default ["", ""]
   */
  defaultValue?: CalendarRangeValue;
  /**
   * Called each time a date is chosen, with the range so far: `[start, ""]` after the first choice and
   * `[start, end]` after the second. A choice before the start of a range in progress replaces the start.
   */
  onValueChange?: (value: [start: string, end: string]) => void;
}

/** The props of `Calendar`: single-date props, or — with `mode="range"` — range props. */
export type CalendarProps = CalendarSingleProps | CalendarRangeProps;
