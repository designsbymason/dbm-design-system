import { describe, expect, it } from "vitest";
import { digitValue, enterDigit, periodFromLetter } from "./segmentEntry";
import {
  compareTime,
  draftToParts,
  draftToValue,
  formatTime,
  isTimeAllowed,
  overlapsRange,
  parseTime,
  partsToDraft,
  segmentsFor,
  stepMinute,
  stepSegment,
  valueToDraft,
  wrap,
} from "./timeValue";

describe("parseTime / formatTime", () => {
  it("reads HH:mm and HH:mm:ss", () => {
    expect(parseTime("09:05")).toEqual({ hours: 9, minutes: 5, seconds: 0 });
    expect(parseTime("23:59:58")).toEqual({ hours: 23, minutes: 59, seconds: 58 });
  });

  it.each(["", "9:05", "24:00", "12:60", "12:30:60", "12:30:", "ab:cd", "12-30", " 12:30", "12:30 "])(
    "rejects %j",
    (value) => expect(parseTime(value)).toBeUndefined(),
  );

  it.each([undefined, null, 5 as unknown as string])("rejects a non-string (%s)", (value) =>
    expect(parseTime(value)).toBeUndefined(),
  );

  it("writes HH:mm, and HH:mm:ss with seconds", () => {
    expect(formatTime({ hours: 7, minutes: 3, seconds: 9 }, false)).toBe("07:03");
    expect(formatTime({ hours: 7, minutes: 3, seconds: 9 }, true)).toBe("07:03:09");
  });

  it("round-trips every minute of the day", () => {
    for (let total = 0; total < 24 * 60; total += 1) {
      const value = formatTime({ hours: Math.floor(total / 60), minutes: total % 60, seconds: 0 }, false);
      expect(formatTime(parseTime(value)!, false)).toBe(value);
    }
  });
});

describe("drafts", () => {
  it("shows midnight and noon as 12 in the 12-hour cycle", () => {
    expect(partsToDraft({ hours: 0, minutes: 0, seconds: 0 }, "12", false)).toEqual({ hour: 12, minute: 0, period: "am" });
    expect(partsToDraft({ hours: 12, minutes: 0, seconds: 0 }, "12", false)).toEqual({ hour: 12, minute: 0, period: "pm" });
    expect(partsToDraft({ hours: 15, minutes: 5, seconds: 0 }, "12", false)).toEqual({ hour: 3, minute: 5, period: "pm" });
  });

  it("round-trips every time of day through both cycles, with and without seconds", () => {
    for (const cycle of ["12", "24"] as const) {
      for (const showSeconds of [false, true]) {
        for (let hours = 0; hours < 24; hours += 1) {
          for (const minutes of [0, 1, 30, 59]) {
            const parts = { hours, minutes, seconds: showSeconds ? 17 : 0 };
            expect(draftToParts(partsToDraft(parts, cycle, showSeconds), cycle, showSeconds)).toEqual(parts);
          }
        }
      }
    }
  });

  it("is incomplete while any shown segment is empty", () => {
    expect(draftToValue({ hour: 3, minute: 5 }, "12", false)).toBe("");
    expect(draftToValue({ hour: 3, period: "pm" }, "12", false)).toBe("");
    expect(draftToValue({ hour: 15, minute: 5 }, "24", true)).toBe("");
    expect(draftToValue({ minute: 5, period: "pm" }, "12", false)).toBe("");
  });

  it("ignores a period in the 24-hour cycle and seconds when they aren't shown", () => {
    expect(draftToValue({ hour: 15, minute: 5, period: "am", second: 40 }, "24", false)).toBe("15:05");
  });

  it("turns 12 pm into 12:00 and 12 am into 00:00", () => {
    expect(draftToValue({ hour: 12, minute: 0, period: "pm" }, "12", false)).toBe("12:00");
    expect(draftToValue({ hour: 12, minute: 0, period: "am" }, "12", false)).toBe("00:00");
  });

  it("reads an unreadable value as an empty draft", () => {
    expect(valueToDraft("nope", "12", false)).toEqual({});
    expect(valueToDraft(undefined, "24", true)).toEqual({});
  });

  it("lists the segments a field shows", () => {
    expect(segmentsFor("12", false)).toEqual(["hour", "minute", "period"]);
    expect(segmentsFor("24", false)).toEqual(["hour", "minute"]);
    expect(segmentsFor("12", true)).toEqual(["hour", "minute", "second", "period"]);
    expect(segmentsFor("24", true)).toEqual(["hour", "minute", "second"]);
  });
});

