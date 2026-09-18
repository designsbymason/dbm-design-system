# Table — Storybook/component review findings

**Data Display:** Table — built 2026-09-18, item 10 in the itemized molecule-tier build order
(`04-component-inventory.md`). Adds no new dependency and no new token — every value already had a home
on an existing scale. **Not yet Finalized** — per the standing rule that only the user declares a
component's review pass done, this file records what was built/checked/found, not a self-declared
Finalized status.

**The first molecule with no Radix primitive underneath it.** A compound component of native table
elements: `Table` (root) with `Table.Caption`, `Table.Header`, `Table.Body`, `Table.Footer`, `Table.Row`,
`Table.HeaderCell`, and `Table.Cell`. Each sub-part's own props get a `### Table.{Part} properties`
subsection on the Docs page via a hidden, docs-only stories file per
[ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md) — seven of
them, the most of any component so far.

## Decisions made with the user before building

Asked rather than guessed, since the guidelines were silent on all three:

- **Sub-part names: `Header / Body / Footer / Row / HeaderCell / Cell / Caption`** — over mirroring raw HTML
  tag names (`Head`/`Foot`/`Th`/`Td`). Avoids the `Header`-vs-`Head` near-collision.
- **Optional features: `striped`, `stickyHeader`, `hoverable`, and a `variant` (`"bordered"` | `"ghost"`)** —
  all four chosen. `size` (the shared 5-step scale), per-cell `align`, and the scroll wrapper were included
  regardless. `variant` mirrors `Accordion`'s own `bordered`/`ghost` pair.
- **Overflow accessibility: always wrap in a scroll container, focusable only while it actually overflows.**
  Recorded as [ADR-0019](../adr/0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md),
  together with the related decision below about which element receives native props.

## Design decisions made during the build

- **`ref`, `className`, `style`, `id`, `data-testid`, `aria-*`, and every native attribute go on the `<table>`;**
  `containerClassName` and `maxHeight` target the scroll frame. One rule instead of a per-prop split — see
  ADR-0019 for the rejected alternative.
- **Sub-parts style themselves from a per-`Table` React Context, never from descendant selectors**, so a table
  nested inside a cell reads its own `size`/`striped`/`hoverable`/`stickyHeader` instead of inheriting the outer
  table's. Verified by a dedicated nesting test. The one CSS rule that does need structure (the last row drops its
  divider) uses child combinators (`.table > :last-child > tr:last-child > *`) for the same reason.
- **`border-collapse: separate` with zero spacing**, not `collapse`: collapsed borders don't travel with a
  `position: sticky` header, so the divider would scroll away while the header text stayed pinned. Dividers are set
  on cells (`border-block-end`), since a `<tr>`'s border only renders under `collapse`.
- **`stickyHeader` pins the header *cells*, not the `<thead>`** — the placement browsers support consistently. It
  resolves against the scroll frame, so it only has an effect once `maxHeight` gives that frame a height; without
  one, `Table` warns once in development (mirroring `IconButton`'s/`Accordion`'s existing pattern).
- **Alignment is logical** (`align="start" | "center" | "end"` → `text-align: start/center/end`) so it mirrors
  under RTL with no extra work — a reading-flow-tied value per
  [ADR-0009](../adr/0009-rtl-mirroring-is-a-per-component-judgment-call.md). `Omit`s the native `align` attribute
  (which takes `left`/`right`/…) from `<th>`/`<td>`/`<tr>` so the typed prop can't collide with it.
- **Header cells don't wrap** (`white-space: nowrap`) — found live, see below. Data cells still wrap.
- **Not built, deliberately:** no sorting, selection, or pagination (that's `DataTable`, an organism built on
  this); no `numeric` convenience prop (right-aligned tabular figures) — `align="end"` covers the alignment and
  the rest is a judgment call, flagged below rather than built unprompted.

## Baseline correctness

- `forwardRef` on all 8 parts, each to the native element its name suggests (verified by a ref test per part).
  `className`/`style`/`id`/`data-testid` accepted and documented on all 8.
- `{...props}` is spread first on every part. The only computed attributes are `scope` (destructured with a
  default, so a consumer-supplied `scope` still wins) and the scroll frame's `tabIndex`/`role`/`aria-*`, which live
  on an internal element no consumer prop reaches.
