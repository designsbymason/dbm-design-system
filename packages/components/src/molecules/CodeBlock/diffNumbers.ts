/** The line numbers of one row of a unified diff: where it sits in the old file, the new file, or both. */
export interface DiffRowNumbers {
  old?: number;
  new?: number;
}

// `@@ -12,4 +12,5 @@`: where a hunk starts and how many lines it covers in the old and new file (a missing count is 1).
const HUNK = /^@@ -(\d{1,9})(?:,(\d{1,9}))? \+(\d{1,9})(?:,(\d{1,9}))? @@/;

/**
 * The old and new line number of every row of a unified diff, read from its `@@ -a,b +c,d @@` hunk headers, or
 * `undefined` when it has none (a hand-written `-`/`+` snippet has no file positions to show). A removed line has an
 * old number only, an added line a new one only, and a context line both; a header, a `\ No newline at end of file`
 * marker and anything outside a hunk (`diff --git`, `---`, `+++`, `index`) has none.
 *
 * The hunk's own counts say where it ends, so the `---` and `+++` lines that open the next file's header are not
 * taken for a removed and an added line, and a row that cannot be part of a hunk (it starts with none of a space, `+`
 * or `-`) ends it early, so a hand-edited diff with wrong counts does not run on into the next file's header. One pass over the rows: the cost is proportional to their number.
 */
export function parseDiffNumbers(rows: readonly string[]): Array<DiffRowNumbers | undefined> | undefined {
  const numbers: Array<DiffRowNumbers | undefined> = [];
  let found = false;
  let oldLine = 0;
  let newLine = 0;
  let oldLeft = 0;
  let newLeft = 0;
  for (const row of rows) {
    const header = HUNK.exec(row);
    if (header) {
      found = true;
      oldLine = Number(header[1]);
      oldLeft = header[2] === undefined ? 1 : Number(header[2]);
      newLine = Number(header[3]);
      newLeft = header[4] === undefined ? 1 : Number(header[4]);
      numbers.push(undefined);
    } else if ((oldLeft <= 0 && newLeft <= 0) || row.startsWith("\\")) {
      numbers.push(undefined);
    } else if (row !== "" && !" +-".includes(row[0] as string)) {
      // A row a hunk cannot hold (`diff --git`, `index`): the hunk ended early, whatever its counts said.
      oldLeft = 0;
      newLeft = 0;
      numbers.push(undefined);
    } else if (row.startsWith("+")) {
      numbers.push({ new: newLine++ });
      newLeft--;
    } else if (row.startsWith("-")) {
      numbers.push({ old: oldLine++ });
      oldLeft--;
    } else {
      // A context line starts with a space; a blank one is often written with nothing at all.
      numbers.push({ old: oldLine++, new: newLine++ });
      oldLeft--;
      newLeft--;
    }
  }
  return found ? numbers : undefined;
}

/**
 * The text drawn in the gutter of each row, an old column and a new column of the same width (padded with spaces, which
 * line up because the code is monospaced), and the width of one column. A row with no numbers gets blank columns, so
 * the code stays aligned.
 */
export function diffGutter(numbers: ReadonlyArray<DiffRowNumbers | undefined>): { text: string[]; digits: number } {
  let digits = 1;
  for (const row of numbers) {
    if (row?.old !== undefined) digits = Math.max(digits, String(row.old).length);
    if (row?.new !== undefined) digits = Math.max(digits, String(row.new).length);
  }
  const column = (value: number | undefined) => (value === undefined ? "" : String(value)).padStart(digits, " ");
  return { text: numbers.map((row) => `${column(row?.old)}  ${column(row?.new)}`), digits };
}
