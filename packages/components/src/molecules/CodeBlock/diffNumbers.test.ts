import { describe, expect, it } from "vitest";
import { diffGutter, parseDiffNumbers } from "./diffNumbers";

const rows = (diff: string) => diff.split("\n");

const twoFiles = [
  "diff --git a/one.ts b/one.ts",
  "index 1111111..2222222 100644",
  "--- a/one.ts",
  "+++ b/one.ts",
  "@@ -12,3 +12,4 @@ export function total() {",
  "   const a = 1;",
  "-  return a;",
  "+  const b = 2;",
  "+  return a + b;",
  " }",
  "diff --git a/two.ts b/two.ts",
  "--- a/two.ts",
  "+++ b/two.ts",
  "@@ -1,2 +1,2 @@",
  "-old",
  "+new",
  " same",
].join("\n");

describe("parseDiffNumbers", () => {
  it("numbers context lines in both files, a removed line in the old only and an added line in the new only", () => {
    expect(parseDiffNumbers(rows(twoFiles))?.slice(4, 10)).toEqual([
      undefined,
      { old: 12, new: 12 },
      { old: 13 },
      { new: 13 },
      { new: 14 },
      { old: 14, new: 15 },
    ]);
  });

  it("gives a header, a file header and anything outside a hunk no numbers", () => {
    const numbers = parseDiffNumbers(rows(twoFiles)) ?? [];
    for (const index of [0, 1, 2, 3, 4, 10, 11, 12, 13]) expect(numbers[index], `row ${index}`).toBeUndefined();
  });

  it("uses the hunk's counts to end it, so the next file's --- and +++ are not a removed and an added line", () => {
    const numbers = parseDiffNumbers(rows(twoFiles)) ?? [];
    expect(numbers[11]).toBeUndefined();
    expect(numbers[12]).toBeUndefined();
    expect(numbers.slice(14)).toEqual([{ old: 1 }, { new: 1 }, { old: 2, new: 2 }]);
  });

  it("starts each hunk from its own header, so several hunks in one file are each numbered from theirs", () => {
    const numbers = parseDiffNumbers(rows("@@ -1,2 +1,2 @@\n a\n-b\n+c\n@@ -20,2 +20,3 @@\n x\n+y\n z"));
    expect(numbers).toEqual([undefined, { old: 1, new: 1 }, { old: 2 }, { new: 2 }, undefined, { old: 20, new: 20 }, { new: 21 }, { old: 21, new: 22 }]);
  });

  it("reads a missing count as one", () => {
    expect(parseDiffNumbers(rows("@@ -5 +5 @@\n-a\n+b"))).toEqual([undefined, { old: 5 }, { new: 5 }]);
  });

  it("ends a hunk once both its counts are used up, on either side's lines", () => {
    // A missing count is one, on each side: `-a` and `+b` use them up, so `+c` and `-d` are outside it.
    expect(parseDiffNumbers(rows("@@ -5 +5 @@\n-a\n+b\n+c\n-d"))).toEqual([undefined, { old: 5 }, { new: 5 }, undefined, undefined]);
    // The same for stated counts, and a removed line uses up the old count alone, an added one the new alone.
    expect(parseDiffNumbers(rows("@@ -1,1 +1,1 @@\n-a\n+b\n-c\n+d"))).toEqual([undefined, { old: 1 }, { new: 1 }, undefined, undefined]);
    expect(parseDiffNumbers(rows("@@ -1,2 +1,1 @@\n-a\n-b\n+c\n+d"))).toEqual([undefined, { old: 1 }, { old: 2 }, { new: 1 }, undefined]);
    expect(parseDiffNumbers(rows("@@ -1,1 +1,2 @@\n+a\n+b\n-c\n+d"))).toEqual([undefined, { new: 1 }, { new: 2 }, { old: 1 }, undefined]);
  });

  it("reads a missing count as one on whichever side omits it, next to a stated count on the other", () => {
    expect(parseDiffNumbers(rows("@@ -5 +5,2 @@\n+a\n+b\n-c"))).toEqual([undefined, { new: 5 }, { new: 6 }, { old: 5 }]);
    expect(parseDiffNumbers(rows("@@ -5,2 +5 @@\n-a\n-b\n+c"))).toEqual([undefined, { old: 5 }, { old: 6 }, { new: 5 }]);
  });

  it("takes a hunk that adds or removes everything (a zero count on one side)", () => {
    expect(parseDiffNumbers(rows("@@ -0,0 +1,2 @@\n+a\n+b"))).toEqual([undefined, { new: 1 }, { new: 2 }]);
    expect(parseDiffNumbers(rows("@@ -3,2 +0,0 @@\n-a\n-b"))).toEqual([undefined, { old: 3 }, { old: 4 }]);
  });

  it("takes a blank line inside a hunk for a context line, as diffs written by hand often trim it to nothing", () => {
    expect(parseDiffNumbers(rows("@@ -1,3 +1,3 @@\n a\n\n b"))).toEqual([undefined, { old: 1, new: 1 }, { old: 2, new: 2 }, { old: 3, new: 3 }]);
  });

  it("gives a `\\ No newline at end of file` marker no numbers and does not count it", () => {
    expect(parseDiffNumbers(rows("@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+b\n\\ No newline at end of file"))).toEqual([
      undefined, { old: 1 }, undefined, { new: 1 }, undefined,
    ]);
  });

  it("has nothing to number in a diff with no hunk header", () => {
    expect(parseDiffNumbers(rows("- const size = 'md';\n+ const size = 'lg';"))).toBeUndefined();
    expect(parseDiffNumbers(rows("diff --git a/x b/x\n--- a/x\n+++ b/x"))).toBeUndefined();
    expect(parseDiffNumbers([])).toBeUndefined();
    expect(parseDiffNumbers([""])).toBeUndefined();
  });

  it("does not take a combined diff's header, a malformed one or one with a huge number for a hunk", () => {
    expect(parseDiffNumbers(rows("@@@ -1,2 -1,2 +1,3 @@@\n a"))).toBeUndefined();
    expect(parseDiffNumbers(rows("@@ -x +1 @@\n a"))).toBeUndefined();
    expect(parseDiffNumbers(rows("@@ -1,2 +1,2\n a"))).toBeUndefined();
    expect(parseDiffNumbers(rows(`@@ -${"9".repeat(40)} +1 @@\n a`))).toBeUndefined();
  });

  it("stops numbering when the hunk has fewer lines than it says and another header follows", () => {
    expect(parseDiffNumbers(rows("@@ -1,5 +1,5 @@\n a\n@@ -9,1 +9,1 @@\n-b"))).toEqual([undefined, { old: 1, new: 1 }, undefined, { old: 9 }]);
  });

  it("ends a hunk at a row it cannot hold, so a wrong count does not run into the next file's header", () => {
    // The header claims five lines each side and the hunk has two.
    expect(parseDiffNumbers(rows("@@ -1,5 +1,5 @@\n a\n-b\ndiff --git a/x b/x\nindex 1..2\n--- a/x\n+++ b/x\n@@ -3 +3 @@\n+c"))).toEqual([
      undefined, { old: 1, new: 1 }, { old: 2 }, undefined, undefined, undefined, undefined, undefined, { new: 3 },
    ]);
  });

  it("finds a header only at the start of a row", () => {
    expect(parseDiffNumbers(rows(" @@ -1 +1 @@\n-a"))).toBeUndefined();
    expect(parseDiffNumbers(rows("+@@ -1 +1 @@"))).toBeUndefined();
  });

  it("does not count a line outside its hunk's counts, even when it starts with + or -", () => {
    expect(parseDiffNumbers(rows("@@ -1 +1 @@\n a\n+not in the hunk\n-nor this"))).toEqual([undefined, { old: 1, new: 1 }, undefined, undefined]);
  });

  it("costs time in proportion to the number of rows", () => {
    const big = Array.from({ length: 200_000 }, (_, index) => (index % 3 === 0 ? "@@ -1,1 +1,1 @@" : "+x"));
    const start = performance.now();
    parseDiffNumbers(big);
    expect(performance.now() - start).toBeLessThan(500);
    const hostile = ["@@ -1,1 +1,1 @@".repeat(20_000)];
    const started = performance.now();
    parseDiffNumbers(hostile);
    expect(performance.now() - started).toBeLessThan(250);
  });
});

describe("diffGutter", () => {
  it("draws an old and a new column of the same width, blank where a row has no number", () => {
    const { text, digits } = diffGutter([undefined, { old: 12, new: 12 }, { old: 13 }, { new: 13 }, { old: 9, new: 100 }]);
    expect(digits).toBe(3);
    expect(text).toEqual([
      "        ", // a row with no numbers keeps the columns, so the code stays aligned
      " 12   12",
      " 13     ",
      "      13",
      "  9  100",
    ]);
    expect(new Set(text.map((row) => row.length))).toEqual(new Set([8]));
  });

  it("is one digit wide for a diff of single-digit numbers, and never zero", () => {
    expect(diffGutter([{ old: 1, new: 1 }, undefined]).digits).toBe(1);
    expect(diffGutter([undefined]).digits).toBe(1);
    expect(diffGutter([]).text).toEqual([]);
  });
});
