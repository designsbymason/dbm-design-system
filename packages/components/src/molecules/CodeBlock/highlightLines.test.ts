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

  it("ignores a number too big to be a line, however it is written, and does not hang on it", () => {
    // 400 digits reads as `Infinity` (which a `for` loop counting up from it never leaves); 2^53 and beyond cannot be
    // counted up by one. Before these were refused, each of these kept the page busy for ever.
    const huge = "9".repeat(400);
    expect(list([huge, `-${huge}`, `${huge}-${huge}`, `1-${huge}`, `${huge}-1`, "9007199254740992", "9007199254740993", "9007199254740992-9007199254740993", 5])).toEqual([5]);
  });

  it("takes the largest whole numbers that can still be counted", () => {
    expect(list(["9007199254740991"])).toEqual([9007199254740991]);
    expect(list(["9007199254740990-9007199254740991"])).toEqual([9007199254740990, 9007199254740991]);
    expect(list(["9007199254740991-9007199254740992"])).toEqual([]);
    expect(list(["-9007199254740991"])).toEqual([-9007199254740991]);
    expect(list(["-9007199254740992"])).toEqual([]);
  });

  it("ignores an entry that is neither a number nor text, from a caller that is not TypeScript", () => {
    expect(list([null, undefined, {}, [], true, Symbol.iterator, 4] as never)).toEqual([4]);
  });

  it("ignores a range too long to be a highlight, and takes the longest that is not", () => {
    expect(list(["1-1000000000", 5])).toEqual([5]);
    expect(list(["1-10001"]).length).toBe(10001);
    expect(list(["1-10002"])).toEqual([]);
  });

  it("is empty for nothing", () => {
    expect(list(undefined)).toEqual([]);
    expect(list([])).toEqual([]);
  });
});

// The pattern that reads an entry was rewritten so its cost cannot grow with the square of the whitespace in it. The
// old pattern stands here as the oracle, so what it accepted and what it read from it are held exactly.
const oracle = (entry: string): Set<number> | undefined => {
  const match = /^\s*(-?\d+)\s*(?:-\s*(-?\d+))?\s*$/.exec(entry);
  if (!match) return undefined;
  const from = Number(match[1]);
  const to = match[2] === undefined ? from : Number(match[2]);
  if (Math.abs(to - from) > 10_000) return undefined;
  const lines = new Set<number>();
  for (let line = Math.min(from, to); line <= Math.max(from, to); line++) lines.add(line);
  return lines;
};

describe("parseHighlightLines reads an entry exactly as the pattern it replaced did", () => {
  it("on every string of up to six characters from an alphabet of a digit, a dash, blanks and a letter", () => {
    const alphabet = [" ", "\t", "\n", "1", "-", "x"];
    let checked = 0;
    const differences: string[] = [];
    const same = (a: number[], b: number[]) => a.length === b.length && a.every((line, index) => line === b[index]);
    const visit = (prefix: string, remaining: number) => {
      const expected = oracle(prefix);
      const got = [...parseHighlightLines([prefix])].sort((a, b) => a - b);
      if (!same(got, expected ? [...expected].sort((a, b) => a - b) : [])) differences.push(JSON.stringify(prefix));
      checked++;
      if (remaining === 0) return;
      for (const character of alphabet) visit(prefix + character, remaining - 1);
    };
    visit("", 6);
    expect(differences.slice(0, 5)).toEqual([]);
    expect(checked).toBeGreaterThan(50_000);
  });

  it("on the blank characters JavaScript's \\s and trim() both mean", () => {
    for (const blank of ["\u00a0", "\u2003", "\ufeff", "\u2028", "\r", "\v", "\f"]) {
      for (const entry of [`${blank}3${blank}`, `1${blank}-${blank}3`, `${blank}${blank}`]) {
        expect([...parseHighlightLines([entry])], JSON.stringify(entry)).toEqual([...(oracle(entry) ?? [])]);
      }
    }
  });
});

describe("parseHighlightLines costs time in proportion to what it is given", () => {
  // Four times the text must cost about four times as much, not sixteen: a fixed budget at one size cannot tell linear
  // from quadratic (`06-engineering-standards.md` §9). Best of three, with a floor for a cost too small to measure.
  const best = (entries: string[]) => {
    let fastest = Number.POSITIVE_INFINITY;
    for (let run = 0; run < 3; run++) {
      const start = performance.now();
      parseHighlightLines(entries);
      fastest = Math.min(fastest, performance.now() - start);
    }
    return fastest;
  };

  it.each([
    ["a number, blanks, then something else", (n: number) => [`9${" ".repeat(n)}x`]],
    ["a number, tabs, then something else", (n: number) => [`9${"\t".repeat(n)}x`]],
    ["a number, blanks, a dash, blanks, then something else", (n: number) => [`9${" ".repeat(n)}-${" ".repeat(n)}x`]],
    ["blanks only", (n: number) => [" ".repeat(n)]],
    ["blanks, then a number, then something else", (n: number) => [`${" ".repeat(n)}9x`]],
    ["dashes", (n: number) => ["-".repeat(n)]],
    ["a number and dashes", (n: number) => [`1${"-".repeat(n)}`]],
    ["digits", (n: number) => ["9".repeat(n)]],
    ["a number, blanks and dashes alternating", (n: number) => [`1${" -".repeat(n / 2)}x`]],
    ["a great many entries", (n: number) => Array.from({ length: n / 4 }, () => " 3 - 9 ")],
  ])("on %s", (_name, make) => {
    const ratio = best(make(24_000)) / Math.max(best(make(6_000)), 2);
    // Linear is 4, quadratic 16.
    expect(ratio).toBeLessThan(9);
  });
});

