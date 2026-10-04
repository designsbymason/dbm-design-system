# TableToolbar

Molecule, Data Display category. Item 28 of the itemized molecule build order in `04-component-inventory.md`, named
`TableToolbar` (one word) from 2026-10-03 to match `DataTable` and `TableOfContents`. The bar above a table of data: search,
filters, the filters currently applied, a result count and bulk actions. Built 2026-10-03. **Not yet declared Finalized** — the
user declares that. The decision is [ADR-0034](../adr/0034-tabletoolbar-is-a-stateless-group-of-parts-with-toolbars-inside-it-not-one-toolbar.md).

## What it is

A compound component: `TableToolbar` (a named `role="group"`, with a `size` the parts read) plus `Row` (a wrapping row),
`Search` (sizes the search field), `Filter` (a `Popover` button with a count and a Clear), `ActiveFilters` (removable chips and
"Clear all"), `Summary` ("128 results", "12 of 128 results") and `Selection` (the bulk row). It owns no data: everything is
props and callbacks. The search field, the toolbars and the spacer are existing components placed in slots. Text the parts
write is a `labels` object and numbers go through `formatNumber` (ADR-0021). No new dependency; two component tokens
(`table-toolbar.search-min-width`, `.search-max-width`); a part's `size` defaults to the bar's.

## Decisions made during the build

- **Group, not toolbar, with real toolbars inside** (ADR-0034), the answer to the question raised before the build: a search
  field can't be in a toolbar. The tab order is the search field, each `Toolbar` once, then the chips; a test tabs through it and
  another types in the search field with the arrow keys, in jsdom and in Chromium.