- Zero hardcoded values — every colour, spacing, radius, font size/weight, border width, z-index, and motion value
  in `Table.module.css` traces to an existing token. The consumer-supplied `maxHeight` is the only free-form value,
  by design, and it isn't a design token concern.
- SSR/RSC safe: nothing touches `window`/`document` at module scope or during render except through
  `useSyncExternalStore`, which has a `getServerSnapshot`.
- Compound-sub-part completeness, atom-reuse audit (`Badge`/`Skeleton`/`List` are demo/related-card content, not
  something `Table` should re-implement — it composes no atom itself), and Radix-primitive prop audit (n/a — no
  Radix primitive) all run as part of the first pass.

## Accessibility

- Real `<table>` semantics throughout; `Table.HeaderCell` defaults to `scope="col"` and accepts
  `"row" | "colgroup" | "rowgroup"`. `Table.Caption` names the table natively.
- **Keyboard access to overflow (WCAG 2.1.1):** the scroll frame becomes `tabIndex={0}` — and a named
  `role="region"` when there's a name to give it (`aria-label`, then `aria-labelledby`, then the caption, in that
  order; a nested table's caption is never mistaken for the outer's) — only while it overflows. Verified three ways:
  unit tests with a simulated overflow, the Storybook `play` test tabbing onto a genuinely overflowing region in real
  Chromium, and the focus ring viewed live.
- jest-axe: zero violations in the default state, in the striped/hoverable/sticky/ghost/small combination, and with
  the scroll region both named and unnamed. `@storybook/addon-vitest`'s a11y check on every story passes.
- **Contrast, measured from the built token values** (methodology: `03-token-system-spec.md`; the script reproduces
  the already-documented figures for `text.primary`/`text.secondary` on `bg.surface`/`bg.canvas`/`bg.neutral-subtle`
  exactly, which validates it). New pairings this component introduces, identical across both brands:

  | Pairing | Light | Dark |
  |---|---|---|
  | `text.primary` on `bg.neutral-subtle` (striped row, footer) | 13.53:1 | 9.66:1 |
  | `text.primary` on `bg.neutral-subtle-hover` (hovered row) | 12.41:1 | 6.59:1 |
  | `text.secondary` on `bg.surface` (header cells, caption) | 6.88:1 | 10.47:1 |
  | `text.secondary` on `bg.neutral-subtle` | 6.59:1 | 7.47:1 |
  | `text.secondary` on `bg.neutral-subtle-hover` | 6.05:1 | 5.10:1 |

  All clear the 4.5:1 AA floor in all four themes. The tightest pairing actually rendered is `text.primary` on a
  hovered row in dark mode (6.59:1); `text.secondary` never sits on a hover background in Table's own markup, but
  consumer content inside a cell could, and it still clears AA (5.10:1).
- **Known, accepted trait (not a defect):** in dark mode the striped-row background (`bg.neutral-subtle`, `gray.800`)
  is byte-identical to the row divider (`border.default`), so a divider on a striped row's edge is invisible against
  its stripe. This is the same consequence [ADR-0011](../adr/0011-darker-dark-mode-representative-background.md)
  already documents for that token pair, and rows stay clearly distinguishable via the stripe itself.

## Theming and responsiveness

- Verified live in a running Storybook across all four brand/mode combinations (Purple/Emerald × Light/Dark): the
  resolved header/cell/stripe/divider colours are correct and consistent in each, and the hovered row (viewed in
  Emerald/Dark) reads clearly distinct from both a plain and a striped row. Table's own styling has no brand-specific
  token; only the scroll frame's focus ring (`border.focus`) is brand-aware.
- Verified live at 375px: the page itself doesn't overflow horizontally (`scrollWidth` equals the viewport), the table
  scrolls inside its own frame (293px visible of 391px), and the frame is a focusable, caption-labelled region.

## Findings from live verification (all fixed)

Four real issues, none of which `tsc`, `eslint`, or the jsdom suite could have caught — the standing reason a
running Storybook check is required:

1. **Row headers inherited the column-header row's styling.** A body row's `<th scope="row">` picked up the header
   row's stronger divider, its opaque `bg.surface` background (which would punch a white hole through every striped
   row), and its secondary text colour. Confirmed via computed styles (`rgb(171,168,187)` divider on a row header vs
   `rgb(222,221,229)` on its sibling cell). Fixed by scoping those three to `.header > tr > .headerCell` (the
   `<thead>` only); every header cell keeps `font-weight: semibold`. Regression tests added.
