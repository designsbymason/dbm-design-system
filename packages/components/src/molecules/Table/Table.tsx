import { cx, mergeRefs } from "@dbm-design-system/primitives";
import { createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef } from "react";
import { Skeleton } from "../../atoms/Skeleton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./Table.module.css";
import type {
  TableBodyProps,
  TableCaptionProps,
  TableCellAlign,
  TableCellProps,
  TableEmptyProps,
  TableFooterProps,
  TableHeaderCellProps,
  TableHeaderProps,
  TableProps,
  TableRowProps,
  TableSize,
  TableTone,
} from "./Table.types";
import { useColumnCount } from "./useColumnCount";
import { useScrollableRegion } from "./useScrollableRegion";

interface TableContextValue {
  tone: TableTone;
  size: TableSize;
  striped: boolean;
  hoverable: boolean;
  stickyHeader: boolean;
  stickyFirstColumn: boolean;
  columnCount: number;
  captionId: string | undefined;
}

// Each `Table` provides its own value, so a table nested inside a cell reads
// its own settings rather than leaking the outer table's — sub-parts style
// themselves from this context (never from descendant selectors) for the
// same reason.
const TableContext = createContext<TableContextValue>({
  tone: "neutral",
  size: "md",
  striped: false,
  hoverable: false,
  stickyHeader: false,
  stickyFirstColumn: false,
  columnCount: 1,
  captionId: undefined,
});

const sizeClass: Record<TableSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

// Each non-neutral tone's class only *defines* that tone's four colours as
// local custom properties (solid fill, on-solid text, subtle stripe, subtle
// hover) — the shared `*Tinted` rules read them, so five tones need five short
// definitions instead of five copies of every header/caption/stripe/hover
// rule. `neutral` has no class: its treatment is the un-tinted base styling.
const toneClass: Record<TableTone, string | undefined> = {
  neutral: undefined,
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

const alignClass: Record<TableCellAlign, string | undefined> = {
  start: undefined,
  center: styles.alignCenter,
  end: styles.alignEnd,
};

/**
 * A lightweight, non-interactive table for presenting tabular data — real
 * `<table>` semantics with DBM's own styling, density, and responsive
 * scrolling. A compound component: compose `Table.Caption`,
 * `Table.Header`, `Table.Body`, and `Table.Footer` (each holding
 * `Table.Row`s of `Table.HeaderCell`s/`Table.Cell`s) inside `Table` itself.
 * Each sub-part renders the native element its name suggests
 * (`<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, `<td>`, `<caption>`), so
 * native table semantics and attributes (`colSpan`, `rowSpan`, `scope`,
 * `headers`) all work directly.
 *
 * Deliberately has no sorting, selection, or pagination — a sortable,
 * selectable, paginated table is `DataTable`'s job (a future organism built
 * on this one).
 *
 * The `<table>` is always wrapped in its own scroll container, so a wide
 * table scrolls sideways inside its own frame instead of overflowing the
 * page on narrow screens. While (and only while) that container actually
 * overflows, it becomes a keyboard-focusable region named after the table's
 * `Table.Caption` (or `aria-label`/`aria-labelledby`) — WCAG requires a
 * scrollable region to be operable from the keyboard, but a permanent tab
 * stop on every table that fits would just be noise.
 *
 * `ref`, `className`, `style`, `id`, `data-testid`, `aria-*`, and every
 * other native attribute apply to the `<table>` element itself, where
 * assistive technology expects them. `containerClassName` and `maxHeight`
 * target the scroll container instead.
 *
 * @example
 * ```tsx
 * <Table striped>
 *   <Table.Caption>Recent invoices</Table.Caption>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.HeaderCell>Invoice</Table.HeaderCell>
 *       <Table.HeaderCell>Status</Table.HeaderCell>
 *       <Table.HeaderCell align="end">Amount</Table.HeaderCell>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.HeaderCell scope="row">INV-001</Table.HeaderCell>
 *       <Table.Cell>Paid</Table.Cell>
 *       <Table.Cell align="end">$250.00</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */
const TableRoot = forwardRef<HTMLTableElement, TableProps>((tableProps, ref) => {
  const {
    children,
    variant = "bordered",
    tone = "neutral",
    size = "md",
    striped = false,
    hoverable = false,
    stickyHeader = false,
    stickyFirstColumn = false,
    maxHeight,
    containerClassName,
    className,
    style,
    id,
    "data-testid": dataTestId,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    ...rest
  } = tableProps;

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const { scrollable, captionId } = useScrollableRegion(containerRef);
  const columnCount = useColumnCount(tableRef);
  const generatedCaptionId = useId();

  // A dev-mode misuse warning, run as an effect rather than read-and-set from a
  // ref during render: it only ever fires after commit, needs no ref at all, and
  // still warns just once for as long as the props are unchanged.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && stickyHeader && maxHeight === undefined && !containerClassName) {
      console.warn(
        "Table: `stickyHeader` has no effect without a constrained height — the table never scrolls vertically, so there is nothing for the header to stay pinned against. Set `maxHeight` (e.g. `maxHeight=\"24rem\"`), or constrain the scroll container yourself via `containerClassName`.",
      );
    }
  }, [stickyHeader, maxHeight, containerClassName]);

  const contextValue = useMemo<TableContextValue>(
    () => ({
      tone,
      size,
      striped,
      hoverable,
      stickyHeader,
      stickyFirstColumn,
      columnCount,
      captionId: generatedCaptionId,
    }),
    [tone, size, striped, hoverable, stickyHeader, stickyFirstColumn, columnCount, generatedCaptionId],
  );

  // While the container scrolls it must be reachable by keyboard (WCAG
  // 2.1.1). It's only announced as a landmark-style region when there's a
  // real name to give it — an unnamed `role="region"` is just noise — so the
  // name comes from the table's own `aria-label`, then `aria-labelledby`,
  // then its `<caption>`, in that order.
  const regionName = ariaLabel
    ? { "aria-label": ariaLabel }
    : ariaLabelledBy
      ? { "aria-labelledby": ariaLabelledBy }
      : captionId
        ? { "aria-labelledby": captionId }
        : undefined;
  const regionProps = scrollable ? { tabIndex: 0, ...(regionName ? { role: "region", ...regionName } : {}) } : {};

  return (
    <div
      {...regionProps}
      ref={containerRef}
      className={cx(
        styles.container,
        variant === "ghost" ? styles.containerGhost : styles.containerBordered,
        containerClassName,
      )}
      style={maxHeight === undefined ? undefined : { maxBlockSize: maxHeight }}
    >
      <TableContext.Provider value={contextValue}>
        <table
          {...rest}
          ref={mergeRefs(ref, tableRef)}
          id={id}
          style={style}
          data-testid={dataTestId}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className={cx(styles.table, className)}
        >
          {children}
        </table>
      </TableContext.Provider>
    </div>
  );
});
TableRoot.displayName = "Table";

