import { describe, expect, it } from "vitest";
import {
  dateDraftToValue,
  emptyDateDraft,
  endOfDateSegment,
  enterDateDigit,
  hasDateContent,
  isImpossibleDate,
  padSegment,
  segmentsForFormat,
  stepDateSegment,
  valueToDateDraft,
} from "./dateEntry";
import type { DateBuffer, DateSegment } from "./dateEntry";

/** Types a string of digits into one segment the way the field does, returning what is left of it. */
function type(segment: DateSegment, digits: string) {
  let buffer: DateBuffer | undefined;
  let value: number | undefined;
  const carried: number[] = [];
  for (const character of digits) {
    const result = enterDateDigit(segment, buffer, Number(character));
    buffer = result.buffer;
    value = result.value;
    if (result.carry !== undefined) carried.push(result.carry);
    if (result.done) break;
  }
  return { value, buffer, carried };
}

describe("segmentsForFormat", () => {
  it("writes each format in its own order", () => {
    expect(segmentsForFormat("dmy")).toEqual(["day", "month", "year"]);
    expect(segmentsForFormat("mdy")).toEqual(["month", "day", "year"]);
    expect(segmentsForFormat("ymd")).toEqual(["year", "month", "day"]);
  });

  it("reads an unknown format as month-day-year", () => {
    expect(segmentsForFormat("xyz" as never)).toEqual(["month", "day", "year"]);
  });
});

describe("value and draft", () => {
  it("round-trips a real date", () => {
    expect(valueToDateDraft("2026-10-03")).toEqual({ day: 3, month: 10, year: 2026 });
    expect(dateDraftToValue({ day: 3, month: 10, year: 2026 })).toBe("2026-10-03");
  });

  it("reads anything that is not a real date as empty", () => {
    for (const bad of ["", "2026-02-30", "2026-13-01", "nonsense", "2026-1-1"]) {
      expect(valueToDateDraft(bad)).toEqual(emptyDateDraft);
    }
  });

  it("is no value until all three segments are there", () => {
    expect(dateDraftToValue({ day: 3, month: 10, year: undefined })).toBe("");
  });

  it("pads a short year to four digits", () => {
    expect(dateDraftToValue({ day: 1, month: 1, year: 26 })).toBe("0026-01-01");
  });

  it("is no value, and impossible, for the 31st of February", () => {
    const draft = { day: 31, month: 2, year: 2026 };
    expect(dateDraftToValue(draft)).toBe("");
    expect(isImpossibleDate(draft)).toBe(true);
  });

  it("is not impossible while a segment is missing", () => {
    expect(isImpossibleDate({ day: 31, month: 2, year: undefined })).toBe(false);
  });

  it("has content when any segment does", () => {
    expect(hasDateContent(emptyDateDraft)).toBe(false);
    expect(hasDateContent({ ...emptyDateDraft, year: 2026 })).toBe(true);
  });
});

