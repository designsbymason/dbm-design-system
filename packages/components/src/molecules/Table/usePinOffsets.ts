import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { CSSProperties, RefObject } from "react";

/** The most columns a table pins at either edge. */
export const MAX_PINNED_COLUMNS = 4;

const noop = () => {};

/** How many columns `stickyFirstColumn` / `stickyLastColumn` asks to pin: `true` is one, a number is that many, held to 0–4. */
export function pinCount(value: boolean | number | undefined): number {
  if (value === true) return 1;
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(MAX_PINNED_COLUMNS, Math.max(0, Math.floor(value)));
}

// The widths, in pixels, of the cells of the table's first row (its header, normally), joined into one string so the snapshot is a
// primitive that compares by value. A pinned column sits against the ones pinned before it, so each offset is the sum of the widths
// between it and the edge.
const readWidths = (table: HTMLTableElement | null): string => {
  const row = table?.rows[0];
  if (!row) return "";
  return Array.from(row.cells, (cell) => cell.getBoundingClientRect().width.toFixed(2)).join(",");
};

/**
 * The custom properties that put a pinned column's `inset-inline-start` (or `-end`) where the columns pinned before it end, for a
 * table that pins more than one column at an edge: `--pin-start-2` … and `--pin-end-2` …. One column needs none (it sits at the
 * edge). The widths are read from the DOM and read again when the table or one of its cells is resized, so a column that
 * grows pushes the next pinned one along with it. `undefined` where nothing needs measuring, on the server and where
 * `ResizeObserver` is missing (the later columns then sit at the edge until they are measured, rather than crashing).
 */
export function usePinOffsets(
  tableRef: RefObject<HTMLTableElement | null>,
  start: number,
  end: number,
): CSSProperties | undefined {
  const needed = start > 1 || end > 1;
  const subscribe = useCallback(
    (onChange: () => void) => {
      const table = tableRef.current;
      if (!needed || !table || typeof ResizeObserver === "undefined") return noop;
      const resize = new ResizeObserver(onChange);
      const watch = () => {
        resize.disconnect();
        resize.observe(table);
        for (const cell of Array.from(table.rows[0]?.cells ?? [])) resize.observe(cell);
      };
      watch();
      // A column added or taken away changes which cells there are to watch.
      const mutation = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(() => {
        watch();
        onChange();
      });
      if (table.rows[0]) mutation?.observe(table.rows[0], { childList: true });
      return () => {
        resize.disconnect();
        mutation?.disconnect();
      };
    },
    [tableRef, needed],
  );
  const widths = useSyncExternalStore(
    subscribe,
    () => (needed ? readWidths(tableRef.current) : ""),
    () => "",
  );
  return useMemo(() => {
    if (!needed || !widths) return undefined;
    const sizes = widths.split(",").map(Number);
    const style: Record<string, string> = {};
    for (let position = 2; position <= start; position += 1) {
      style[`--pin-start-${position}`] = `${sizes.slice(0, position - 1).reduce((total, width) => total + width, 0)}px`;
    }
    for (let position = 2; position <= end; position += 1) {
      style[`--pin-end-${position}`] = `${sizes.slice(sizes.length - (position - 1)).reduce((total, width) => total + width, 0)}px`;
    }
    return style as CSSProperties;
  }, [needed, widths, start, end]);
}