describe("range and step", () => {
  const at = (value: string) => parseTime(value)!;

  it("orders times", () => {
    expect(compareTime(at("09:00"), at("10:00"))).toBeLessThan(0);
    expect(compareTime(at("10:00:01"), at("10:00"))).toBeGreaterThan(0);
    expect(compareTime(at("10:00"), at("10:00"))).toBe(0);
  });

  it("allows the ends of the range, and nothing outside it", () => {
    const constraints = { min: at("09:00"), max: at("17:30"), step: 1 };
    expect(isTimeAllowed(at("09:00"), constraints)).toBe(true);
    expect(isTimeAllowed(at("17:30"), constraints)).toBe(true);
    expect(isTimeAllowed(at("08:59"), constraints)).toBe(false);
    expect(isTimeAllowed(at("17:31"), constraints)).toBe(false);
  });

  it("allows a range that has only one end", () => {
    expect(isTimeAllowed(at("03:00"), { min: at("09:00"), step: 1 })).toBe(false);
    expect(isTimeAllowed(at("23:00"), { min: at("09:00"), step: 1 })).toBe(true);
    expect(isTimeAllowed(at("23:00"), { max: at("09:00"), step: 1 })).toBe(false);
  });

  it("requires the minute to be on the step", () => {
    expect(isTimeAllowed(at("10:15"), { step: 15 })).toBe(true);
    expect(isTimeAllowed(at("10:20"), { step: 15 })).toBe(false);
  });
});

describe("stepping", () => {
  it("wraps in both directions", () => {
    expect(wrap(23, 1, 0, 23)).toBe(0);
    expect(wrap(0, -1, 0, 23)).toBe(23);
    expect(wrap(12, 1, 1, 12)).toBe(1);
    expect(wrap(1, -1, 1, 12)).toBe(12);
    expect(wrap(5, 20, 0, 59)).toBe(25);
    expect(wrap(5, -20, 0, 59)).toBe(45);
  });

  it("steps minutes on a grid, wrapping, and from nothing starts at an end", () => {
    expect(stepMinute(undefined, 1, 15)).toBe(0);
    expect(stepMinute(undefined, -1, 15)).toBe(45);
    expect(stepMinute(0, 1, 15)).toBe(15);
    expect(stepMinute(45, 1, 15)).toBe(0);
    expect(stepMinute(0, -1, 15)).toBe(45);
    expect(stepMinute(20, 1, 15)).toBe(30);
    expect(stepMinute(20, -1, 15)).toBe(15);
    expect(stepMinute(59, 1, 1)).toBe(0);
    expect(stepMinute(0, -1, 1)).toBe(59);
    expect(stepMinute(30, -1, 7)).toBe(28);
  });

  it("steps the hour inside the cycle", () => {
    expect(stepSegment({ hour: 12 }, "hour", 1, "12", 1).hour).toBe(1);
    expect(stepSegment({ hour: 1 }, "hour", -1, "12", 1).hour).toBe(12);
    expect(stepSegment({ hour: 23 }, "hour", 1, "24", 1).hour).toBe(0);
    expect(stepSegment({}, "hour", 1, "12", 1).hour).toBe(1);
    expect(stepSegment({}, "hour", -1, "12", 1).hour).toBe(12);
    expect(stepSegment({}, "hour", 1, "24", 1).hour).toBe(0);
    expect(stepSegment({}, "hour", -1, "24", 1).hour).toBe(23);
  });

  it("steps seconds by one, and toggles the period", () => {
    expect(stepSegment({ second: 59 }, "second", 1, "24", 1).second).toBe(0);
    expect(stepSegment({}, "second", -1, "24", 1).second).toBe(59);
    expect(stepSegment({ period: "am" }, "period", 1, "12", 1).period).toBe("pm");
    expect(stepSegment({ period: "pm" }, "period", -1, "12", 1).period).toBe("am");
    expect(stepSegment({}, "period", 1, "12", 1).period).toBe("am");
    expect(stepSegment({}, "period", -1, "12", 1).period).toBe("pm");
  });

  it("does not change the other segments", () => {
    expect(stepSegment({ hour: 3, minute: 5, period: "pm" }, "hour", 1, "12", 1)).toEqual({ hour: 4, minute: 5, period: "pm" });
  });
});

