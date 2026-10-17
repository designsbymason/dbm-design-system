# 0090 — `DataTable` opens a row's detail in a row of its own under it, with an expand column and no windowing, over a nested table or a side panel

**Status:** Accepted · **Date:** 2026-10-17

## Context
A row often has more to say than its columns do: a customer's contact details, an order's lines, the reason a record failed. Showing it
means either leaving the table (a `Drawer`, a page) or opening it in place. In place meets three decisions the table already made: rows are
one line of a fixed height from tokens so a long table can be drawn a window at a time ([ADR-0086](./0086-datatable-draws-fixed-height-rows-from-tokens-a-window-at-a-time-only-when-unpaged-over-measured-rows-or-windowing-inside-pages.md)),
the stripes are `:nth-child` rules, and the table sets `aria-rowcount` and `aria-rowindex` for a paged or windowed table.

## Decision
**`renderExpandedRow(row)`** opts a table in (`expanded` / `defaultExpanded` / `onExpandedChange` by row id, `expandMode` `multiple` or
`single`, `isRowExpandable`), and:
- adds a **column of expand buttons after the checkboxes**, each a native `IconButton` named for its row ("Expand Ada Lovelace"), with
  `aria-expanded` and, while open, `aria-controls` pointing at the detail. Focus stays on it when it is pressed. The checkbox column stays first,
  so the chosen-row marker stays on the row's edge. The caret of a closed row turns round in right-to-left.
- draws the detail as **a `<tr>` of its own right after the row**, holding one cell as wide as the table, in the table's own markup (not
  a nested table, which would have its own header and columns). It has a quiet fill that a stripe and the pointer leave alone, its own height and
  padding, and the open row loses its bottom divider so the two read as one.
- **keeps the stripes in step** with a hidden row between the row and its detail, so the two together are an even number of rows (the same
  device the window uses).
- **is never drawn a window at a time**, since rows of different heights can't be, and says so in development when `virtualize` is asked for.
  Paging is the bound on a long table.
- **sets no `aria-rowcount` or `aria-rowindex`**: detail rows are rows, and how many there are on pages the table isn't showing is unknowable.
- keeps `expanded` across pages and sorts (ids, like the choice), and counts the expand column among the columns pinned at the start.

## Alternatives considered
- **A `Drawer` or a side panel for the detail.** Leaves the table, which is right for a large detail and is what `Drawer` is for. An in-place row
  keeps the person's place and lets several be open to compare.
- **A nested `DataTable` in the detail.** Works today (the detail is any node, and a table nested in a cell keeps its own state, which a test
  proves), but a built-in "sub-rows" API would need a tree model, which is `Tree`'s, not this table's.
- **Windowing with measured heights.** Rejected in ADR-0086 for the same reason: it needs the rows drawn first and makes the scrollbar jump.
- **Counting detail rows in `aria-rowindex`.** Right on one page with nothing open on the others; wrong as soon as another page has an open row,
  and a wrong count is worse for a screen reader than none.

## Consequences
- A table with expandable rows loses the window and the row count; a caller with thousands of rows pages them.
- The detail is as wide as the table, so on a table that scrolls sideways the detail scrolls with it; the Docs page says to keep it narrow.
- A detail's own controls come after its expand button in the Tab order, and a long detail pushes the rows below it down.

## Related
`04-component-inventory.md` (DataTable); [ADR-0085](./0085-datatable-takes-columns-and-data-and-holds-the-interaction-state-with-toolbar-selection-and-pagination-parts-over-composed-table-rows-or-a-headless-hook.md);
`component-reviews/DataTable.md`.
