import type { ComponentPropsWithoutRef, CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";
import type { PaginationProps } from "../../molecules/Pagination";
import type { TableSize, TableTone, TableVariant } from "../../molecules/Table";
import type { TableToolbarProps, TableToolbarSelectionProps } from "../../molecules/TableToolbar";

/** The way a column is ordered. */
export type DataTableSortDirection = "ascending" | "descending";

/** One column's ordering. */
export interface DataTableSortItem {
  /** The `id` of the column. */
  columnId: string;
  /** Which way it is ordered. */
  direction: DataTableSortDirection;
}

/**
 * The ordering, as a list of columns in order of weight. Pressing a header makes a list of one (or empty, to remove the
 * sort); a list of several, which only your own code can make, orders by each in turn.
 */
export type DataTableSort = DataTableSortItem[];

/** Where the sorting and the page of rows are worked out. */
export type DataTableSortMode = "client" | "manual";

/** How many rows can be chosen. */
export type DataTableSelectionMode = "none" | "single" | "multiple";

/** One column of a `DataTable`. */
export interface DataTableColumn<TRow> {
  /** A name for the column that no other has; sorting, hiding and the sort announcement refer to it. */
  id: string;
  /** The column's heading: text, or anything that names it. A heading that isn't text needs a `headerLabel`. */
  header: ReactNode;
  /**
   * The words that name the column in announcements and a screen reader's list of columns, when `header` isn't
   * text (an icon).
   */
  headerLabel?: string;
  /**
   * Reads this column's value from a row: what the cell shows when there is no `cell`, and what the column is sorted
   * by when there is no `compare`.
   */
  accessor?: (row: TRow) => unknown;
  /** Draws the cell. Without it the cell shows the `accessor`'s value as text. */
  cell?: (row: TRow, context: { index: number }) => ReactNode;
  /**
   * Lets a person sort by this column. Needs an `accessor` or a `compare`.
   * @default false
   */
  sortable?: boolean;
  /**
   * Orders two whole rows, smallest first, for a column whose value isn't a plain number, date or text. It is
   * flipped for a descending sort.
   */
  compare?: (a: TRow, b: TRow) => number;
  /**
   * Where the cell's content sits, in logical terms.
   * @default 'start'
   */
  align?: "start" | "center" | "end";
  /**
   * Marks the column as numbers: end-aligned with tabular figures.
   * @default false
   */
  numeric?: boolean;
  /** The column's width (any CSS length). Without it the column takes what its content asks for. */
  width?: CSSProperties["inlineSize"];
  /** The narrowest the column gets (any CSS length). */
  minWidth?: CSSProperties["minInlineSize"];
  /**
   * Draws this column's cells as row headers (`<th scope="row">`), so a screen reader reads a row's name when it
   * enters the row. Use it on the one column that names each row.
   * @default false
   */
  rowHeader?: boolean;
  /**
   * Lets the cell's text wrap onto several lines instead of being cut with an ellipsis. A table with any such
   * column has rows of different heights, so it is never drawn a window at a time.
   * @default false
   */
  wrap?: boolean;
}

/** The text a `DataTable` writes itself. */
export interface DataTableLabels {
  /** What is announced after a sort, for the column's `headerLabel` or header text and the way it is ordered. */
  sorted: (column: string, direction: DataTableSortDirection) => string;
  /** What is announced when the sort is taken off. */
  sortCleared: string;
  /** The name of the header checkbox that chooses every row on the page. */
  selectAll: string;
  /** The name of a row's checkbox, for the row's label. */
  selectRow: (rowLabel: string) => string;
  /** A row's label when there is no `getRowLabel`: "Row 3". */
  row: (position: number) => string;
  /** The heading of the column of checkboxes, read by a screen reader but not drawn. */
  selectColumn: string;
  /** The heading of the column of `rowActions`, read by a screen reader but not drawn. */
  actionsColumn: string;
  /** What an empty table says when there is no `emptyState`. */
  empty: string;
  /** What a screen reader hears while rows are loading. */
  loading: string;
  /** What is announced when the table's rows change because a page, a sort or a page size did: the number now shown. */
  rowsShown: (count: number, total: number) => string;
}

/** The properties of `DataTable`, whose type parameter is the shape of one row. */
export interface DataTableProps<TRow>
  extends Omit<ComponentPropsWithoutRef<"table">, "children" | "className" | "style" | "id" | "onSelect" | "onChange"> {
  /** The columns, in order. */
  columns: DataTableColumn<TRow>[];
  /** The rows. For a `manual` table this is the rows to draw now (one page, in order). */
  data: TRow[];
  /**
   * `DataTable.Toolbar`, `DataTable.Pagination` and anything else drawn around the table: a toolbar goes above it, a
   * pagination below. Only direct children of those two kinds are placed; anything else is drawn above the table.
   */
  children?: ReactNode;
  /**
   * Gives a row the id its selection is kept by. The default reads the row's `id` and then its position in `data`.
   * Give it when the rows have no `id` field and the data can be reordered or replaced.
   */
  getRowId?: (row: TRow, index: number) => string;
  /**
   * Names a row for a screen reader ("Select Ada Lovelace"). Without it a row is "Row 3".
   */
  getRowLabel?: (row: TRow, index: number) => string;
  /** The ordering. Controlled with `onSortChange`. */
  sort?: DataTableSort;
  /**
   * The ordering the table starts with.
   * @default []
   */
  defaultSort?: DataTableSort;
  /** Called with the ordering a person asked for. A controlled table changes only when `sort` does. */
  onSortChange?: (sort: DataTableSort) => void;
  /**
   * `"client"` sorts and pages `data` in the browser; `"manual"` draws `data` as given and leaves the sorting and
   * paging to the caller, who answers `onSortChange` and `onPageChange` with new rows.
   * @default 'client'
   */
  sortMode?: DataTableSortMode;
  /**
   * How many rows can be chosen: `"multiple"` adds a checkbox column with a header checkbox, `"single"` the same
   * without the header checkbox, and a new choice replaces the old.
   * @default 'none'
   */
  selectionMode?: DataTableSelectionMode;
  /** The ids of the chosen rows. Controlled with `onSelectionChange`. */
  selection?: string[];
  /**
   * The rows chosen to begin with.
   * @default []
   */
  defaultSelection?: string[];
  /** Called with the ids a person asked to have chosen. A controlled table changes only when `selection` does. */
  onSelectionChange?: (selection: string[]) => void;
  /** Says a row can't be chosen. Its checkbox is disabled, and the header checkbox leaves it out. */
  isRowSelectable?: (row: TRow) => boolean;
  /** The page, from 1. Controlled with `onPageChange`. Setting `pageSize` or adding a `DataTable.Pagination` turns paging on. */
  page?: number;
  /**
   * The page to begin on.
   * @default 1
   */
  defaultPage?: number;
  /** Called with the page a person asked for. A controlled table changes only when `page` does. */
  onPageChange?: (page: number) => void;
  /** Rows a page. Controlled with `onPageSizeChange`. */
  pageSize?: number;
  /**
   * Rows a page to begin with.
   * @default 10
   */
  defaultPageSize?: number;
  /** Called with the page size a person asked for. */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * The page sizes a person can choose from in `DataTable.Pagination`.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];
  /**
   * How many rows there are in all, for a `manual` table that holds one page of them. Without it the count is
   * `data.length`.
   */
  totalCount?: number;
  /**
   * Draws only the rows in view. `"auto"` does so above 100 rows when the table isn't paged and has a
   * `maxHeight`; `true` and `false` decide it. Needs a `maxHeight` to have anything to scroll within.
   * @default 'auto'
   */
  virtualize?: "auto" | boolean;
  /**
   * Shows placeholder rows in place of the data while it loads.
   * @default false
   */
  loading?: boolean;
  /**
   * How many placeholder rows a loading table draws.
   * @default 5
   */
  loadingRows?: number;
  /** What an empty table says: text, or an `EmptyState`. */
  emptyState?: ReactNode;
  /**
   * Draws a trailing column for each row's actions, usually an `IconButton` that opens a `Menu`. Its heading is
   * read by a screen reader and not drawn.
   */
  rowActions?: (row: TRow, index: number) => ReactNode;
  /**
   * Called when a row is pressed or Enter is pressed on it. Makes each row a tab stop, so offer the same action
   * another way as well (a link in the row), and don't rely on this alone. A press on a control inside the row
   * (a checkbox, a link, a menu button) is that control's, and doesn't reach this.
   */
  onRowClick?: (row: TRow, event: MouseEvent<HTMLTableRowElement> | KeyboardEvent<HTMLTableRowElement>) => void;
  /** The ids of the columns that are not drawn. Controlled with `onHiddenColumnsChange`. */
  hiddenColumns?: string[];
  /**
   * The columns hidden to begin with.
   * @default []
   */
  defaultHiddenColumns?: string[];
  /** Called with the ids a person asked to have hidden. */
  onHiddenColumnsChange?: (hidden: string[]) => void;
  /**
   * The table's frame: `"bordered"` or `"ghost"` (inside a `Card`).
   * @default 'bordered'
   */
  variant?: TableVariant;
  /**
   * The table's colour treatment, the same as `Table`'s.
   * @default 'neutral'
   */
  tone?: TableTone;
  /**
   * Cell padding, type and the height of a row, on the standard scale.
   * @default 'md'
   */
  size?: TableSize;
  /**
   * Alternates the background of every other row.
   * @default false
   */
  striped?: boolean;
  /**
   * Highlights the row under the pointer. A table with `onRowClick` highlights anyway.
   * @default true
   */
  hoverable?: boolean;
  /**
   * Pins the header row to the top of the table's scroll area. Needs a `maxHeight`.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * Pins the first column (the checkbox column when there is one) to the start edge while the rest scrolls
   * sideways.
   * @default false
   */
  stickyFirstColumn?: boolean;
  /**
   * Pins the last column (the actions column when there is one) to the end edge while the rest scrolls sideways.
   * @default false
   */
  stickyLastColumn?: boolean;
  /** Caps the height of the scroll area (any CSS `max-height`), so a long body scrolls inside it. */
  maxHeight?: CSSProperties["maxHeight"];
  /** Text written for the table, replacing the English defaults one by one. */
  labels?: Partial<DataTableLabels>;
  /**
   * Writes the numbers the table displays (a count in an announcement).
   * @default String
   */
  formatNumber?: (value: number) => string;
  /**
   * A visible title for the table, drawn as its `<caption>`. Names the table for assistive technology; give this,
   * an `aria-label` or an `aria-labelledby`.
   */
  caption?: ReactNode;
  /** Names the table, when there is no visible caption. */
  "aria-label"?: string;
  /** The id of an element that names the table. */
  "aria-labelledby"?: string;
  /** The id of an element that describes the table. */
  "aria-describedby"?: string;
  /** Additional CSS classes, for the box that holds the toolbar, table and pagination. */
  className?: string;
  /** Inline styles for that same box. */
  style?: CSSProperties;
  /** Standard DOM id, applied to the `<table>` element. */
  id?: string;
  /** Test identifier, applied to the `<table>` element. */
  "data-testid"?: string;
}

