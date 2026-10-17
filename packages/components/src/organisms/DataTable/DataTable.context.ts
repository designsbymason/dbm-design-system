import { createContext, useContext, useState } from "react";
import type { DataTableSort } from "./DataTable.types";

/** What the parts of a `DataTable` (and your own code inside it) can read and change. */
export interface DataTableState {
  /** The ids of the chosen rows. */
  selection: string[];
  /** Replaces the chosen rows. */
  setSelection: (selection: string[]) => void;
  /** How many rows are chosen: every one of the table when `allSelected`, else the length of `selection`. */
  selectedCount: number;
  /** Whether every row of the whole table is chosen, on every page, without their ids being listed. */
  allSelected: boolean;
  /** Chooses every row of the whole table, or goes back to the list of ids. */
  setAllSelected: (allSelected: boolean) => void;
  /** Un-chooses every row. */
  clearSelection: () => void;
  /** How many rows can be chosen in all: the selectable rows of a `client` table, `totalCount` of a `manual` one. */
  selectableCount: number | undefined;
  /** The ordering. */
  sort: DataTableSort;
  /** Changes the ordering. */
  setSort: (sort: DataTableSort) => void;
  /** The page, from 1. */
  page: number;
  /** Changes the page. */
  setPage: (page: number) => void;
  /** How many pages there are. */
  pageCount: number;
  /** Rows a page. */
  pageSize: number;
  /** Changes the page size, and goes back to page 1. */
  setPageSize: (pageSize: number) => void;
  /** The page sizes a person can choose from. */
  pageSizeOptions: number[];
  /** How many rows there are in all. */
  total: number;
  /** Whether the table is divided into pages. */
  paginated: boolean;
  /** The widths a person has given columns, in pixels, by column id. */
  columnWidths: Record<string, number>;
  /** Replaces the widths given to columns. */
  setColumnWidths: (widths: Record<string, number>) => void;
  /** Every column's id and the words that name it, hidden or not. */
  columns: Array<{ id: string; label: string }>;
  /** The ids of the columns that are not drawn. */
  hiddenColumns: string[];
  /** Changes which columns are drawn. */
  setHiddenColumns: (hidden: string[]) => void;
  /** Chooses every row: the ids of a `client` table, or "all of them" for a `manual` one that knows its `totalCount`. */
  selectAllRows: (() => void) | undefined;
}

export const DataTableContext = createContext<DataTableState | null>(null);

/**
 * The state of the `DataTable` this is drawn inside: its selection, sort, page and hidden columns, and the functions
 * that change them. Use it to build your own parts (a column menu from `Menu.CheckboxItem`s, a "clear sort" button).
 * It must be called inside the table's children (`DataTable.Toolbar`, `DataTable.Pagination`).
 *
 * @example
 * ```tsx
 * function ColumnMenu() {
 *   const { columns, hiddenColumns, setHiddenColumns } = useDataTable();
 *   // one Menu.CheckboxItem per column, checked unless its id is in `hiddenColumns`
 * }
 * ```
 */
export function useDataTable(): DataTableState {
  const state = useContext(DataTableContext);
  if (!state) throw new Error("useDataTable must be used inside a DataTable, in its children.");
  return state;
}

/**
 * A value a component either owns or is told: controlled when the parent passes `controlled` (and then only the parent
 * changes it), otherwise held here from `initial`. Either way `onChange` hears the value asked for.
 */
export function useControllableValue<T>(controlled: T | undefined, initial: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = useState(initial);
  const change = (next: T) => {
    if (controlled === undefined) setUncontrolled(next);
    onChange?.(next);
  };
  return [controlled === undefined ? uncontrolled : controlled, change];
}
