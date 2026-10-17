import { describe, expect, it } from "vitest";
import { clampPage, pageCountOf, rangeOf } from "./DataTable.page";

describe("pageCountOf", () => {
  it("rounds up, and is at least one", () => {
    expect(pageCountOf(47, 10)).toBe(5);
    expect(pageCountOf(50, 10)).toBe(5);
    expect(pageCountOf(0, 10)).toBe(1);
  });
  it("copes with a bad page size or count", () => {
    expect(pageCountOf(10, 0)).toBe(1);
    expect(pageCountOf(Number.NaN, 10)).toBe(1);
    expect(pageCountOf(Number.POSITIVE_INFINITY, 10)).toBe(1);
  });
});

describe("clampPage", () => {
  it("holds a page to the pages there are", () => {
    expect(clampPage(9, 5)).toBe(5);
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(2.7, 5)).toBe(2);
    expect(clampPage(Number.NaN, 5)).toBe(1);
  });
});

describe("rangeOf", () => {
  it("gives the first and last row of a page, and a short last page", () => {
    expect(rangeOf(1, 10, 47)).toEqual({ first: 1, last: 10, shown: 10 });
    expect(rangeOf(5, 10, 47)).toEqual({ first: 41, last: 47, shown: 7 });
  });
  it("is zero for an empty table", () => {
    expect(rangeOf(1, 10, 0)).toEqual({ first: 0, last: 0, shown: 0 });
  });
});
