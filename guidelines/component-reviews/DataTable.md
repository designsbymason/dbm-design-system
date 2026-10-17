# DataTable — review findings

Tenth organism, built 2026-10-17 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Not Finalized:**
only the user declares that, and a `/review-component DataTable` pass has not been run on it yet. What follows is what was decided,
found and verified while building it, and what is known to be open.

## Decisions
- A generic component fed `columns` and `data` that holds the interaction state, with `DataTable.Toolbar`, `.Selection` and
  `.Pagination` as direct children and `useDataTable()` for a caller's own parts; `sortMode` `client` or `manual`; the choice is a list of
  ids; a native table, not a `grid`: [ADR-0085](../adr/0085-datatable-takes-columns-and-data-and-holds-the-interaction-state-with-toolbar-selection-and-pagination-parts-over-composed-table-rows-or-a-headless-hook.md).
- Rows are one line of a fixed height from tokens, an unpaged table with a `maxHeight` is drawn a window at a time, and paging and
  windowing exclude each other: [ADR-0086](../adr/0086-datatable-draws-fixed-height-rows-from-tokens-a-window-at-a-time-only-when-unpaged-over-measured-rows-or-windowing-inside-pages.md).
- `Table` grew `Table.Row` `selected` and `containerRef`, additive and approved with the plan ([Table.md](Table.md)).
- New component tokens, `data-table.row-height.{xs…xl}` (`2rem`, `2.5rem`, `2.75rem`, `3.5rem`, `4rem`), each just above the `IconButton` of
  its size. No new semantic token: a chosen row is `bg.brand-subtle` (the `brand` tone's own stripe), its hover `bg.brand-subtle-hover`.
- No new dependency. Bundle size is 17.08KB JS and 6.30KB CSS, because the bundle holds `Table`, `TableToolbar`, `Pagination`, `Select` and
  `Checkbox`; budgets are 20KB and 8KB with the reason beside them in `check-component-bundle-size.mjs` (a `CSS_BUDGET_OVERRIDES_KB` was added).
- Left out of v1, as agreed: column reordering (the sortable hook of [ADR-0043](../adr/0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md)
  waits for `EditorTabs`), multi-column sorting from the UI (the sort is already a list), expandable rows, column resize, grouping, cell editing
  and saved views.

## What was found while building it
Real-browser checks caught each of these; none showed in a unit test.
- **A checkbox is smaller than the minimum target.** `Checkbox` at `xs` is 12px, so the select column failed the 24 × 24px rule. The
  box is extended by a centred `::after` of `space.6` (insets `calc((100% − space.6) / 2)`, so it is symmetric in right-to-left), and the
  check presses points 11px either side of the centre with `elementFromPoint`, since `getBoundingClientRect` can't see it.
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

## Verified
- `eslint`, `tsc` and the Storybook `tsc`: clean. The `unit` project: 8626 passing (163 files). The `storybook` project in a real browser: 1796
  passing (224 files), including eight hidden checks for this component. `pnpm build`, `pnpm check-component-bundle-size` and
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
- **Forced colours.** A chosen row's fill disappears there by design and the checked checkbox carries the state; the sort button's ring and the
  select column in forced colours were not emulated.
- **Right to left, in a real browser.** The Docs page has a right-to-left story and the stylesheet is logical throughout, but pinned columns, the
  select column and the footer were not measured under `dir="rtl"`.
- **A phone width.** The footer wraps and the table scrolls inside its frame, but no check pins a width below `sm` and asserts it.
- **All four themes.** Light Purple and dark Emerald were looked at; the other two were not. The only new colour pairing is `text.primary`
  on `bg.brand-subtle`, the one the `brand` tone already uses; it was not re-measured here.
- **Focus in a window.** A row scrolled out of a windowed table takes its controls out of the page, so Tab can't reach them and find-in-page
  can't see them; the Docs page says so, and the consequence is recorded in ADR-0086.
- **No `/review-component` pass** has been run, so the feature-completeness comparison, the Radix-prop audit for the parts and the
  consumed-atom review have not been done as a separate step.
