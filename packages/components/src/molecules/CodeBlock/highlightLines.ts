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
    const match = /^\s*(-?\d+)\s*(?:-\s*(-?\d+))?\s*$/.exec(entry);
    if (!match) continue;
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    // A range this long is not a highlight; the cap stops `"1-1000000000"` from building a huge set.
    if (Math.abs(to - from) > 10_000) continue;
    for (let line = Math.min(from, to); line <= Math.max(from, to); line++) lines.add(line);
  }
  return lines;
}
