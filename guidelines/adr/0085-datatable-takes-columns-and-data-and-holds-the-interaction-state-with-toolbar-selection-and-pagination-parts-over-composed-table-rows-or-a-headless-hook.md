# 0085 — `DataTable` takes `columns` and `data` and holds the interaction state, with toolbar, selection and pagination parts, over composed `Table` rows or a headless hook

**Status:** Accepted · **Date:** 2026-10-17

## Context
`Table` has no data model: rows and cells are composed as children, and it knows a column only as the first row's cell count. Sorting,
choosing rows and paging all need to know what a row, a column and a value are. `DataTable` is the organism that does, and the
guidelines left open its shape: one component fed data, a compound the caller assembles, or a hook that returns props for `Table`.
It also had to say where sorting and paging happen, how a choice is kept, and how the parts that already exist (`TableToolbar`,
`Pagination`, `Menu`) join it.

## Decision
**A generic component fed `columns` and `data`.** `DataTable<TRow>` takes an array of column objects (an `id`, a `header`, an
`accessor` that reads a value and a `cell` that draws one, and flags: `sortable`, `compare`, `numeric`, `width`, `rowHeader`, `wrap`) and
the rows. It draws a `Table`. It holds the *interaction* state and nothing else: the sort, the choice, the page, the page size and the
hidden columns, each as a `value` / `defaultValue` / `onValueChange` set ([`05` §3](../05-component-api-conventions.md)), and a gesture
asks (it calls the callback) and a controlled value changes only when its prop does ([ADR-0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md)).

- **Where the work happens.** `sortMode="client"` (the default) sorts and pages `data` in the browser, the sort before the page;
  `"manual"` draws `data` as given and leaves both to the caller, who answers `onSortChange` and `onPageChange`, and says the size of
  the whole with `totalCount`. One prop covers both because a server that sorts also pages.
- **The sort is a list** of `{ columnId, direction }`. A header press makes a list of one (or empty), and a list of several, which only
  the caller's code can write, is honoured in order, so multi-column sorting later is not a breaking change.
- **The choice is a list of row ids**, kept across sorting and pages, from `getRowId` (the default reads the row's `id`, then its
  position in `data`). It is JSON-friendly and survives data being replaced. The header checkbox covers the rows on the page;
  "select all N" is the toolbar's, offered for a `client` table and, for a `manual` one, only when the caller gives `onSelectAll`.
- **Parts that sit around the table are direct children, placed by kind.** `DataTable.Toolbar` (a `TableToolbar`) goes above,
  `DataTable.Pagination` below, and `DataTable.Selection` (a `TableToolbar.Selection` read from the table's own state) goes inside the
  toolbar. A `useDataTable()` hook reads and changes the same state for the caller's own parts, so a column menu or a "clear sort"
  button needs no extra prop.
- **A native table, not a `grid`.** Every control in it (the sort button, a checkbox, a row's menu) is an ordinary tab stop in
  reading order; there is no cell-by-cell arrow-key model. A chosen row sets `data-selected` and no `aria-selected`, which a plain
  row doesn't support.
- **Row actions are the caller's.** `rowActions(row)` draws a trailing column and the caller puts a `Menu` in it; nothing is wrapped.
- **Typing.** `forwardRef` can't carry a type parameter, so the export is the `forwardRef` function cast to a generic call signature
  with the parts attached. `ref`, `id`, `data-testid` and `aria-*` reach the `<table>`; `className` and `style` go on the outer box.
- **`Table` grows two additive props** for this: `Table.Row`'s `selected` (a fill, purely visual) and `Table`'s `containerRef` (the
  scroll container, which a windowed list needs).

## Alternatives considered
- **A compound the caller assembles** (`DataTable.Header`, `.Row`, `.Cell` …). It is `Table` again, which has no state to share: the
  sorting and choosing would have to be wired by the caller across every part, and the row of a sorted table would be the caller's to
  order. Rejected.
- **A headless hook that returns props for `Table`** (as a table library does). Maximum control, but every caller rewrites the same
  header, checkbox column, announcements and footer, and an agent composing it has far more to get wrong. A component with a
  `useDataTable()` escape hatch is the smaller surface that still lets a caller reach the state.
- **A selection `Set`.** Cheaper to test membership, but it doesn't serialise, and it makes a controlled prop a new object each time.
- **A `grid` role with arrow-key cell navigation.** The pattern for a spreadsheet-like surface; for a table of read-and-act rows it
  trades a long, learnable Tab order for a model people must discover, and it would make every cell a managed focus stop.
- **Sorting and paging only on the server, or only in the browser.** Each fails a real case (a small static list; a million rows).

## Consequences
- The caller defines `columns` once (or memoises it): a new array each render sorts again each time.
- A column can't hold its own state, and a `cell` is a plain function of the row, so a cell with its own hooks is a component the `cell`
  function renders.
- Pinning is `Table`'s: only the first and last cell of a row, so with a selection the checkbox column is the one pinned at the start
  (`Table`'s own review already names pinning more than one column as unbuilt).
- `DataTable` imports `TableToolbar`, `Pagination`, `Checkbox` and `Select`, and its bundle is measured with them.

## Related
`04-component-inventory.md` (organism build order, item 10); `05-component-api-conventions.md` §3, §4;
[ADR-0019](./0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md),
[ADR-0034](./0034-tabletoolbar-is-a-stateless-group-of-parts-with-toolbars-inside-it-not-one-toolbar.md),
[ADR-0086](./0086-datatable-draws-fixed-height-rows-from-tokens-a-window-at-a-time-only-when-unpaged-over-measured-rows-or-windowing-inside-pages.md); `component-reviews/DataTable.md`.
