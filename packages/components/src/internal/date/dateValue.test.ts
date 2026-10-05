import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addYears,
  compareDates,
  daysBetween,
  daysInMonth,
  formatDate,
  formatMonth,
  isCivilDate,
  monthGrid,
  moveDate,
  parseDate,
  parseMonth,
  weekdayOf,
} from "./dateValue";

const d = (value: string) => {
  const date = parseDate(value);
  if (!date) throw new Error(`not a date: ${value}`);
  return date;
};
const text = (date: ReturnType<typeof d>) => formatDate(date);

describe("daysInMonth", () => {
  it.each([
    [2026, 1, 31],
    [2026, 2, 28],
    [2024, 2, 29],
    [1900, 2, 28],
    [2000, 2, 29],
    [2026, 4, 30],
    [2026, 12, 31],
  ])("%i-%i has %i days", (year, month, days) => {
    expect(daysInMonth(year, month)).toBe(days);
  });
});

describe("parseDate", () => {
  it("reads a real date", () => {
    expect(parseDate("2026-10-05")).toEqual({ year: 2026, month: 10, day: 5 });
    expect(parseDate("2024-02-29")).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseDate("0001-01-01")).toEqual({ year: 1, month: 1, day: 1 });
  });

  it.each(["", "2026-10", "2026-1-05", "2026-10-5", "2026/10/05", "2026-13-01", "2026-00-10", "2026-02-29", "2026-04-31", "0000-01-01", " 2026-10-05", "2026-10-05T00:00", "tomorrow"])(
    "refuses %j",
    (value) => {
      expect(parseDate(value)).toBeNull();
    },
  );

  it("refuses what is not a string", () => {
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate(20261005)).toBeNull();
    expect(parseDate(new Date())).toBeNull();
  });
});

describe("parseMonth and format", () => {
  it("reads and writes a month", () => {
    expect(parseMonth("2026-10")).toEqual({ year: 2026, month: 10 });
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth("2026-10-05")).toBeNull();
    expect(formatMonth(2026, 3)).toBe("2026-03");
    expect(formatMonth(7, 12)).toBe("0007-12");
  });

  it("writes a date padded, and reads back what it writes", () => {
    expect(formatDate({ year: 2026, month: 3, day: 9 })).toBe("2026-03-09");
    expect(formatDate({ year: 7, month: 1, day: 1 })).toBe("0007-01-01");
    expect(parseDate(formatDate({ year: 7, month: 1, day: 1 }))).toEqual({ year: 7, month: 1, day: 1 });
  });

  it("knows a real date from an impossible one", () => {
    expect(isCivilDate({ year: 2026, month: 2, day: 29 })).toBe(false);
    expect(isCivilDate({ year: 2026, month: 2, day: 28 })).toBe(true);
    expect(isCivilDate({ year: 2026, month: 1.5, day: 1 })).toBe(false);
  });
});

describe("weekdayOf", () => {
  it.each([
    ["1970-01-01", 4],
    ["2026-10-05", 1],
    ["2000-01-01", 6],
    ["2024-02-29", 4],
    ["1969-12-31", 3],
    ["0001-01-01", 1],
    ["9999-12-31", 5],
  ])("%s is weekday %i", (value, weekday) => {
    expect(weekdayOf(d(value))).toBe(weekday);
  });
});

describe("addDays", () => {
  it("crosses a month, a year and a leap day", () => {
    expect(text(addDays(d("2026-10-31"), 1))).toBe("2026-11-01");
    expect(text(addDays(d("2026-12-31"), 1))).toBe("2027-01-01");
    expect(text(addDays(d("2024-02-28"), 1))).toBe("2024-02-29");
    expect(text(addDays(d("2026-02-28"), 1))).toBe("2026-03-01");
    expect(text(addDays(d("2026-01-01"), -1))).toBe("2025-12-31");
    expect(text(addDays(d("2026-10-05"), 0))).toBe("2026-10-05");
    expect(text(addDays(d("2026-10-05"), 365))).toBe("2027-10-05");
  });

  it("is the same across a daylight-saving change, because it never reads a local clock", () => {
    expect(text(addDays(d("2026-03-28"), 3))).toBe("2026-03-31");
    expect(text(addDays(d("2026-10-24"), 3))).toBe("2026-10-27");
    expect(text(addDays(d("2026-11-01"), 1))).toBe("2026-11-02");
  });

  it("stops at the ends of the calendar", () => {
    expect(text(addDays(d("0001-01-01"), -1))).toBe("0001-01-01");
    expect(text(addDays(d("9999-12-31"), 1))).toBe("9999-12-31");
  });
});

