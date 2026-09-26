import { describe, expect, it } from "vitest";
import { parseHighlightLines } from "./highlightLines";

const list = (entries?: Array<number | string>) => [...parseHighlightLines(entries)].sort((a, b) => a - b);

describe("parseHighlightLines", () => {
  it("names single lines and ranges", () => {
    expect(list([2, "4-6", 9])).toEqual([2, 4, 5, 6, 9]);
    expect(list(["3"])).toEqual([3]);
  });

  it("reads a range written backwards the same way", () => {
    expect(list(["6-4"])).toEqual([4, 5, 6]);
  });

  it("allows spaces, and keeps the same line only once", () => {
    expect(list([" 2 ", "1 - 3", 3])).toEqual([1, 2, 3]);
  });

  it("ignores what is not a whole number or a range of them", () => {
    expect(list([1.5, Number.NaN, "x", "1-", "-", "", "1-2-3", "2.5", "a-b"])).toEqual([]);
  });

  it("ignores a range too long to be a highlight", () => {
    expect(list(["1-1000000000", 5])).toEqual([5]);
  });

  it("is empty for nothing", () => {
    expect(list(undefined)).toEqual([]);
    expect(list([])).toEqual([]);
  });
});
