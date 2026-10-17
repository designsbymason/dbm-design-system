# 0089 — `Table` pins a number of columns by measuring the header, over fixed offsets or a sticky column per part

**Status:** Accepted · **Date:** 2026-10-17

## Context
`Table`'s `stickyFirstColumn` and `stickyLastColumn` pin one column. A table with row selection has its checkbox column first, so the one
that stayed in view was the checkbox column and the column that names the row scrolled away. Pinning two or more means each pinned column sits
against the one pinned before it, and a column's offset is the sum of the widths of those columns, which CSS can't know.

## Decision
Both props take `boolean | number`: `true` is one, a number pins that many (held to four), `false` and `0` none. One pinned column keeps
its class and its rules exactly as they were. Several are marked with `data-pin-start` / `data-pin-end` (the count) on the `<thead>`,
`<tbody>` and `<tfoot>`, and the cells are matched with `:nth-child` and `:nth-last-child` rules for two to four, written out in the stylesheet.
**The offsets are measured:** `usePinOffsets` reads the widths of the first row's cells (with `useSyncExternalStore`, a `ResizeObserver` on
the table and each cell, and a `MutationObserver` for a column added or removed) and puts `--pin-start-2` … and `--pin-end-2` … on the table, in
pixels; each pinned cell's `inset-inline-start` or `-end` reads its own. Only the last of the pinned cells draws the divider. A cell that spans
several columns isn't pinned, as before, and moves the cells after it out of their columns, so a table that pins several keeps spanning cells
out of its first columns.

`DataTable`'s `stickyFirstColumn` / `stickyLastColumn` count *data* columns, and the checkbox and actions columns are pinned beside them.

## Alternatives considered
- **Offsets from the caller** (`stickyFirstColumn={[ "12rem", "10rem" ]}`). No measurement, but every pinned column then needs a fixed width, which
  a table whose columns size to their content (and now to a drag) doesn't have.
- **A pinned column per `Table.Cell` part** (`<Table.Cell pinned>`). Flexible, and makes the caller restate the pin on every row.
- **`position: sticky` with `inline-size: max-content` tricks.** A sticky element can't be positioned against a sibling's width.

## Consequences
- The first render has no offsets, so the later pinned columns sit at the edge for a frame (the server render has none either), then move
  into place; a resize moves them with it.
- At most four columns per edge, because the stylesheet writes each case out.
- `Table`'s `stickyFirstColumn` changes type, widening it: every existing value means what it did.

## Related
[ADR-0019](./0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md), [ADR-0085](./0085-datatable-takes-columns-and-data-and-holds-the-interaction-state-with-toolbar-selection-and-pagination-parts-over-composed-table-rows-or-a-headless-hook.md); `component-reviews/Table.md`.
