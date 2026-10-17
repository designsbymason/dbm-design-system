# 0086 — `DataTable` draws fixed-height rows from tokens, a window at a time only when unpaged, over measured rows or windowing inside pages

**Status:** Accepted · **Date:** 2026-10-17

## Context
`06-engineering-standards.md` §4 makes windowing part of `DataTable`'s definition of done, and [ADR-0080](./0080-long-option-lists-are-drawn-a-window-at-a-time-by-a-hand-rolled-hook-with-fixed-row-heights-from-tokens-over-a-virtualization-dependency-or-measured-rows.md)
settled how a list is windowed (a hand-rolled hook, fixed heights from tokens). A table adds three things a list doesn't: it is
usually paged, which already bounds the rows drawn; its rows may hold wrapping text, whose height can't be known; and its
header, striping and pinned columns depend on the rows' positions.

## Decision
- **Every row is one line of a fixed height, from `data-table.row-height.*` (one per `size` step).** The cell's padding gives way to
  the height, so a windowed and a plain table look the same, and a cell with a `width` is cut with an ellipsis instead of widening.
  Each height is just taller than the `IconButton` of its size, the tallest control a row holds, so a row never grows past it.
- **A window is used only when the table is unpaged.** `virtualize="auto"` windows above 100 rows when there is no pagination and a
  `maxHeight` to scroll within; `true` and `false` decide it. A paged table is already a page of rows. Windowing inside a page is not
  offered.
- **A column with `wrap` turns the window off** (a development warning if `virtualize` was asked for), and its rows take their
  natural height.
- **The spacers are worked out in CSS** (`calc(rows × the token)`), not in pixels from a measurement, and the hook's pixel height
  is read from the token with `useSyncExternalStore` (undefined on a server and while hydrating), so the first render is the same
  on both sides and the real height arrives right after.
- **The window starts on an even row**, with a hidden row after the leading spacer, so a striped table's `:nth-child` stripes stay on
  the same data rows however far it is scrolled. `aria-rowcount` and each row's `aria-rowindex` carry the real size and position.

## Alternatives considered
- **Measured rows** (`ResizeObserver` per row). Allows wrapping text, but needs the rows drawn first, which is the cost being
  avoided, and the scrollbar jumps as estimates are corrected. Rejected, as in ADR-0080.
- **Windowing inside a page as well.** More machinery for at most 100 rows a page, and it would make the page-size select the only way
  to make a table slow.
- **Always fixed rows, never wrapping text.** Simpler, but a table of descriptions or addresses can't live with one line; `wrap` is
  the way out, at the price of the window.
- **A virtualization library.** Rejected for ADR-0080's reasons, with the added cost of its own scroll container around a `<table>`.

## Consequences
- A table's rows are one line unless a column says `wrap`; a custom `cell` must fit the row, and a `RowMenu`'s button must be the
  table's own `size`.
- A row that has scrolled out of the window is not in the page, so a control in it can't be reached by Tab or found by the browser's
  find; the Docs page says to page a table people must search.
- The first and last cell of a pinned row are `Table`'s sticky cells; they work in a window since the spacers span every column.

## Related
`06-engineering-standards.md` §4; [ADR-0080](./0080-long-option-lists-are-drawn-a-window-at-a-time-by-a-hand-rolled-hook-with-fixed-row-heights-from-tokens-over-a-virtualization-dependency-or-measured-rows.md),
[ADR-0085](./0085-datatable-takes-columns-and-data-and-holds-the-interaction-state-with-toolbar-selection-and-pagination-parts-over-composed-table-rows-or-a-headless-hook.md); `component-reviews/DataTable.md`.
