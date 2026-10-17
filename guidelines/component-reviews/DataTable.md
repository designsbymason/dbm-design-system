# DataTable — review findings

Tenth organism, built 2026-10-17 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Not Finalized:**
only the user declares that. A `/review-component DataTable` pass was run on 2026-10-17 and all fourteen of its findings are fixed
("Review pass" below). What follows is what was decided, found and verified, and what is known to be open.

## Decisions
- A generic component fed `columns` and `data` that holds the interaction state, with `DataTable.Toolbar`, `.Selection` and
  `.Pagination` as direct children and `useDataTable()` for a caller's own parts; `sortMode` `client` or `manual`; the choice is a list of
  ids; a native table, not a `grid`: [ADR-0085](../adr/0085-datatable-takes-columns-and-data-and-holds-the-interaction-state-with-toolbar-selection-and-pagination-parts-over-composed-table-rows-or-a-headless-hook.md).
- Rows are one line of a fixed height from tokens, an unpaged table with a `maxHeight` is drawn a window at a time, and paging and
  windowing exclude each other: [ADR-0086](../adr/0086-datatable-draws-fixed-height-rows-from-tokens-a-window-at-a-time-only-when-unpaged-over-measured-rows-or-windowing-inside-pages.md).
- `Table` grew `Table.Row` `selected` and `containerRef`, additive and approved with the plan ([Table.md](Table.md)).
- New component tokens, `data-table.row-height.{xs…xl}` (`2rem`, `2.5rem`, `2.75rem`, `3.5rem`, `4rem`), each just above the `IconButton` of
  its size. No new semantic token: a chosen row is `bg.brand-subtle` (the `brand` tone's own stripe), its hover `bg.brand-subtle-hover`.
- No new dependency. Bundle size is 17.20KB JS and 6.35KB CSS, because the bundle holds `Table`, `TableToolbar`, `Pagination`, `Select` and
  `Checkbox`; budgets are 20KB and 8KB with the reason beside them in `check-component-bundle-size.mjs` (a `CSS_BUDGET_OVERRIDES_KB` was added).
- Defaults: `tone` is `brand` (a solid brand header, as a data table's header usually wants), and `DataTable.Pagination` is size `sm`, since the
  footer is secondary to the rows. Text is ordered with one `Intl.Collator("en")`, not the browser's locale, so a server and a browser agree
  (ADR-0021); a column that needs another language's order gives its own `compare`.
- Left out of v1, as agreed: column reordering (the sortable hook of [ADR-0043](../adr/0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md)
  waits for `EditorTabs`), multi-column sorting from the UI (the sort is already a list), expandable rows, column resize, grouping, cell editing
  and saved views.

## What was found while building it
Real-browser checks caught each of these; none showed in a unit test.
- **A checkbox is smaller than the minimum target.** `Checkbox` at `xs` is 12px, so the select column failed the 24 × 24px rule. First
  patched in `DataTable`'s own stylesheet; the review asked for the fix at the atom, so it now lives in `Checkbox` ([Checkbox.md](Checkbox.md)). The
  check presses points 11px either side of the centre with `elementFromPoint`, since `getBoundingClientRect` can't see a pseudo-element.
- **An `IconButton` is taller than a row at `xs` and `sm`.** At those sizes the button is 30px and 39px, so a row with a menu was 31px
  and 40px against a 28px and 36px token, and the window's spacers would have drifted. The tokens became 32px and 40px, each just above its
  button, and the story kit's `RowMenu` takes the table's `size`. A row's actions button must be the table's own size.
- **A chosen row eases to its fill**, so a test that read its colour straight after the press saw it transparent. It waits for the colour.
- **A modal menu left open fails axe** (`aria-hidden-focus`) when a story ends; the check closes it.
- **A story's own `data` and `columns` args overwrote the demo's** (the toolbar story drew eight rows and "1–8 of 8") because the demo
  spread `args` last; the demos drop `data` and `columns` from what they spread, and a story that needs a setting sets it in `args`.
- **A same-tick double press loses one.** Two `click()`s in one task both read the selection from the same render, so the second
  overwrote the first. A person can't produce that; a script can. Not fixed: the setters take a value, as the rest of the library's do.
- **`react-hooks/set-state-in-effect`** rejected reading the row token into state after mount; it is read with `useSyncExternalStore` (a
  server and a hydrating render get `undefined`, so the first render is the same on both), which the server-render and hydration tests
  cover with a windowed table.
- **Stripes of a window.** `:nth-child` stripes shift when the first drawn row's position is odd, so the window starts on an even row with
  a hidden row after the leading spacer; a real-browser check scrolls to the end and asserts the stripe still follows the data row.

## Review pass (2026-10-17)
Fourteen findings, all fixed:
1. **The "server" story ran in client mode.** The demo spread the Playground's args after its own `sortMode`, `loading` and `totalCount`, so it showed
   "1–10 of 10" and never went busy. The demo now owns those and the story turns their controls off.
2. **A shared collator, fixed to English**, for the default text order (a 20,000-row sort went from 374ms to 28ms, and no longer depends on the browser's
   locale); a test with `localeCompare` reversed proves the order doesn't read it.
3. **A chosen row is told apart.** Its fill is `bg.brand-subtle-hover` (the `brand` tone's stripe is `bg.brand-subtle`, which the first fill
   matched), and the checkbox cell carries a marker in `border.brand` (held transparent in every row, so nothing moves; Canvas and Highlight in forced
   colours). `Table`'s selected fill changed with it ([Table.md](Table.md)).
4. **The unsorted arrow is `opacity.80`** (it was `opacity.60`: 2.74:1 on a neutral header in the light themes), and a check measures 3:1 against the
   brand and the neutral header in all four themes.
5. **The range's numbers are isolated** (U+2068 … U+2069), so "1–10 of 24" reads in order in right-to-left; a check measures the order.
6. **`DataTable.Pagination` takes `dir`** (default `ltr`, as every Radix-wrapping part) and gives it to the page size select.
7. **Component-level JSDoc with an example** on `DataTable`, and an example on each part.
8. **No false warning** for a sortable column without an accessor when sorting is manual.
9. **`Checkbox`'s hit area** fixed at the atom, through the three-question test.
10. **The sort is worked out from the rows alone**, so an inline `getRowId` or `isRowSelectable` doesn't sort again (a test counts `compare` calls); the
    duplicate-id warning is once per id.
11. **A cell cut by a width has its whole text as its `title`.**
12. **A Tones story**, and this file records the `brand` and `sm` defaults.
13. **Tests:** nested inside a cell, a pagination outside a table, spread order on `Selection` and `Pagination`, `formatNumber` and `labels` on the footer, Space on
    a row, the pinning props, the default tone, and a manual-mode warning.
14. **Real-browser checks** for right to left (column order, figure alignment, the range, the select's `dir`), forced colours (the marker, the sort
    button), a phone width (no page overflow, the table scrolls in its frame, the footer stacks), the marker taking no room, and the arrow's contrast.

One pitfall found writing the checks: a probe element made inside a `waitFor` callback changes the document and re-runs the callback forever
(06 §9 names it); the forced-colours check hung until the colours were resolved outside the callback.

## Verified
- `eslint`, `tsc` and the Storybook `tsc`: clean. The `unit` project: 8649 passing. The `storybook` project in a real browser: 1803
  passing (224 files), including thirteen hidden checks for this component and one for `Checkbox`. `pnpm build`, `pnpm check-component-bundle-size` and
  `pnpm check-guidelines`: clean.
- Unit: sort, selection, paging and their pure helpers; the controlled/uncontrolled pairs wired to state; shift ranges; single mode;
  non-selectable rows; manual mode; the live-region announcement; `aria-rowcount` and `aria-rowindex`; `onRowClick` (and a control in the row not
  reaching it); windowing, including turning it off; warnings; `labels: { x: undefined }`; `StrictMode`; `jest-axe` in four states; server render
  and hydration of eleven variants.
- Real browser: every row at every size is exactly its token's height (with a selection column and a menu in the row); a 5,000-row table draws
  fewer than 80 rows, its scroll height is 5,000 rows, the last row can be reached, and its stripes follow the data after a long scroll; a cell with
  a `width` is cut with an ellipsis and its row keeps its height; every control is at least 24 × 24px at every size; sorting from the keyboard leaves
  focus on the heading's button, with its ring inside the box; the Tab order runs toolbar, header, rows, footer; a row's menu opens above the
  scrolling table and is chosen with a real pointer; a chosen row has its fill and keeps it through a sort.
- Looked at in Storybook: the Docs page (13 canvases, no errors, every Properties row has a description), the toolbar story with a selection in
  Purple light, and the selection story in Emerald dark.

## Open at this point
Not verified, and none of it should be assumed:
- **Emerald light** was not looked at on screen (its sort-arrow contrast is measured); Purple light, Purple dark and Emerald dark were.
- **Windowed rows and focus.** A row scrolled out of a windowed table takes its controls out of the page, so Tab can't reach them and find-in-page
  can't see them; the Docs page says so, and the consequence is recorded in ADR-0086.
- **Widths between the extremes.** The phone check is at 375px and the others at the desktop width; the steps in between were not asserted.
- **Hand-driven keyboard and screen reader use.** The Tab order and the sort keys are asserted in a real browser, but no screen reader was run.
- **Column sizing, more than one pinned column, select all across a manual table's pages, multi-column sorting from the UI, expandable rows and
  reordering** are not built (the first two need an ADR, and more than one pinned column is a change to `Table`).
