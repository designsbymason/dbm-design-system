# 0087 — Select all across pages is a state of its own for a table that holds one page, over listing ids it doesn't have or an inverted selection

**Status:** Accepted · **Date:** 2026-10-17

## Context
[ADR-0085](./0085-datatable-takes-columns-and-data-and-holds-the-interaction-state-with-toolbar-selection-and-pagination-parts-over-composed-table-rows-or-a-headless-hook.md)
keeps the choice as a list of row ids and offered "select all N" only for a `client` table, which has every id. A `manual` table holds
one page of a server's rows, so "everything matching this filter" (a bulk action on 137 rows, 10 on show) had no way to be said without the
caller fetching and passing every id.

## Decision
A second piece of state beside the list: **`allSelected`** (`allSelected` / `defaultAllSelected` / `onAllSelectedChange`, the same
controlled-or-not set as the rest), `true` meaning every row of the whole table is chosen.

- `DataTable.Selection` offers "Select all N" for a `manual` table with a `totalCount` and chooses *all*, clearing the id list; a caller
  that would rather list the ids passes its own `onSelectAll`. A `client` table still lists ids.
- While it is on, every selectable row on every page shows as chosen, the header checkbox is checked, and the count is the `totalCount`.
- **Unchecking one row goes back to a list of ids:** `allSelected` becomes `false` and the list is the page's selectable rows but that
  one (a row on another page can't be named, and the person is looking at this page). Unchecking the header or "Clear selection" goes to none.
- `selection` is untouched while it is on, and `onSelectionChange` is called only when an id list changes. `useDataTable()` reads
  `allSelected`, `setAllSelected` and a `selectedCount` that is right either way.
- The caller resets it (`onAllSelectedChange(false)`) when the filter changes, since "all" meant the rows matching the old one.

## Alternatives considered
- **Make `selection` mean the exceptions while "all" is on.** One state, but the same prop would hold ids chosen in one mode and ids
  *not* chosen in the other, so a caller reading it would have to know which, and a controlled value could be misread by a handler that
  sends it to a server.
- **Ask the caller for every id** (`onSelectAll` alone). Works, and stays available, but costs a request for 100,000 ids to say "all".
- **A `selectAllMatching` callback and no state.** The table couldn't show the rows as chosen, or the count, without the caller feeding both back.

## Consequences
- `isRowSelectable` can't be asked of rows that haven't been loaded, so the count in "all" mode is the `totalCount`, which overstates
  it when some rows can't be chosen; the Docs page says so.
- A caller sending the choice to a server sends `allSelected` and the filter, or `selection` — never both meaning something.

## Related
`04-component-inventory.md` (DataTable); [ADR-0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md); `component-reviews/DataTable.md`.