describe("addMonths and addYears", () => {
  it("keeps the day, or falls back to the month's last", () => {
    expect(text(addMonths(d("2026-01-31"), 1))).toBe("2026-02-28");
    expect(text(addMonths(d("2024-01-31"), 1))).toBe("2024-02-29");
    expect(text(addMonths(d("2026-03-31"), -1))).toBe("2026-02-28");
    expect(text(addMonths(d("2026-10-05"), 1))).toBe("2026-11-05");
    expect(text(addMonths(d("2026-12-15"), 1))).toBe("2027-01-15");
    expect(text(addMonths(d("2026-01-15"), -1))).toBe("2025-12-15");
    expect(text(addMonths(d("2026-10-05"), 14))).toBe("2027-12-05");
    expect(text(addMonths(d("2026-10-05"), -24))).toBe("2024-10-05");
  });

  it("moves a leap day a year to the 28th", () => {
    expect(text(addYears(d("2024-02-29"), 1))).toBe("2025-02-28");
    expect(text(addYears(d("2024-02-29"), 4))).toBe("2028-02-29");
    expect(text(addYears(d("2026-10-05"), -1))).toBe("2025-10-05");
  });

  it("stops at the ends of the calendar", () => {
    expect(text(addYears(d("0001-06-15"), -1))).toBe("0001-01-01");
    expect(text(addYears(d("9999-06-15"), 1))).toBe("9999-12-31");
  });
});

describe("compareDates and daysBetween", () => {
  it("orders dates", () => {
    expect(compareDates(d("2026-10-05"), d("2026-10-06"))).toBeLessThan(0);
    expect(compareDates(d("2026-10-06"), d("2026-10-05"))).toBeGreaterThan(0);
    expect(compareDates(d("2026-10-05"), d("2026-10-05"))).toBe(0);
    expect(compareDates(d("2025-12-31"), d("2026-01-01"))).toBeLessThan(0);
  });

  it("counts the days between", () => {
    expect(daysBetween(d("2026-10-05"), d("2026-10-12"))).toBe(7);
    expect(daysBetween(d("2026-12-31"), d("2027-01-01"))).toBe(1);
    expect(daysBetween(d("2026-10-05"), d("2026-10-01"))).toBe(-4);
  });
});

describe("monthGrid", () => {
  it("is six weeks of seven, the month inside it", () => {
    const grid = monthGrid(2026, 10, 0);
    expect(grid).toHaveLength(6);
    for (const week of grid) expect(week).toHaveLength(7);
    // October 2026 starts on a Thursday.
    expect(text(grid[0]![0]!)).toBe("2026-09-27");
    expect(text(grid[0]![4]!)).toBe("2026-10-01");
    expect(text(grid[4]![6]!)).toBe("2026-10-31");
    expect(text(grid[5]![0]!)).toBe("2026-11-01");
    expect(text(grid[5]![6]!)).toBe("2026-11-07");
  });

  it("starts the week where it is told to", () => {
    expect(text(monthGrid(2026, 10, 1)[0]![0]!)).toBe("2026-09-28");
    expect(text(monthGrid(2026, 10, 4)[0]![0]!)).toBe("2026-10-01");
    expect(text(monthGrid(2026, 10, 5)[0]![0]!)).toBe("2026-09-25");
    for (const start of [0, 1, 2, 3, 4, 5, 6] as const) {
      expect(weekdayOf(monthGrid(2026, 10, start)[0]![0]!)).toBe(start);
    }
  });

  it("needs no leading days when the month starts on the first day of the week", () => {
    // 2026-02-01 is a Sunday, so a Sunday-first grid starts on the 1st.
    expect(text(monthGrid(2026, 2, 0)[0]![0]!)).toBe("2026-02-01");
    expect(text(monthGrid(2026, 2, 0)[5]![6]!)).toBe("2026-03-14");
  });

  it("is a continuous run of days", () => {
    const flat = monthGrid(2024, 2, 1).flat();
    for (let index = 1; index < flat.length; index += 1) {
      expect(daysBetween(flat[index - 1]!, flat[index]!)).toBe(1);
    }
  });

  it("crosses a year", () => {
    expect(text(monthGrid(2026, 12, 0)[5]![6]!)).toBe("2027-01-09");
    expect(text(monthGrid(2027, 1, 0)[0]![0]!)).toBe("2026-12-27");
  });
});

describe("moveDate", () => {
  const date = d("2026-10-07"); // a Wednesday

  it.each([
    ["day-back", "2026-10-06"],
    ["day-forward", "2026-10-08"],
    ["week-back", "2026-09-30"],
    ["week-forward", "2026-10-14"],
    ["month-back", "2026-09-07"],
    ["month-forward", "2026-11-07"],
    ["year-back", "2025-10-07"],
    ["year-forward", "2027-10-07"],
  ] as const)("%s", (move, expected) => {
    expect(text(moveDate(date, move, 0))).toBe(expected);
  });

  it("finds the ends of the week, by where the week starts", () => {
    expect(text(moveDate(date, "week-start", 0))).toBe("2026-10-04");
    expect(text(moveDate(date, "week-end", 0))).toBe("2026-10-10");
    expect(text(moveDate(date, "week-start", 1))).toBe("2026-10-05");
    expect(text(moveDate(date, "week-end", 1))).toBe("2026-10-11");
    expect(text(moveDate(date, "week-start", 3))).toBe("2026-10-07");
    expect(text(moveDate(date, "week-end", 3))).toBe("2026-10-13");
    expect(text(moveDate(d("2026-10-04"), "week-start", 0))).toBe("2026-10-04");
    expect(text(moveDate(d("2026-10-10"), "week-end", 0))).toBe("2026-10-10");
  });
});
