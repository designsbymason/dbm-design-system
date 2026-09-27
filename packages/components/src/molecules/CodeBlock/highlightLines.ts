/**
 * Turns `highlightLines` (`[2, "4-6", 9]`) into the set of line numbers it names. An entry that isn't a whole
 * number or an `a-b` range of them is ignored, and a range written backwards (`"6-4"`) means the same as `"4-6"`.
 */
export function parseHighlightLines(entries: ReadonlyArray<number | string> | undefined): Set<number> {
  const lines = new Set<number>();
  for (const entry of entries ?? []) {
    if (typeof entry === "number") {
      if (Number.isInteger(entry)) lines.add(entry);
      continue;
    }
    // From a caller that is not TypeScript, an entry can be anything: only text can name a range.
    if (typeof entry !== "string") continue;
    // Trimmed first, so no whitespace run sits next to another one in the pattern: `\s*(…)?\s*$` on a number followed
    // by many spaces and something else is tried in every way of sharing the spaces between the two runs, which costs
    // the square of their number (found by a code scanner, on a `highlightLines` entry of 40,000 spaces: 0.6s).
    const match = /^(-?\d+)(?:\s*-\s*(-?\d+))?$/.exec(entry.trim());
    if (!match) continue;
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    // A number with hundreds of digits reads as `Infinity`, and one past 2^53 cannot be counted up by one: neither is a
    // line, and either would have kept the loop below running for ever (`Infinity++` is `Infinity`).
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) continue;
    // A range this long is not a highlight; the cap stops `"1-1000000000"` from building a huge set.
    const count = Math.abs(to - from);
    if (count > 10_000) continue;
    // Counted, not compared, so the loop is at most `count + 1` steps whatever the numbers are.
    const first = Math.min(from, to);
    for (let step = 0; step <= count; step++) lines.add(first + step);
  }
  return lines;
}