2. **The scroll region wasn't focusable on the first frame.** The first version detected overflow in an effect plus a
   `ResizeObserver` callback, which only reports one async tick after mount — leaving a window where the frame
   scrolled but wasn't focusable. Found by `@storybook/addon-vitest`'s a11y check (a real
   `scrollable-region-focusable` violation on the sticky-header story), which runs the instant a story renders.
   Fixed by reading overflow via `useSyncExternalStore`, which re-reads the DOM right after the first commit and
   re-renders before paint. A regression test asserts the region is correct with a `ResizeObserver` that never fires.
   Recorded as part of ADR-0019.
3. **Header labels broke mid-word in a narrow frame.** `INV-001` wrapped to "INV- / 001" as the table squeezed its
   columns before overflowing. Fixed with `white-space: nowrap` on header cells, so the table scrolls sideways
   sooner instead of crushing short labels; data cells still wrap.
4. **A non-finding worth recording:** overflow appeared not to be detected at all in the browser pane, until
   `document.visibilityState` turned out to be `"hidden"` — a tab that isn't producing frames never delivers
   `ResizeObserver` callbacks. A screenshot forces a frame and the region appeared correctly. Not a component
   defect; noted so a future session doesn't mistake it for one.

## Storybook documentation

`Table.mdx` follows the full `07-storybook-and-documentation-standards.md` §4 template (all 10 sections plus the
visually-hidden Intro). Verified live: all 10 `h2` sections in order, all 8 Properties tables (root plus 7
sub-parts) present with rows in the intended order and no empty descriptions, and the Playground's controls
demonstrably drive the canvas (`striped`/`hoverable`/`maxHeight`/`stickyHeader` each applied). The Playground
covers the root's live props; nine further stories cover striped, hoverable, both together, sticky header, ghost
variant, all sizes, cell alignment, grouped columns (`colSpan`/`rowSpan`), and a narrow-container story with a
`play` function that tabs onto the overflowing region. Every fixed-render story suppresses every control it doesn't
consume via a shared `noControls` map.

## Functional verification

- 50 unit tests (React Testing Library + jest-axe), all passing: semantics and structure, `scope` defaults and
  overrides, native attribute passthrough (`colSpan`), the scroll container, both variants, all five sizes,
  striped/hoverable/sticky scoping, `maxHeight`, alignment (and that it doesn't leak into a native `align`), `id`/
  `className`/`style`/`data-testid` on all 8 parts, ref forwarding on all 8, nesting isolation, the full overflow
  matrix (fits / caption-named / `aria-label` / `aria-labelledby` / unnamed / nested caption / gaining and losing
  focusability / correct before any observer callback / no `ResizeObserver` at all), the dev warning (once; not with
  `maxHeight` or `containerClassName`; not without `stickyHeader`), and four jest-axe scenarios.
- Full package re-verified: `eslint --max-warnings 0` plus both `tsc --noEmit` passes clean; the jsdom `unit`
  project 61 files / 1445 tests (previously 60 / 1395); the real-browser `storybook` project 75 files / 502 tests
  (previously 67 / 485), including a11y on every story and the new `play` test; `tsup` build, `storybook build`,
  and all three CI checks (`check-component-bundle-size` — Table at 1.57KB JS / 0.58KB CSS gzipped, within budget;
  `check-foundations-token-coverage`; `check-storybook-bundle-size`).

## Feature-completeness gaps named, deliberately not built

Per `06-engineering-standards.md` §9's scope-creep guardrail — real, nameable gaps relative to what comparable
production tables offer, each a design decision rather than a narrow fix, so surfaced here for a go-ahead instead of
built unprompted:

- **A sticky first column** — the common companion to a sticky header for wide tables (keeping the row label in view
  while scrolling sideways). Needs its own opaque-background and z-index layering decisions.
- **A `numeric` (or `Table.Cell` `tabular`) convenience** — right-aligned tabular figures in one prop, instead of
  `align="end"` alone, since proportional digits don't line up even when right-aligned.
- **A loading / empty state** — a built-in skeleton-row pattern while data arrives, and an empty-body message. Both are
  arguably `DataTable` concerns, but a simple table showing "no results" is common enough to consider here.