/** The header group (`<thead>`) — holds the `Table.Row`(s) of column-label `Table.HeaderCell`s. Pinned in place while the body scrolls when the table's `stickyHeader` is set. */
const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(({ className, ...props }, ref) => {
  const { tone, stickyHeader, stickyFirstColumn } = useContext(TableContext);
  return (
    <thead
      {...props}
      ref={ref}
      className={cx(
        styles.header,
        tone !== "neutral" && styles.headerTinted,
        toneClass[tone],
        stickyHeader && styles.headerSticky,
        stickyFirstColumn && styles.firstColumnSticky,
        className,
      )}
    />
  );
});
TableHeader.displayName = "Table.Header";

// Skeleton placeholder rows for a loading `Table.Body` — one cell per column,
// each cell sized like a real one so the table doesn't change height when the
// data arrives. The placeholders are decorative (`Skeleton` is `aria-hidden`),
// so the first cell also carries the visually hidden `label` for screen readers.
const SkeletonRows = ({ rows, label }: { rows: number; label: string }) => {
  const { size, columnCount } = useContext(TableContext);
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={rowIndex} className={styles.statusRow}>
      {Array.from({ length: columnCount }, (_, columnIndex) => (
        <td key={columnIndex} className={cx(styles.cell, sizeClass[size])}>
          <Skeleton variant="text" className={styles.skeleton} />
          {rowIndex === 0 && columnIndex === 0 && <VisuallyHidden>{label}</VisuallyHidden>}
        </td>
      ))}
    </tr>
  ));
};