- **`Filter` hands every prop to its button**, so `<Toolbar.Item><TableToolbar.Filter/></Toolbar.Item>` joins a toolbar's
  arrow-key order the way a `Select` does, with no change to `Toolbar`. It takes the toolbar's `variant` and `size` through the
  `ButtonGroup` context `Button` reads (and is `secondary` at the bar's size on its own). Its accessible name is "Status, 2
  active" with the visible word inside it (WCAG 2.5.3).
- **A `count` left `undefined` on `Summary` means "not known yet"**, so the count that arrives with the data is a first
  appearance and is not announced; `0` is a real count ("No results"). Without that every page load would announce.
- **Each live region stays in the page when its visible part is hidden** (`ActiveFilters` with no chips, `Selection` at zero),
  or "none" and "selection cleared" could never be announced; the visible part uses the `hidden` attribute, with an explicit
  `[hidden] { display: none }` because the class's own `display` would override it.
- **Focus is moved before a part disappears under it**: removing a chip from the keyboard focuses the chip now in its place (or
  the last, or, with none left, the nearest control before the chips); emptying the selection with focus in the row focuses the
  nearest control before the row (else the first after). A mouse press moves nothing. One small helper, `focusNearestOutside`, does
  the searching, within the bar.
- **Selection is its own row**, not a swap of the main row, and its fill is `bg.brand-subtle` with `text.primary` (13.46 to 15.05:1
  across the four themes, measured) and a real border so it is still a box in forced colours.
- **Names and counts are plain text.** `ActiveFilters` items are `{ id, label, group? }` with a string `label`, so a remove button
  can be named after the chip ("Remove filter: Status: Open").

## Review checklist (06 §9), run on 2026-10-03

- **Baseline**: strict types, no `any`; JSDoc on the bar, every part and every prop; `forwardRef` on every part; `className`, `style`,
  `id` and `data-testid` accepted; `{...props}` before the computed `role`, `aria-*` and `data-table-toolbar` (a test passes `role`
  and reads the result, for the bar and for `Selection`); no hardcoded value; dev warnings once for a missing name on the bar,
  a missing `label` on a filter, and a non-array `items`; SSR-safe (no browser access in render); survives `StrictMode` (a test);
  `labels` merged with `mergeDefined` and tested with `{ key: undefined }` on all four parts; bad numbers (negative, `NaN`,
  `Infinity`, missing) treated as none, not thrown at.
- **Composition checkpoints**: atom reuse (`Badge`, `Button`, `Tag`, `VisuallyHidden`, `Popover`, `Toolbar`, `SearchInput`,
  `Spacer`); consumed-atom defects: one found, below; Radix-prop audit for `Popover` (`open`/`defaultOpen`/`onOpenChange` and
  `align` exposed; the rest left to `Popover`); cross-part wiring (each group named; the popover named from the label); composed
  tab order tested in jsdom and Chromium; **no provider of its own**, so no nesting problem.
- **Accessibility**: jest-axe clean with the selection row showing and hidden, and with a filter panel open; the named dialog,
  `aria-expanded` and `aria-haspopup`; explicit `list`/`listitem` roles (lint disabled with the Safari reason, as `Pagination`
  does); three live regions that never announce a first appearance (tests for each, including "forgets the last count while
  unknown"); focus recovery (two jsdom tests with a `:focus-visible` stub, and a real-browser story on a live table).
- **Responsiveness / RTL / forced colours**: a real-browser story measures the wide layout (one line, search capped at 24rem,
  actions at the far end) and a 20rem container (nothing wider than the box, the filters below the search); another a phone
  viewport (no horizontal scroll); right-to-left (search and chips start at the right, the count at the left); forced colours
  (the bulk row keeps its border). Checked by eye at a real 640px viewport too.
- **Target size**: every control has a hit area of at least 24 × 24px at all five sizes. A chip's remove button draws a 12 to 20px
  glyph; this review found that was below the guideline's "at least 24 × 24" rule (`06` §9), and `Tag` now extends the button's hit
  area to 24px with an invisible pseudo-element (see `Tag.md`, 2026-10-03). The story probes points 11px either side of each remove
  button's centre with `elementFromPoint`, since the pseudo-element does not change the measured box.
- **Storybook**: Docs page in the 10-section template; a Playground that is the whole working bar; five Properties tables (the
  bar, and `Filter`, `ActiveFilters`, `Summary`, `Selection` on hidden docs-only stories per ADR-0013), every row with a
  description and a default; hand-written snippets under every story; hidden real-browser stories with a literal `!dev` tag; a docs
  test holds the token table to the stylesheet in both directions.
- **Verification run**: `pnpm lint`; `pnpm test` 5,371 and `pnpm test:storybook` 1,031 tests; `pnpm -r build`;
  `check-component-bundle-size` (TableToolbar 5.91KB JS / 2.89KB CSS gzipped, with `Popover`, `Tag` and `Toolbar`'s parts it composes);
  token coverage; `pnpm audit` (the one accepted advisory). Mutations that each failed a test: no chip focus recovery, no selection focus
  recovery, announcing a first appearance, a filter name that drops the count, the role replaceable by props.

## Found along the way

- **`Tag`'s remove button is under 24px at most sizes** (above): a finding in a Finalized atom, surfaced by the target-size story.
  The options are to enlarge its hit area without enlarging its look (a pseudo-element, the usual way), or to record the spacing
  exception as the accepted position. Awaiting the user.
- **A hidden subtree has no accessible name to a role query** (testing-library): a hidden `group` can't be found by
  `getByRole(..., { name })` even with `hidden: true`, so assertions about a hidden row read the `hidden` attribute. Applied in three
  tests; not a component defect.
- Adding `border-width` or `display` to a class that is also hidden by the `hidden` attribute needs an explicit `[hidden]` rule; both
  hidden parts have one (found by reading, then asserted by the hidden-row tests).

## Gaps named, not built

- **Sorting, pagination, column visibility, saved views and a filter builder** belong to `DataTable` or later; the bar knows nothing
  of columns.
- **`MultiSelect` and `Menu` as filter panels and an overflow menu**: neither exists yet; `Filter`'s panel takes any children so they
  can slot in.
- **A one-toolbar variant** (filters and actions in a single `Toolbar`) needs the `Toolbar` frame to share a row, which its
  `fullWidth` doesn't do; two toolbars with a `Spacer` between them is the supported layout.