describe("enterDateDigit", () => {
  it.each([
    ["day", "4", 4],
    ["day", "31", 31],
    ["day", "12", 12],
    ["month", "5", 5],
    ["month", "11", 11],
    ["month", "01", 1],
  ] as const)("typing %s %s gives %s", (segment, digits, expected) => {
    expect(type(segment, digits).value).toBe(expected);
  });

  it("waits after a first digit that could begin a two-digit day", () => {
    const result = enterDateDigit("day", undefined, 2);
    expect(result).toMatchObject({ value: 2, done: false, buffer: { value: 2, count: 1 } });
  });

  it("finishes at once on a first digit that cannot", () => {
    expect(enterDateDigit("day", undefined, 4)).toMatchObject({ value: 4, done: true, buffer: undefined });
    expect(enterDateDigit("month", undefined, 2)).toMatchObject({ value: 2, done: true });
  });

  it("holds a lone 0 as no value and waits", () => {
    expect(enterDateDigit("day", undefined, 0)).toMatchObject({ value: undefined, done: false });
  });

  it("keeps waiting through a second 0", () => {
    const first = enterDateDigit("month", undefined, 0);
    expect(enterDateDigit("month", first.buffer, 0)).toMatchObject({ value: undefined, done: false });
  });

  it("carries a digit that does not fit: a 3 then a 5 in the day is day 3, then a 5", () => {
    const first = enterDateDigit("day", undefined, 3);
    expect(enterDateDigit("day", first.buffer, 5)).toEqual({ value: 3, buffer: undefined, done: true, carry: 5 });
  });

  it("takes up to four digits in the year, and is done on the fourth", () => {
    const two = type("year", "20");
    expect(two.value).toBe(20);
    expect(two.buffer).toEqual({ value: 20, count: 2 });
    const four = type("year", "2026");
    expect(four.value).toBe(2026);
    expect(four.buffer).toBeUndefined();
  });

  it("keeps leading zeros in the year as digits but no value until it is above zero", () => {
    expect(type("year", "00").value).toBeUndefined();
    expect(type("year", "0026").value).toBe(26);
  });
});

describe("stepDateSegment", () => {
  const draft = { day: 31, month: 1, year: 2026 };

  it("wraps the day within its month", () => {
    expect(stepDateSegment(draft, "day", 1, 2026).day).toBe(1);
    expect(stepDateSegment({ ...draft, day: 1 }, "day", -1, 2026).day).toBe(31);
    expect(stepDateSegment({ day: 1, month: 2, year: 2026 }, "day", -1, 2026).day).toBe(28);
    expect(stepDateSegment({ day: 1, month: 2, year: 2028 }, "day", -1, 2026).day).toBe(29);
  });

  it("lets February have 29 days while the year is not known", () => {
    expect(stepDateSegment({ day: 1, month: 2, year: undefined }, "day", -1, 2026).day).toBe(29);
  });

  it("wraps the month", () => {
    expect(stepDateSegment({ ...draft, month: 12 }, "month", 1, 2026).month).toBe(1);
    expect(stepDateSegment({ ...draft, month: 1 }, "month", -1, 2026).month).toBe(12);
  });

  it("starts an empty day and month at their least going up and greatest going down", () => {
    expect(stepDateSegment(emptyDateDraft, "day", 1, 2026).day).toBe(1);
    expect(stepDateSegment(emptyDateDraft, "day", -1, 2026).day).toBe(31);
    expect(stepDateSegment(emptyDateDraft, "month", -1, 2026).month).toBe(12);
  });

  it("starts an empty year at the fallback and never wraps it", () => {
    expect(stepDateSegment(emptyDateDraft, "year", 1, 2026).year).toBe(2026);
    expect(stepDateSegment({ ...draft, year: 1 }, "year", -1, 2026).year).toBe(1);
    expect(stepDateSegment({ ...draft, year: 9999 }, "year", 1, 2026).year).toBe(9999);
  });
});

describe("endOfDateSegment", () => {
  it("goes to the least and the greatest", () => {
    const draft = { day: 10, month: 2, year: 2026 };
    expect(endOfDateSegment(draft, "day", "start").day).toBe(1);
    expect(endOfDateSegment(draft, "day", "end").day).toBe(28);
    expect(endOfDateSegment(draft, "month", "end").month).toBe(12);
    expect(endOfDateSegment(draft, "year", "end").year).toBe(9999);
  });
});

describe("padSegment", () => {
  it("pads to the width in the digits given", () => {
    expect(padSegment(3, 2, String)).toBe("03");
    expect(padSegment(26, 4, String)).toBe("0026");
    expect(padSegment(2026, 4, String)).toBe("2026");
  });

  it("writes every digit, padding included, through formatNumber", () => {
    const arabic = (n: number) => String.fromCodePoint(0x660 + n);
    expect(padSegment(5, 2, arabic)).toBe("٠٥");
  });
});