/** The body group (`<tbody>`) — holds the table's data `Table.Row`s. Rows stripe/highlight per the table's `striped`/`hoverable`. Shows skeleton rows in place of its children while `loading`. */
const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ loading = false, loadingRows = 3, loadingLabel = "Loading", className, children, ...props }, ref) => {
    const { tone, striped, hoverable, stickyFirstColumn } = useContext(TableContext);
    const isTinted = tone !== "neutral";
    return (
      <tbody
        {...props}
        // After the spread, and only when loading, so it can't clobber a
        // consumer's own `aria-busy` the rest of the time.
        {...(loading ? { "aria-busy": true } : {})}
        ref={ref}
        className={cx(
          toneClass[tone],
          striped && (isTinted ? styles.bodyStripedTinted : styles.bodyStriped),
          hoverable && (isTinted ? styles.bodyHoverableTinted : styles.bodyHoverable),
          stickyFirstColumn && styles.firstColumnSticky,
          className,
        )}
      >
        {loading ? <SkeletonRows rows={loadingRows} label={loadingLabel} /> : children}
      </tbody>
    );
  },
);
TableBody.displayName = "Table.Body";

/** The footer group (`<tfoot>`) — holds summary/totals `Table.Row`s, set apart from the body rows. */
const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(({ className, ...props }, ref) => {
  const { stickyFirstColumn } = useContext(TableContext);
  return (
    <tfoot {...props} ref={ref} className={cx(styles.footer, stickyFirstColumn && styles.firstColumnSticky, className)} />
  );
});
TableFooter.displayName = "Table.Footer";

/** A row (`<tr>`) of `Table.HeaderCell`s and/or `Table.Cell`s. */
const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>((props, ref) => <tr {...props} ref={ref} />);
TableRow.displayName = "Table.Row";

/**
 * A header cell (`<th>`) — a column label inside `Table.Header`, or (with
 * `scope="row"`) a row label at the start of a body row. Sized by the
 * table's own `size`.
 */
const TableHeaderCell = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ scope = "col", align, numeric = false, className, ...props }, ref) => {
    const { size } = useContext(TableContext);
    return (
      <th
        {...props}
        ref={ref}
        scope={scope}
        className={cx(
          styles.headerCell,
          sizeClass[size],
          alignClass[align ?? (numeric ? "end" : "start")],
          numeric && styles.numeric,
          className,
        )}
      />
    );
  },
);
TableHeaderCell.displayName = "Table.HeaderCell";

/** A data cell (`<td>`). Sized by the table's own `size`. */
const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ align, numeric = false, className, ...props }, ref) => {
    const { size } = useContext(TableContext);
    return (
      <td
        {...props}
        ref={ref}
        className={cx(
          styles.cell,
          sizeClass[size],
          alignClass[align ?? (numeric ? "end" : "start")],
          numeric && styles.numeric,
          className,
        )}
      />
    );
  },
);
TableCell.displayName = "Table.Cell";

/**
 * The message row for a table with no data — one cell spanning every column,
 * centered, in the table's own cell sizing. Render it inside `Table.Body` in
 * place of the rows:
 * `<Table.Body>{rows.length ? rows : <Table.Empty>No invoices yet</Table.Empty>}</Table.Body>`.
 * The column count is read from the table's first row (normally the header row);
 * pass `colSpan` to override it. It doesn't stripe or highlight on hover, being
 * a message rather than a data row. `ref` forwards to the `<td>`.
 */
const TableEmpty = forwardRef<HTMLTableCellElement, TableEmptyProps>(({ colSpan, className, ...props }, ref) => {
  const { size, columnCount } = useContext(TableContext);
  return (
    <tr className={cx(styles.statusRow, styles.emptyRow)}>
      <td
        {...props}
        ref={ref}
        colSpan={colSpan ?? columnCount}
        className={cx(styles.cell, sizeClass[size], styles.emptyCell, className)}
      />
    </tr>
  );
});
TableEmpty.displayName = "Table.Empty";

/**
 * The table's visible title/description (`<caption>`) — the native,
 * assistive-technology-recognized way to name a table, which also names the
 * table's scroll region when it overflows. Place it first inside `Table`.
 */
const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ id, className, ...props }, ref) => {
    const { tone, captionId } = useContext(TableContext);
    return (
      <caption
        {...props}
        ref={ref}
        id={id ?? captionId}
        className={cx(styles.caption, tone !== "neutral" && styles.captionTinted, toneClass[tone], className)}
      />
    );
  },
);
TableCaption.displayName = "Table.Caption";

type TableComponent = typeof TableRoot & {
  Header: typeof TableHeader;
  Body: typeof TableBody;
  Footer: typeof TableFooter;
  Row: typeof TableRow;
  HeaderCell: typeof TableHeaderCell;
  Cell: typeof TableCell;
  Empty: typeof TableEmpty;
  Caption: typeof TableCaption;
};

export const Table: TableComponent = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
  Empty: TableEmpty,
  Caption: TableCaption,
});
