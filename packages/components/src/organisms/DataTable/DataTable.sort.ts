import type { DataTableSort, DataTableSortDirection } from "./DataTable.types";

/** What a column needs to be sorted: how to read a value from a row, and an optional comparison of two whole rows. */
export interface SortableColumn<TRow> {
  id: string;
  accessor?: (row: TRow) => unknown;
  compare?: (a: TRow, b: TRow) => number;
}

const isEmpty = (value: unknown): boolean => value === null || value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value));

/** Orders two values of any common kind: numbers and dates by size, booleans false first, text by natural order. */
export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "bigint" && typeof b === "bigint") return a < b ? -1 : a > b ? 1 : 0;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/** The next direction when a column's header is pressed: none, then ascending, then descending, then none again. */
export function nextDirection(current: DataTableSortDirection | undefined): DataTableSortDirection | undefined {
  if (current === undefined) return "ascending";
  return current === "ascending" ? "descending" : undefined;
}

/** The direction `columnId` is sorted in, if it is. */
export function directionOf(sort: DataTableSort, columnId: string): DataTableSortDirection | undefined {
  return sort.find((item) => item.columnId === columnId)?.direction;
}

/**
 * Returns the rows in the order `sort` asks for, without touching the input. Rows that tie keep their original
 * order, and an empty value (`null`, `undefined`, `""`, `NaN`) goes last in either direction, since reversing it to the
 * top would put the least useful rows first. A sort naming a column that isn't there is ignored.
 */
export function sortRows<TRow>(rows: readonly TRow[], sort: DataTableSort, columns: readonly SortableColumn<TRow>[]): TRow[] {
  const active = sort.flatMap((item) => {
    const column = columns.find((candidate) => candidate.id === item.columnId);
    return column ? [{ column, sign: item.direction === "descending" ? -1 : 1 }] : [];
  });
  if (active.length === 0) return [...rows];
  const indexed = rows.map((row, index) => ({ row, index }));
  indexed.sort((left, right) => {
    for (const { column, sign } of active) {
      let result: number;
      if (column.compare) {
        result = column.compare(left.row, right.row) * sign;
      } else {
        const a = column.accessor?.(left.row);
        const b = column.accessor?.(right.row);
        const aEmpty = isEmpty(a);
        const bEmpty = isEmpty(b);
        if (aEmpty || bEmpty) result = aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
        else result = compareValues(a, b) * sign;
      }
      if (result !== 0 && Number.isFinite(result)) return result;
    }
    return left.index - right.index;
  });
  return indexed.map((entry) => entry.row);
}
