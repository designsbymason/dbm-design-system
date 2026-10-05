import { CaretLeftIcon, CaretRightIcon } from "@dbm-design-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement } from "@dbm-design-system/primitives";
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FocusEvent, KeyboardEvent, PointerEvent } from "react";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon/Icon.types";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import {
  formatDate,
  formatMonth,
  monthGrid,
  moveDate,
  parseDate,
  parseMonth,
  weekdayOf,
} from "../../internal/date/dateValue";
import type { CivilDate, DateMove, Weekday } from "../../internal/date/dateValue";
import styles from "./Calendar.module.css";
import type { CalendarLabels, CalendarProps, CalendarSize } from "./Calendar.types";

const sizeClass: Record<CalendarSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// The same icon step `Button` and `Pagination` use at each size.
const iconSize: Record<CalendarSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

const defaultMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const defaultWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const defaultWeekdaysShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/**
 * The English text, with the labels that depend on others (the heading and a day's name need the month
 * names) built from the names in force, so translating `months` translates them too.
 */
function buildLabels(format: (value: number) => string, overrides: Partial<CalendarLabels> | undefined): CalendarLabels {
  const merged = mergeDefined<CalendarLabels>(
    {
      calendar: "Calendar",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      months: defaultMonths,
      weekdays: defaultWeekdays,
      weekdaysShort: defaultWeekdaysShort,
      monthYear: () => "",
      day: () => "",
      today: "today",
      rangeStart: "range start",
      rangeEnd: "range end",
    },
    overrides,
  );
  // A list of the wrong length can't name every month or weekday; the English one stands in (a warning says so).
  if (merged.months.length !== 12) merged.months = defaultMonths;
  if (merged.weekdays.length !== 7) merged.weekdays = defaultWeekdays;
  if (merged.weekdaysShort.length !== 7) merged.weekdaysShort = defaultWeekdaysShort;
  const { months, weekdays } = merged;
  if (overrides?.monthYear === undefined) {
    merged.monthYear = (year, month) => `${months[month - 1] ?? ""} ${format(year)}`;
  }
  if (overrides?.day === undefined) {
    merged.day = ({ year, month, day, weekday }) =>
      `${weekdays[weekday] ?? ""}, ${months[month - 1] ?? ""} ${format(day)}, ${format(year)}`;
  }
  return merged;
}

/** Today in the browser's own timezone, as `"YYYY-MM-DD"`. */
function readClock(): string {
  const now = new Date();
  return formatDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}
const subscribeToNothing = (): (() => void) => () => undefined;
const noClockOnTheServer = (): undefined => undefined;