describe("typing digits", () => {
  it("takes a digit that can't start a two-digit hour as the whole hour", () => {
    expect(enterDigit("hour", undefined, 3, "24")).toEqual({ value: 3, buffer: undefined, done: true });
    expect(enterDigit("hour", undefined, 2, "24")).toMatchObject({ value: 2, buffer: 2, done: false });
    expect(enterDigit("hour", undefined, 2, "12")).toEqual({ value: 2, buffer: undefined, done: true });
    expect(enterDigit("hour", undefined, 1, "12")).toMatchObject({ value: 1, buffer: 1, done: false });
  });

  it("completes a two-digit hour", () => {
    expect(enterDigit("hour", 2, 3, "24")).toEqual({ value: 23, buffer: undefined, done: true });
    expect(enterDigit("hour", 1, 2, "12")).toEqual({ value: 12, buffer: undefined, done: true });
    expect(enterDigit("hour", 0, 9, "24")).toEqual({ value: 9, buffer: undefined, done: true });
  });

  it("keeps the first digit as the hour and carries one that can't follow it", () => {
    expect(enterDigit("hour", 2, 4, "24")).toEqual({ value: 2, buffer: undefined, done: true, carry: 4 });
    expect(enterDigit("hour", 1, 3, "12")).toEqual({ value: 1, buffer: undefined, done: true, carry: 3 });
  });

  it("treats a 0 as no hour yet in the 12-hour cycle, and as an hour in the 24-hour one", () => {
    expect(enterDigit("hour", undefined, 0, "12")).toEqual({ value: undefined, buffer: 0, done: false });
    expect(enterDigit("hour", 0, 0, "12")).toEqual({ value: undefined, buffer: 0, done: false });
    expect(enterDigit("hour", 0, 5, "12")).toEqual({ value: 5, buffer: undefined, done: true });
    expect(enterDigit("hour", undefined, 0, "24")).toEqual({ value: 0, buffer: 0, done: false });
    expect(enterDigit("hour", 0, 0, "24")).toEqual({ value: 0, buffer: undefined, done: true });
  });

  it("types minutes and seconds the same way", () => {
    for (const segment of ["minute", "second"] as const) {
      expect(enterDigit(segment, undefined, 7, "24")).toEqual({ value: 7, buffer: undefined, done: true });
      expect(enterDigit(segment, undefined, 5, "24")).toMatchObject({ value: 5, buffer: 5, done: false });
      expect(enterDigit(segment, 5, 9, "24")).toEqual({ value: 59, buffer: undefined, done: true });
      expect(enterDigit(segment, undefined, 0, "24")).toMatchObject({ value: 0, buffer: 0, done: false });
      expect(enterDigit(segment, 0, 0, "24")).toEqual({ value: 0, buffer: undefined, done: true });
    }
  });

  it("reads digits of any script", () => {
    expect(digitValue("7")).toBe(7);
    expect(digitValue("٣")).toBe(3); // Arabic-Indic
    expect(digitValue("۰")).toBe(0); // Extended Arabic-Indic
    expect(digitValue("४")).toBe(4); // Devanagari
    expect(digitValue("０")).toBe(0); // fullwidth
    expect(digitValue("a")).toBeUndefined();
    expect(digitValue("")).toBeUndefined();
    expect(digitValue("12")).toBeUndefined();
  });

  it("takes AM and PM from a letter, by the field's own labels first", () => {
    expect(periodFromLetter("a", { am: "AM", pm: "PM" })).toBe("am");
    expect(periodFromLetter("P", { am: "AM", pm: "PM" })).toBe("pm");
    expect(periodFromLetter("x", { am: "AM", pm: "PM" })).toBeUndefined();
    expect(periodFromLetter("", { am: "AM", pm: "PM" })).toBeUndefined();
    // Labels that start with the same letter can't be told apart by it, so the plain letters decide.
    expect(periodFromLetter("p", { am: "a.m.", pm: "p.m." })).toBe("pm");
    expect(periodFromLetter("м", { am: "дп", pm: "пп" })).toBeUndefined();
    expect(periodFromLetter("п", { am: "дп", pm: "пп" })).toBe("pm");
    expect(periodFromLetter("д", { am: "дп", pm: "пп" })).toBe("am");
  });
});

describe("overlapsRange", () => {
  const at = (value: string) => parseTime(value)!;

  it("is true when the span touches the range anywhere, ends included", () => {
    expect(overlapsRange(at("09:00"), at("09:59"), at("09:59"), at("17:00"))).toBe(true);
    expect(overlapsRange(at("17:00"), at("17:59"), at("09:00"), at("17:00"))).toBe(true);
    expect(overlapsRange(at("12:00"), at("12:59"), at("09:00"), at("17:00"))).toBe(true);
  });

  it("is false when the span is wholly outside it", () => {
    expect(overlapsRange(at("08:00"), at("08:59"), at("09:00"), at("17:00"))).toBe(false);
    expect(overlapsRange(at("18:00"), at("18:59"), at("09:00"), at("17:00"))).toBe(false);
  });

  it("allows everything when the range is open", () => {
    expect(overlapsRange(at("00:00"), at("23:59"))).toBe(true);
    expect(overlapsRange(at("03:00"), at("03:59"), at("09:00"))).toBe(false);
    expect(overlapsRange(at("03:00"), at("03:59"), undefined, at("09:00"))).toBe(true);
  });
});
