# 0088 — `DataTable` columns are resized with a focusable separator at the heading's edge, and the widths are pixels the caller can keep, over percentage widths or no keyboard path

**Status:** Accepted · **Date:** 2026-10-17

## Context
A column's width could be set by the caller (`width`) but not changed by the person using the table, and the two columns the table adds
(checkboxes, actions) had no width at all. Resizing is a drag, which a keyboard, a touch screen and a right-to-left page all have to be
able to do too, and it meets three things the table already decided: rows are one line of a fixed height and a cell with a width is cut with
an ellipsis ([ADR-0086](./0086-datatable-draws-fixed-height-rows-from-tokens-a-window-at-a-time-only-when-unpaged-over-measured-rows-or-windowing-inside-pages.md)),
the columns may be pinned ([ADR-0089](./0089-table-pins-a-number-of-columns-by-measuring-the-header-over-fixed-offsets-or-a-sticky-column-per-part.md)),
and the table owns no state the caller can't reach.

## Decision
- **Opt in, per table and per column:** `resizable` on the table and `resizable` on a column (which overrides it). A resizable
  column's heading gets a handle at its end edge.
- **The handle is a focusable `role="separator"`**, the window-splitter pattern `Splitter` uses ([ADR-0037](./0037-splitter-is-hand-rolled-on-the-window-splitter-pattern-with-automatic-handles-and-a-percentage-layout.md)),
  named "Resize Name column", with `aria-valuenow`, `aria-valuemin` and `aria-valuemax` in pixels and a hint about its keys that the table
  draws once. The arrow keys follow the page's direction (the one that points toward the end edge widens), Shift takes larger steps, Home
  and End go to the limits, Enter resets, and a double press resets. A drag listens on the window and ends however the pointer ends.
- **Widths are pixels, by column id, owned like the rest of the state** (`columnWidths` / `defaultColumnWidths` / `onColumnWidthsChange`,
  called on every step of a drag), so a caller keeps them in the URL or storage. A column stops at its `minWidth` and `maxWidth` (a
  number, `px` or `rem`) or a spacing step; a resized column is a fixed width and its cells are cut with an ellipsis.
- **The two added columns take a length:** `selectionColumnWidth` and `actionsColumnWidth`, not resizable.
- **The heading is named by the column** (`aria-label`) when it holds a handle, so the handle's own name isn't read as part of it.

## Alternatives considered
- **Percentage widths.** Survive a resize of the window, but a drag on one column has to take from its neighbour, and the arithmetic on a
  table with pinned and fixed columns is the one the `Splitter` ADR already found costly. Pixels are what a drag produces.
- **A pointer-only handle, left out of the Tab order.** Fewer tab stops, but it leaves the keyboard without resizing; every handle being a
  tab stop is the price, so it is opt-in.
- **Resizing through a menu of widths.** Reachable by keyboard, but it is not resizing, and a control to choose a number of pixels is worse
  than the arrow keys.
- **Always on.** Rejected: a handle per heading adds a tab stop per column to every table, wanted or not.

## Consequences
- With `resizable`, a table adds one tab stop per resizable column, and each heading reserves room at its end edge for the handle.
- A resized column is cut with an ellipsis, so its text is the cell's `title`.
- The widths are kept in whatever the caller keeps them in; the table never writes storage.

## Related
`06-engineering-standards.md` §9 (a drag ends however the pointer ends); [ADR-0085](./0085-datatable-takes-columns-and-data-and-holds-the-interaction-state-with-toolbar-selection-and-pagination-parts-over-composed-table-rows-or-a-headless-hook.md); `component-reviews/DataTable.md`.
