# 0034 — `TableToolbar` is a stateless named group of parts, with real `Toolbar`s inside it for the buttons, over one big `role="toolbar"` or a component that owns the filter state

**Status:** Accepted · **Date:** 2026-10-03 · **Amended 2026-10-04** — a third component token was added; the decision itself is unchanged

## Context
The bar above a table holds a search field, filters, the filters currently applied, a result count and bulk actions. Two questions had no obvious answer.

**What its keyboard model is.** `Toolbar` gives one tab stop and arrow-key movement, but a text field can't live in a toolbar: the toolbar takes the left and right arrows for itself, and the field needs them for its caret. Making the whole bar a toolbar would force the search field out of the arrow-key order and leave it half-in, half-out.

**Where the data lives.** Filters, a query and a selection need state, and a bar that owned it would have to know what a "column" or a "row" is. `Table` has no data model on purpose ([Table.md](../component-reviews/Table.md): sorting, filtering and selection belong to `DataTable`), and `DataTable` does not exist yet.

## Decision
- **The bar is a named `role="group"`, not a toolbar.** Inside it the search field is an ordinary tab stop; the filter buttons and the actions go in real `Toolbar`s (a `Toolbar.Item` around each `TableToolbar.Filter`), so each is one tab stop with arrow-key movement; the applied-filter chips and "Clear all" are ordinary tab stops in reading order. Tab order is reading order, with no trap and no key handling of the bar's own.
- **It owns no data.** Rows, query, filters and selection are the app's, passed in and called back. It is parts you place yourself (`Row`, `Search`, `Filter`, `ActiveFilters`, `Summary`, `Selection`), so a bar can be a search field alone or the full set, and a `Table`, a card list or a future `DataTable` can sit under it. Only the parts with behaviour of their own exist as parts: the filter button and its panel, the chips, the live count, the bulk row. The search field, the toolbars and the spacing are the library's existing components in slots.
- **Selection is a row of its own**, shown while `count > 0`, not a swap of the main row, so the search and filters keep their state and focus while rows are selected.
- **Three live regions, each always in the page** (applied filters, result count, selection), announce a *change* and never a first appearance; a `count` left `undefined` means "not known yet", so data arriving after mount is a first appearance. They stay when their visible part is hidden, so "none" and "cleared" can be announced.
- **A part that is about to disappear while keyboard focus is in it moves focus first** (a chip removed, the selection emptied): to the next chip, or to the nearest control before the part within the bar.
- **A filter's panel is a `Popover` of whatever controls the app puts in it** (`CheckboxGroup`, `RadioGroup`, `Select`), because `MultiSelect` and `Menu` don't exist yet; one of them can slot in later without changing the bar.

## Alternatives considered
**One `role="toolbar"` for the whole bar** — rejected: the search field loses its arrow keys, or sits outside the toolbar's order while visually inside it, which is the worst of both.

**A component that owns the filter, search and selection state** — rejected: it would have to model rows and columns (what `Table` refused to) and guess what `DataTable` will want, building a seam with no consumer. The parts' props are small enough that a future `DataTable` can drive them directly.

**A swap of the main row for the bulk row while rows are selected** — rejected: it hides the search field and filters, discarding focus and context at the moment someone is partway through a task.

**A single `filters` prop of data (`[{ label, options }]`)** — rejected: it would decide the panel's controls for everyone; filters are as varied as the data (a range, a date, a multi-select), so the panel is children.

## Consequences
- The bar adds no dependency and three component tokens (`table-toolbar.search-min-width`/`max-width`, and `filter-count-size-xs`) *(Amended 2026-10-04: this originally said two, `search-min-width`/`max-width`; the third, the diameter of the filter button's count badge on the xs bar, was added after the build)*; it is built from `Toolbar`, `Popover`, `Tag`, `Badge`, `Button`, `SearchInput` and the form controls.
- A consumer places the toolbars and a `Spacer` in a `TableToolbar.Row` themselves; the bar gives them wrapping and the search field a measure, not a layout engine.
- `DataTable` (Phase 6) composes these parts rather than reimplementing them; if it finds a seam missing, the part grows then, not now.

## Related
`04-component-inventory.md` (item 28), `component-reviews/TableToolbar.md`, [ADR-0032](0032-toolbar-puts-radix-toolbar-roving-focus-behind-wrapper-parts-and-reuses-buttongroups-context.md), [ADR-0021](0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md).
