import { useCallback, useSyncExternalStore } from "react";
import type { RefObject } from "react";

const noop = () => {};

// The table's first row spans every column exactly once (a `rowSpan` cell is
// counted where it starts, and `colSpan` cells count for the columns they
// cover), so summing its cells' `colSpan`s gives the table's total column
// count — including a grouped header whose first row has fewer, wider cells
// than the row beneath it. `HTMLTableElement.rows` lists only this table's own
// rows (header, body, footer, in that order), so a table nested inside a cell
// never contributes.
const readColumnCount = (table: HTMLTableElement | null): number => {
  const firstRow = table?.rows[0];
  if (!firstRow) return 1;
  const count = Array.from(firstRow.cells).reduce((total, cell) => total + cell.colSpan, 0);
  return count || 1;
};

/**
 * How many columns a table has, read from the DOM — what `Table.Empty` and a
 * loading `Table.Body` need to span or fill the table without the consumer
 * counting columns by hand.
 *
 * Built on `useSyncExternalStore` for the same reason `useScrollableRegion` is:
 * the DOM is external state React doesn't own, and re-reading it right after
 * the first commit (before paint) means the empty/loading rows are already the
 * right width on the first frame rather than a tick later. Re-read on every
 * render, and again when the table's size changes (which is what adding or
 * removing a column does).
 *
 * Falls back to `1` before the table exists, on the server, and where
 * `ResizeObserver` is missing (it then simply never re-checks after the first
 * commit, rather than crashing).
 */
export function useColumnCount(tableRef: RefObject<HTMLTableElement | null>): number {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const table = tableRef.current;
      if (!table || typeof ResizeObserver === "undefined") return noop;
      const observer = new ResizeObserver(onChange);
      observer.observe(table);
      return () => observer.disconnect();
    },
    [tableRef],
  );

  return useSyncExternalStore(
    subscribe,
    () => readColumnCount(tableRef.current),
    () => 1,
  );
}