/** The properties of `DataTable.Toolbar`: a `TableToolbar` drawn above the table. */
export type DataTableToolbarProps = TableToolbarProps;

/** The properties of `DataTable.Selection`: `TableToolbar.Selection` read from the table's own selection. */
export interface DataTableSelectionProps extends Omit<TableToolbarSelectionProps, "count" | "totalCount" | "onClear"> {
  /**
   * Called to choose every row, for a table whose `data` holds only one page (a `manual` one). A `client` table
   * chooses every selectable row itself when this is left out.
   */
  onSelectAll?: () => void;
}

/** The text `DataTable.Pagination` writes itself. */
export interface DataTablePaginationLabels {
  /** The range of rows shown: "1–10 of 47". */
  summary: (first: number, last: number, total: number) => string;
  /** The name of the page size select. */
  pageSize: string;
}

/** The properties of `DataTable.Pagination`: the page controls, a range summary and a page size select. */
export interface DataTablePaginationProps
  extends Omit<PaginationProps, "pageCount" | "value" | "defaultValue" | "onValueChange" | "labels" | "formatNumber"> {
  /**
   * Shows "1–10 of 47" beside the page numbers.
   * @default true
   */
  showSummary?: boolean;
  /**
   * Shows a select for how many rows a page, from the table's `pageSizeOptions`.
   * @default true
   */
  showPageSize?: boolean;
  /** Text written for the pagination (the page controls keep `Pagination`'s own labels). */
  labels?: Partial<DataTablePaginationLabels>;
  /**
   * The labels of the `Pagination` inside, replacing its English defaults one by one.
   */
  paginationLabels?: PaginationProps["labels"];
  /**
   * Writes the numbers the pagination displays.
   * @default String
   */
  formatNumber?: (value: number) => string;
}
