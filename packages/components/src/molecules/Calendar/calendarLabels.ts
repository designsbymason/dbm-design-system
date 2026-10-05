import { mergeDefined } from "@dbm-design-system/primitives";
import type { CalendarLabels } from "./Calendar.types";

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
const defaultMonthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const defaultWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const defaultWeekdaysShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/**
 * The English text, with the labels that depend on others (the heading and a day's name need the month
 * names) built from the names in force, so translating `months` translates them too.
 */
export function buildLabels(format: (value: number) => string, overrides: Partial<CalendarLabels> | undefined): CalendarLabels {
  const merged = mergeDefined<CalendarLabels>(
    {
      calendar: "Calendar",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      months: defaultMonths,
      monthsShort: defaultMonthsShort,
      weekdays: defaultWeekdays,
      weekdaysShort: defaultWeekdaysShort,
      monthYear: () => "",
      day: () => "",
      today: "today",
      rangeStart: "range start",
      rangeEnd: "range end",
      monthSelect: "Month",
      yearSelect: "Year",
      monthRange: (first, last) => `${first} – ${last}`,
      todayButton: "Today",
      clearButton: "Clear",
      previousYear: "Previous year",
      nextYear: "Next year",
      previousYears: "Previous years",
      nextYears: "Next years",
      openMonths: () => "",
      openYears: () => "",
      yearsRange: (from, to) => `${from} – ${to}`,
      monthsView: (year) => `Months of ${year}`,
      weekChosen: (start, end) => `Week ${start} to ${end}`,
      weekNumberShort: "Wk",
      weekNumberColumn: "Week number",
      weekNumber: () => "",
      rangeStartChosen: (day) => `Range start ${day}`,
      rangeChosen: (start, end) => `Range ${start} to ${end}`,
      datesChosen: () => "",
      legend: "Key",
      legendToday: "Today",
      legendSelected: "Selected",
      legendRange: "In range",
      legendUnavailable: "Unavailable",
    },
    overrides,
  );
  // A list of the wrong length can't name every month or weekday; the English one stands in (a warning says so).
  if (merged.months.length !== 12) merged.months = defaultMonths;
  if (merged.monthsShort.length !== 12) merged.monthsShort = defaultMonthsShort;
  if (merged.weekdays.length !== 7) merged.weekdays = defaultWeekdays;
  if (merged.weekdaysShort.length !== 7) merged.weekdaysShort = defaultWeekdaysShort;
  const { months, weekdays } = merged;
  if (overrides?.monthYear === undefined) {
    merged.monthYear = (year, month) => `${months[month - 1] ?? ""} ${format(year)}`;
  }
  if (overrides?.openMonths === undefined) merged.openMonths = (heading) => `${heading}, choose a month`;
  if (overrides?.openYears === undefined) merged.openYears = (year) => `${year}, choose a year`;
  if (overrides?.weekNumber === undefined) merged.weekNumber = (week) => `Week ${format(week)}`;
  if (overrides?.datesChosen === undefined) {
    merged.datesChosen = (count) => (count === 1 ? `${format(count)} date selected` : `${format(count)} dates selected`);
  }
  if (overrides?.day === undefined) {
    merged.day = ({ year, month, day, weekday }) =>
      `${weekdays[weekday] ?? ""}, ${months[month - 1] ?? ""} ${format(day)}, ${format(year)}`;
  }
  return merged;
}