/** The month a calendar shows when nothing else says: this month in UTC, which a server and a browser agree on. */
function utcMonth(): string {
  const now = new Date();
  return formatMonth(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

/** A string that is a real date, else `""`. */
const dateOrNone = (value: unknown): string => (parseDate(value) ? (value as string) : "");

const keyMoves: Record<string, DateMove | undefined> = {
  ArrowLeft: "day-back",
  ArrowRight: "day-forward",
  ArrowUp: "week-back",
  ArrowDown: "week-forward",
  Home: "week-start",
  End: "week-end",
  PageUp: "month-back",
  PageDown: "month-forward",
};

const dayElement = (target: EventTarget): HTMLButtonElement | null =>
  target instanceof Element ? target.closest<HTMLButtonElement>("button[data-date]") : null;

/**
 * A month of days to choose a date, or a range of dates, from: a heading with previous and next month
 * buttons above a grid of seven columns, one for each day of the week, and six rows that always hold the
 * same 42 days, so the grid keeps one height whichever month it shows.
 *
 * A date is the string `"YYYY-MM-DD"` — never a `Date`, which carries a time and a timezone a calendar day
 * doesn't have — so `value` / `onValueChange` (or an uncontrolled `defaultValue`) hold plain text that
 * submits and compares as it is. With `mode="range"` the value is a `[start, end]` pair: the first choice is
 * the start, the second the end, and a third starts again. `month` / `onMonthChange` (or `defaultMonth`) hold
 * the month on show as `"YYYY-MM"`; `min`, `max` and `isDateDisabled` rule dates out; `weekStartsOn` sets the
 * first column (explicitly, never from the browser's locale); `showOutsideDays` fills the first and last
 * weeks with the neighbouring months' days, dimmed.
 *
 * The grid follows the WAI-ARIA date-grid pattern: it is one tab stop, and the arrow keys move by a day or a
 * week, Home and End to the ends of the week, Page Up and Page Down by a month (a year with Shift), and
 * Enter or Space choose. The month changes when a key or a choice lands in another one, and the new month is
 * announced. Unavailable dates stay focusable (`aria-disabled`), so the arrow keys never skip over them.
 *
 * Text the component supplies itself — month and weekday names, accessible names — is a `labels` object,
 * and `formatNumber` writes days and years in a locale's own numerals. `dir="rtl"` mirrors it. `ref`
 * forwards to the outermost `<div>`.
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState("2026-10-05");
 *
 * <Calendar value={date} onValueChange={setDate} />
 *
 * // A range of dates, weeks starting on Monday, nothing in the past
 * <Calendar mode="range" value={range} onValueChange={setRange} weekStartsOn={1} min="2026-10-01" />
 * ```
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>((calendarProps, ref) => {
  const {
    mode: _mode,
    value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    month,
    defaultMonth,
    onMonthChange,
    min: rawMin,
    max: rawMax,
    isDateDisabled,
    weekStartsOn: rawWeekStartsOn = 0,
    showOutsideDays = true,
    today: todayProp,
    size = "md",
    disabled = false,
    readOnly = false,
    autoFocus = false,
    announce = true,
    dir = "ltr",
    labels: labelOverrides,
    formatNumber = String,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
    style,
    id,
    "data-testid": dataTestId,
    ...rest
  } = calendarProps;
  const isRange = calendarProps.mode === "range";

  const [uncontrolledSelection, setUncontrolledSelection] = useState<readonly [string, string]>(() =>
    calendarProps.mode === "range" ? (calendarProps.defaultValue ?? ["", ""]) : [calendarProps.defaultValue ?? "", ""],
  );
  // `null` until the person moves to another month: the month on show then follows the chosen date and the clock.
  const [uncontrolledMonth, setUncontrolledMonth] = useState<string | null>(null);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [focusInside, setFocusInside] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
  const captionId = useId();
  const pendingFocus = useRef(false);
  // The clock: nothing on the server and during hydration, the browser's today afterwards.
  const clock = useSyncExternalStore(subscribeToNothing, readClock, noClockOnTheServer);

  const weekStartsOn: Weekday = (Number.isInteger(rawWeekStartsOn) && rawWeekStartsOn >= 0 && rawWeekStartsOn <= 6
    ? rawWeekStartsOn
    : 0) as Weekday;
  const labels = buildLabels(formatNumber, labelOverrides);
  const min = dateOrNone(rawMin);
  const max = dateOrNone(rawMax);
  const today = parseDate(todayProp) ? (todayProp as string) : clock;

  // What is chosen, whichever mode: a start, and — for a range — an end.
  const rawSelection: readonly [string, string] =
    value === undefined
      ? uncontrolledSelection
      : calendarProps.mode === "range"
        ? (calendarProps.value ?? ["", ""])
        : [calendarProps.value ?? "", ""];
  const start = dateOrNone(rawSelection[0]);
  const end = isRange ? dateOrNone(rawSelection[1]) : "";

  const visibleMonth = ((): string => {
    if (parseMonth(month)) return month as string;
    if (uncontrolledMonth) return uncontrolledMonth;
    if (parseMonth(defaultMonth)) return defaultMonth as string;
    return (start || today || utcMonth()).slice(0, 7);
  })();
  const shown = parseMonth(visibleMonth) ?? { year: 1970, month: 1 };

  const weeks = useMemo(() => monthGrid(shown.year, shown.month, weekStartsOn), [shown.year, shown.month, weekStartsOn]);

  const unavailable = useCallback(
    (date: string): boolean =>
      disabled || (min !== "" && date < min) || (max !== "" && date > max) || Boolean(isDateDisabled?.(date)),
    [disabled, min, max, isDateDisabled],
  );

  // The date Tab lands on: the one that last had focus, else the chosen date, else today, else the 1st —
  // whichever of them is in the month on show.
  const inShownMonth = (date: string | null | undefined): date is string =>
    Boolean(date) && (date as string).slice(0, 7) === visibleMonth;
  const tabbable = inShownMonth(focusedDate)
    ? focusedDate
    : inShownMonth(start)
      ? start
      : inShownMonth(today)
        ? today
        : `${visibleMonth}-01`;

  const goToMonth = (year: number, monthNumber: number): void => {
    const next = formatMonth(Math.min(Math.max(year, 1), 9999), monthNumber);
    if (next === visibleMonth) return;
    if (month === undefined) setUncontrolledMonth(next);
    onMonthChange?.(next);
  };

  // Months counted from year 0: the first month there is, January of year 1, is 12, and the last, December 9999, 119,999.
  const monthIndex = shown.year * 12 + (shown.month - 1);
  const stepMonth = (by: number): void => {
    const total = monthIndex + by;
    goToMonth(Math.floor(total / 12), (total % 12) + 1);
  };

  const commit = (nextStart: string, nextEnd: string): void => {
    if (value === undefined) setUncontrolledSelection([nextStart, nextEnd]);
    if (calendarProps.mode === "range") calendarProps.onValueChange?.([nextStart, nextEnd]);
    else calendarProps.onValueChange?.(nextStart);
  };

  const choose = (date: string): void => {
    if (readOnly || unavailable(date)) return;
    if (date.slice(0, 7) !== visibleMonth) {
      const parsed = parseDate(date);
      if (parsed) goToMonth(parsed.year, parsed.month);
    }
    if (calendarProps.mode === "range") {
      // A first choice, or a new range after a finished one, starts; a choice before the start moves the start.
      if (start === "" || end !== "" || date < start) commit(date, "");
      else commit(start, date);
    } else if (date !== start) {
      commit(date, "");
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    const button = dayElement(event.target);
    if (!button || event.ctrlKey || event.metaKey || event.altKey) return;
    const current = parseDate(button.dataset.date);
    if (!current) return;
    let move = keyMoves[event.key];
    if (!move) return;
    if (event.shiftKey && (move === "month-back" || move === "month-forward")) {
      move = move === "month-back" ? "year-back" : "year-forward";
    } else if (event.shiftKey) {
      return;
    }
    // Under right-to-left, the left arrow goes forward.
    if (dir === "rtl" && (move === "day-back" || move === "day-forward")) {
      move = move === "day-back" ? "day-forward" : "day-back";
    }
    event.preventDefault();
    let target = formatDate(moveDate(current, move, weekStartsOn));
    if (min !== "" && target < min) target = min;
    if (max !== "" && target > max) target = max;
    if (target === button.dataset.date) return;
    const parsed = parseDate(target);
    if (!parsed) return;
    pendingFocus.current = true;
    setFocusedDate(target);
    if (target.slice(0, 7) !== visibleMonth) goToMonth(parsed.year, parsed.month);
  };

  // Moves focus to the date a key chose, once the month holding it has been drawn.
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    rootRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${tabbable}"]`)?.focus();
  });

  useEffect(() => {
    if (!autoFocus) return;
    rootRef.current?.querySelector<HTMLButtonElement>('button[data-date][tabindex="0"]')?.focus();
  }, [autoFocus]);

  // Announce the month when it changes — not the first time it is shown.
  const { message: announcement, announce: announceMonth } = useAnnouncement();
  const previousMonth = useRef<string | undefined>(undefined);
  const monthYearLabel = labels.monthYear;
  useEffect(() => {
    // The first month shown is remembered and not announced.
    previousMonth.current ??= visibleMonth;
    if (previousMonth.current === visibleMonth) return;
    previousMonth.current = visibleMonth;
    const parsed = parseMonth(visibleMonth);
    if (announce && parsed) announceMonth(monthYearLabel(parsed.year, parsed.month));
  }, [announce, announceMonth, monthYearLabel, visibleMonth]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const warn = (message: string) => console.warn(`Calendar: ${message}`);
    const dates: Array<[string, unknown]> = [
      ["value", calendarProps.mode === "range" ? calendarProps.value?.[0] : calendarProps.value],
      ["value (end)", calendarProps.mode === "range" ? calendarProps.value?.[1] : undefined],
      ["defaultValue", calendarProps.mode === "range" ? calendarProps.defaultValue?.[0] : calendarProps.defaultValue],
      ["defaultValue (end)", calendarProps.mode === "range" ? calendarProps.defaultValue?.[1] : undefined],
      ["min", rawMin],
      ["max", rawMax],
      ["today", todayProp],
    ];
    for (const [name, date] of dates) {
      if (date !== undefined && date !== "" && !parseDate(date)) {
        warn(`\`${name}\` must be a real date written "YYYY-MM-DD", but got ${JSON.stringify(date)} — it is ignored.`);
      }
    }
    for (const [name, text] of [
      ["month", month],
      ["defaultMonth", defaultMonth],
    ] as const) {
      if (text !== undefined && !parseMonth(text)) {
        warn(`\`${name}\` must be a month written "YYYY-MM", but got ${JSON.stringify(text)} — it is ignored.`);
      }
    }
    if (rawMin && rawMax && parseDate(rawMin) && parseDate(rawMax) && rawMin > rawMax) {
      warn("`min` is after `max`, so no date can be chosen.");
    }
    if (!(Number.isInteger(rawWeekStartsOn) && rawWeekStartsOn >= 0 && rawWeekStartsOn <= 6)) {
      warn(`\`weekStartsOn\` must be a whole number from 0 (Sunday) to 6 (Saturday), but got ${String(rawWeekStartsOn)} — Sunday is used.`);
    }
    if (calendarProps.value !== undefined && calendarProps.defaultValue !== undefined) {
      warn("both `value` and `defaultValue` were given. `value` makes the component controlled, so `defaultValue` is ignored — remove one.");
    }
    if (month !== undefined && defaultMonth !== undefined) {
      warn("both `month` and `defaultMonth` were given. `month` makes the month controlled, so `defaultMonth` is ignored — remove one.");
    }
    for (const [name, list, length] of [
      ["months", labelOverrides?.months, 12],
      ["weekdays", labelOverrides?.weekdays, 7],
      ["weekdaysShort", labelOverrides?.weekdaysShort, 7],
    ] as const) {
      if (list !== undefined && list.length !== length) {
        warn(`\`labels.${name}\` needs ${length} entries, but got ${list.length} — the English names are used.`);
      }
    }
  }, [calendarProps, rawMin, rawMax, todayProp, month, defaultMonth, rawWeekStartsOn, labelOverrides]);

  // The range on show: what is chosen, and — while the end is still to be chosen — as far as the pointer or the
  // focus has gone, so the person sees what a click would pick.
  const picking = isRange && start !== "" && end === "";
  const previewDate = picking ? (hovered ?? (focusInside ? focusedDate : null)) : null;
  const bandEnd = end !== "" ? end : previewDate !== null && previewDate > start ? previewDate : "";

  const previousUnavailable =
    disabled || monthIndex <= 12 || (min !== "" && formatMonth(shown.year, shown.month) <= min.slice(0, 7));
  const nextUnavailable =
    disabled ||
    monthIndex >= 9999 * 12 + 11 ||
    (max !== "" && formatMonth(shown.year, shown.month) >= max.slice(0, 7));
  const flipped = dir === "rtl";

  const heading = labels.monthYear(shown.year, shown.month);

  return (
    <div
      {...rest}
      ref={mergedRef}
      role="group"
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? labels.calendar)}
      aria-labelledby={ariaLabelledBy}
      id={id}
      dir={dir}
      data-testid={dataTestId}
      style={style}
      className={cx(styles.root, sizeClass[size], disabled && styles.disabled, className)}
    >
      <div className={styles.header}>
        {/* Slotted onto a plain button: an unavailable month button is `aria-disabled`, not natively disabled, so
            keyboard focus is not lost when pressing it reaches the first or last month there is. */}
        <Button asChild variant="tertiary" size={size} disabled={previousUnavailable} className={styles.monthButton}>
          <button type="button" aria-label={labels.previousMonth} onClick={() => stepMonth(-1)}>
            <Icon icon={flipped ? CaretRightIcon : CaretLeftIcon} size={iconSize[size]} tone="brand" />
          </button>
        </Button>
        <div id={captionId} className={styles.caption}>
          {heading}
        </div>
        <Button asChild variant="tertiary" size={size} disabled={nextUnavailable} className={styles.monthButton}>
          <button type="button" aria-label={labels.nextMonth} onClick={() => stepMonth(1)}>
            <Icon icon={flipped ? CaretLeftIcon : CaretRightIcon} size={iconSize[size]} tone="brand" />
          </button>
        </Button>
      </div>
      <table
        className={styles.grid}
        role="grid"
        aria-labelledby={captionId}
        aria-readonly={readOnly || undefined}
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
        onPointerLeave={() => setHovered(null)}
        onFocus={() => setFocusInside(true)}
        onBlur={(event: FocusEvent<HTMLTableElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false);
        }}
      >
        <thead>
          <tr>
            {Array.from({ length: 7 }, (_, column) => {
              const weekday = (weekStartsOn + column) % 7;
              return (
                <th key={weekday} scope="col" className={styles.weekday}>
                  <span aria-hidden="true">{labels.weekdaysShort[weekday]}</span>
                  <VisuallyHidden>{labels.weekdays[weekday]}</VisuallyHidden>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={formatDate(week[0] as CivilDate)}>
              {week.map((civil) => {
                const date = formatDate(civil);
                const outside = date.slice(0, 7) !== visibleMonth;
                if (outside && !showOutsideDays) return <td key={date} role="gridcell" className={styles.cell} />;

                const isStart = date === start;
                const isEnd = isRange && date === end;
                const isSelected = isStart || isEnd;
                const isToday = date === today;
                const isUnavailable = unavailable(date);
                const inBand = bandEnd !== "" && start !== "" && date > start && date < bandEnd;
                const bandStart = bandEnd !== "" && start !== "" && date === start;
                const bandStop = bandEnd !== "" && start !== "" && date === bandEnd;
                const name = [
                  labels.day({ year: civil.year, month: civil.month, day: civil.day, weekday: weekdayOf(civil) }),
                  isToday ? labels.today : "",
                  isRange && isStart ? labels.rangeStart : "",
                  isRange && isEnd ? labels.rangeEnd : "",
                ]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <td
                    key={date}
                    role="gridcell"
                    aria-selected={isSelected || inBand ? true : false}
                    aria-disabled={isUnavailable || undefined}
                    className={cx(
                      styles.cell,
                      inBand && styles.band,
                      bandStart && styles.bandStart,
                      bandStop && styles.bandEnd,
                    )}
                  >
                    <button
                      type="button"
                      data-date={date}
                      tabIndex={date === tabbable ? 0 : -1}
                      aria-label={name}
                      aria-current={isToday ? "date" : undefined}
                      className={cx(
                        styles.day,
                        outside && styles.outside,
                        isToday && styles.today,
                        isSelected && styles.selected,
                        bandStop && !isEnd && styles.previewEnd,
                        isUnavailable && styles.unavailable,
                      )}
                      onClick={() => choose(date)}
                      onFocus={() => setFocusedDate(date)}
                      onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
                        if (picking && event.pointerType === "mouse") setHovered(date);
                      }}
                    >
                      {formatNumber(civil.day)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </div>
  );
});

Calendar.displayName = "Calendar";
