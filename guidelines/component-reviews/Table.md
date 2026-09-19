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
[ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md) — seven at
first build, eight once `Table.Empty` was added (see the 2026-09-19 section), the most of any component so far.

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
  this). *(A `numeric` convenience prop, a sticky first column, and loading/empty states were initially left out
  and flagged for a go-ahead; all three were built afterwards — see the 2026-09-19 section below.)*

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
  | `text.primary` on `bg.neutral-subtle` (striped row) | 13.53:1 | 9.66:1 |
  | `text.primary` on `bg.neutral-subtle-hover` (hovered row) | 12.41:1 | 6.59:1 |
  | `text.secondary` on `bg.surface` (header cells and caption on a surface-coloured page; a pinned header's own background) | 6.88:1 | 10.47:1 |
  | `text.secondary` on `bg.canvas` (header cells and caption on a canvas-coloured page) | 6.05:1 | 5.10:1 |
  | `text.secondary` on `bg.neutral-subtle` | 6.59:1 | 7.47:1 |
  | `text.secondary` on `bg.neutral-subtle-hover` | 6.05:1 | 5.10:1 |

  All clear the 4.5:1 AA floor in all four themes. Since the header, caption, and footer have no background of
  their own (see the follow-up below), their text sits on whatever surface the table is placed on; the tightest
  such pairing is header/caption `text.secondary` on `bg.canvas` in dark mode (5.10:1). Never place a `Table` on a
  surface where `text.secondary` falls below AA — `text.tertiary` on `bg.canvas` is the documented failing case, and
  Table doesn't use it.
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
covers the root's live props; ten further stories cover a caption, striped, hoverable, both together, sticky header, ghost
variant, all sizes, cell alignment, grouped columns (`colSpan`/`rowSpan`), and a narrow-container story with a
`play` function that tabs onto the overflowing region. Every fixed-render story suppresses every control it doesn't
consume via a shared `noControls` map.

## Functional verification

- 50 unit tests at first build (89 after the `tone` follow-up below) (React Testing Library + jest-axe), all passing: semantics and structure, `scope` defaults and
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

## Follow-up (2026-09-18, same day, at explicit direction) — three refinements

1. **No caption in the demo stories.** Every demo table (Playground and all gallery stories) now renders with no
   visible `Table.Caption`, named via `aria-label` instead; a single dedicated "With a caption" story shows a caption.
   A story-level change only — the component's `Table.Caption` sub-part is unchanged.
2. **No background on the header, caption, or footer.** The three surfaces previously drew `bg.surface` (header,
   caption) and `bg.neutral-subtle` (footer); all three are removed, so a table sits directly on whatever surface it's
   placed on. **One deliberate exception, flagged:** a *pinned* header (`stickyHeader`) keeps an opaque `bg.surface`
   background, scoped to that state only — without it, rows scrolling beneath the header would show straight through
   the header text. Verified live in dark mode, scrolled: the header stays opaque and rows scroll cleanly under it.
   The footer keeps its semibold weight; it's now set apart by the divider above it rather than a fill.
3. **Prop order.** The root's props now read variant → size → striped → hoverable → stickyHeader → maxHeight →
   aria-label → aria-labelledby → aria-describedby → containerClassName → id → className → style → data-testid,
   with the escape-hatch props last, in the Controls panel (`argTypes` key order), the Playground and Properties
   table (`rootPropOrder`), and the `TableProps` interface. Previously the `aria-*` props trailed `data-testid`.

Re-verified: `tsc --noEmit` (both tsconfigs) and `eslint --max-warnings 0` clean; the `unit` project (50 tests) and
the `storybook` project's Table files (18 tests, up from 17 with the new story) pass.

## Follow-up (2026-09-18, same day, at explicit direction) — `tone` prop

Added `tone?: "brand" | "neutral" | "info" | "success" | "warning" | "danger"` (default `"neutral"`), placed right after
`variant` in every prop order. Built in two steps at explicit direction: first `"default" | "brand"`, then renamed
`"default"` → `"neutral"` and extended with the four status tones.

- **`"neutral"`** — the un-tinted base treatment: no header or caption fill, neutral stripe (`bg.neutral-subtle`) and
  hover (`bg.neutral-subtle-hover`). Renamed from `"default"` so `tone` matches every other tone type in the system
  (`Badge`, `Tag`, and the scale in `05-component-api-conventions.md` §2 all name the uncoloured option `neutral`).
- **Every other tone** applies one shared treatment in its own colour: a solid header and caption fill with that tone's
  `text.on-*` text, `striped` rows in its `bg.*-subtle`, `hoverable` rows in its `bg.*-subtle-hover`. Footer, body cells,
  and body row headers are untouched. `"brand"` follows the active brand theme (Purple/Emerald); `"success"`,
  `"warning"`, `"danger"`, `"info"` are fixed status colours that don't change with the brand.

  | Tone | Header + caption fill | Header + caption text | Stripe | Hover |
  |---|---|---|---|---|
  | `brand` | `bg.brand` | `text.on-brand` | `bg.brand-subtle` | `bg.brand-subtle-hover` |
  | `success` | `bg.success` | `text.on-success` | `bg.success-subtle` | `bg.success-subtle-hover` |
  | `warning` | `bg.warning` | `text.on-warning` | `bg.warning-subtle` | `bg.warning-subtle-hover` |
  | `danger` | `bg.danger` | `text.on-danger` | `bg.danger-subtle` | `bg.danger-subtle-hover` |
  | `info` | `bg.info` | `text.on-info` | `bg.info-subtle` | `bg.info-subtle-hover` |

- **`danger`, not `error`.** The request said "error"; the system's tone vocabulary is `info | success | warning | danger |
  neutral` and every token is `bg.danger`/`text.on-danger`, so the value is `danger` for consistency (a one-word rename
  if `error` is preferred).
- **The caption takes the same fill and text as the header** (added earlier the same day, at explicit direction — it had
  no background in any tone before), so a captioned toned table reads as one continuous block from the caption through
  the header row. The header's bottom divider is the fill's own colour so it reads as part of it (`border.<tone>` equals
  `bg.<tone>` in every tone and theme — verified — so either would be correct).
- **Composes with `stickyHeader`:** a pinned toned header keeps its tone's fill. The tinted header rule is declared after
  the sticky rule (equal specificity, later wins), so the neutral opaque `bg.surface` a neutral pinned header gets never
  overrides it. Verified live while scrolled, and by a test per tone asserting both classes land on the `<thead>`.
- **Implementation — one shared treatment, five tone definitions.** Each non-neutral tone has a short CSS class that only
  *defines* four local custom properties (`--tone-solid`, `--tone-on-solid`, `--tone-subtle`, `--tone-subtle-hover`) from
  semantic tokens; the shared `headerTinted`/`captionTinted`/`bodyStripedTinted`/`bodyHoverableTinted` rules read them.
  Five tones therefore cost five 4-line definitions rather than twenty near-identical rules, and adding a sixth is one more
  definition. `tone` is in the per-`Table` React Context and each part picks its classes from it, so a nested table reads
  its own tone (tested).

**Contrast, measured from the built token values.** Header/caption text on its own fill, and body text (`text.primary`)
on each tone's stripe and hover. Purple and Emerald are identical for the four status tones (they're brand-agnostic):

| Pairing | Purple light | Purple dark | Emerald light | Emerald dark |
|---|---|---|---|---|
| `brand`: `text.on-brand` on `bg.brand` | 7.37:1 | 7.45:1 | 6.08:1 | 8.51:1 |
| `success`: `text.on-success` on `bg.success` | 6.50:1 | 8.19:1 | 6.50:1 | 8.19:1 |
| `warning`: `text.on-warning` on `bg.warning` | 4.78:1 | 8.19:1 | 4.78:1 | 8.19:1 |
| `danger`: `text.on-danger` on `bg.danger` | 5.10:1 | 8.22:1 | 5.10:1 | 8.22:1 |
| `info`: `text.on-info` on `bg.info` | 4.71:1 | 8.20:1 | 4.71:1 | 8.20:1 |
| `text.primary` on any tone's `*-subtle` (stripe) | 13.46:1 or better | 15.05:1 or better | 13.49:1 or better | 15.05:1 or better |
| `text.primary` on any tone's `*-subtle-hover` (hover) | 12.28:1 or better | 9.66:1 or better | 12.28:1 or better | 9.66:1 or better |

All clear the 4.5:1 AA floor. The tightest are `text.on-info` on `bg.info` (4.71:1) and `text.on-warning` on
`bg.warning` (4.78:1), both in light mode, matching the figures `03-token-system-spec.md` already documents for those
pairings — which validates the measurement. Header text is semibold and caption text regular at `font-size-sm`, both
ordinary-size text, so the 4.5:1 floor is the applicable one.

**Verified live in a running Storybook, all four themes.** A script compared every rendered colour to the resolved value
of the intended token, for all six tones in each theme (24 combinations): header fill, header text, divider, stripe, and —
via a probe element inside each tone's `<tbody>` — the hover tint; and the caption fill/text (equal to the header's) in
Purple/light and Emerald/dark. All matched. Visual check: the four status tones read clearly and distinctly, and the
caption merges into the header in each. Dark modes use the lighter tone step with dark text per
[ADR-0005](../adr/0005-dark-mode-light-fill-dark-text-pattern.md), and the dark-mode tinted stripes are very dark
(`*-subtle` resolves to a `950`-step primitive) — a property of those tokens
([ADR-0011](../adr/0011-darker-dark-mode-representative-background.md) for the brand one), not of `Table`.
Verification notes: a hover transition doesn't advance in a tab that isn't painting (reading it straight after hovering
returned the pre-transition value until a screenshot forced frames — hence the probe approach); and faint hairlines
between header cells in captures were a rasterization artifact, not a layout gap — measured directly: zero gap between
adjacent cells, no inline borders, identical fills, at 2× DPR with fractional column edges. A same-colour fill on the
header `<tr>` beneath the cells is kept as a cheap guard.

**Stories and docs.** The single "With a caption" story now shows the caption in every tone; a new "All tones" story
(replacing the interim brand-only one) shows every tone striped and hoverable; the Docs page's tokens table lists all
20 tone tokens, and its Usage/Accessibility sections gained guidance on status tones, including not relying on colour
alone to convey a tone's meaning.

Re-verified: 89 unit tests (up from 50 at first build — the tone tests run per tone across all five tinted tones,
including jest-axe with striped + hoverable + sticky for each); the Table story files (19 tests, including axe on the
all-tones and caption stories); `tsc --noEmit` (both tsconfigs) and `eslint` clean.

## Feature-completeness gaps built (2026-09-19, at explicit direction)

The three gaps this review had named and deliberately not built — a sticky first column, a `numeric` convenience, and
loading/empty states — were built on request. The sub-decisions below are mine, made where the request left the API
open; each is a small, reversible choice.

**1. Sticky first column — `stickyFirstColumn` on `Table`** (boolean, default `false`, mirroring `stickyHeader`).
- Pins the first cell of every row in the header, body, and footer to the inline-start edge (logical, so it follows RTL),
  resolving against the same scroll frame as everything else. Needs no `maxHeight`.
- **Pinned cells must be opaque, yet a striped or hovered row is tinted on the row itself.** Solved with a per-row custom
  property: a striped or hovered `<tr>` sets `--row-tint` alongside its own background, and the pinned cell paints
  `var(--row-tint, var(--dbm-bg-surface))` — the row's tint if it has one, else `bg.surface`. The property is reset on
  every `.table` so a table nested in a cell can't inherit an outer row's tint. Hover still transitions on the pinned cell.
- **Layering.** Pinned column cells sit at `z-index.sticky`, the pinned header cells one above, and the corner cell (both
  pinned) one above that, so neither scrolled axis ever paints over the header. (This raised the sticky header's own
  `z-index` by one step; verified in a real browser, not just by reading the CSS.)
- **Composes with tones:** a toned header keeps its fill on its first cell, and the divider beside a pinned header cell
  takes the fill's own colour. The rule is kept at the same specificity as the header rules and ordered before them, so a
  toned or pinned header wins by declaration order.
- **A first cell that spans several columns opts out of pinning** (`colspan` > 1, or the empty-state cell). Found live: a
  footer's "Total" label spanning six columns sat at `-126px` after a 230px scroll instead of pinning, because a sticky
  cell can only travel within its own row, so one as wide as most of the table runs out of room. Not pinning it is cleaner
  than pinning it partway; the story's footer now uses a non-spanning label cell (`Total` + a `colSpan={5}` filler).

**2. `numeric` on `Table.Cell` and `Table.HeaderCell`** (boolean, default `false`) — end-aligns and sets
`font-variant-numeric: tabular-nums`. An explicit `align` always wins over the end-alignment `numeric` implies (tested,
including `align="start"`); `align`'s default is now derived (`start`, or `end` under `numeric`) rather than a fixed
`"start"`.
- **Correction to this review's own earlier rationale.** The gap was named on the grounds that right-alignment alone
  doesn't line digits up "because proportional digits differ in width". Measured directly in a real browser, that is
  **font-dependent**: Nunito, the primary font, already has equal-width digits (a row of `1`s and a row of `8`s measure
  identically at 192px), so with it `numeric` changes nothing visible beyond the alignment shorthand. It matters where a
  font has proportional digits *and* a tabular-figures feature — the system UI font a page falls back to when Nunito isn't
  loaded (146px vs 196px proportional, identical at 197.5px with `tabular-nums`). Fonts without the feature (Georgia,
  Helvetica/Arial) are unaffected either way. The JSDoc, the Docs page, and the story now say this plainly instead of
  overclaiming, and the "Numeric columns" story is rendered in the system font on purpose so the difference is actually
  visible (in Nunito the two tables would be identical). Still worth having: it keeps figures aligned in the fallback case
  and is one prop instead of `align` plus a class.

**3. Loading and empty states.**
- **`loading` on `Table.Body`** (plus `loadingRows`, default 3, and `loadingLabel`, default `"Loading"`) replaces the rows
  with skeleton rows — one cell per column, built from the existing `Skeleton` atom (atom-reuse audit). The body is marked
  `aria-busy`, and a `VisuallyHidden` label is announced once in the first cell; the skeleton shapes are `aria-hidden`.
  Placeholder widths vary from CSS so a block of them reads as ragged text. Row height matches real rows (41px vs ~41px), so
  nothing jumps when data arrives. `aria-busy` is set *after* the props spread and only while loading, so it can't clobber a
  consumer's own value the rest of the time (tested).
- **`Table.Empty`** — a new eighth sub-part: `<tr>` + one `<td>` spanning every column, centered, `text.secondary`, roomier
  padding (`space.8`), sized by the table's `size`. Placed inside `Table.Body` in place of rows, so the consumer decides when
  the table is empty. Doesn't stripe or highlight on hover (rows marked `statusRow` are excluded from both hover rules).
  `ref` forwards to the `<td>`; a native `colSpan` overrides the inferred count. Gets its own hidden docs-only stories file
  per [ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md).
- **Both need the column count, which `Table` now infers rather than asking for.** A new `useColumnCount` hook reads the
  first row's cells and sums their `colSpan` (`HTMLTableElement.rows` lists only this table's own rows, so a nested table
  never contributes; a grouped header whose first row has fewer, wider cells still totals correctly — tested with
  `rowSpan`/`colSpan` cells). It uses `useSyncExternalStore` for the same reason `useScrollableRegion` does (correct on the
  first frame, and it satisfies the lint rule against setting state in effects). With no header row it falls back to one
  column; `Table.Empty`'s `colSpan` can override it. Verified live: a 4-column table renders 4 skeleton cells per row and a
  `colspan="4"` empty cell on the first frame.

**One lint-driven change to existing code.** Adding these features made the React Compiler lint rule flag the component's
long-standing dev-mode warning, which read and wrote a ref during render (`hasWarnedStickyWithoutHeightRef`). Bisected to
confirm it wasn't caused by any one new ref, then replaced with a `useEffect` — the warning now fires after commit, needs no
ref, and still fires once for unchanged props (the existing warn-once tests pass unchanged).

**Verification.** 34 new unit tests (123 total for the component), covering: the sticky-column classes on all three row
groups and their composition with `stickyHeader`, tones, striping, and nesting; `numeric` and its `align` interplay; loading
(default and custom row counts and labels, `aria-busy`, the hidden label, `aria-hidden` skeletons, grouped-header and
no-header column counts, nested tables); `Table.Empty` (colSpan inference and override, ref/passthrough, status-row
marking); and jest-axe for each new state. In a real Chromium: the story tests (24 in the Table files, 510 across the
package) include a `play` function that scrolls the wide table sideways and asserts the pinned cell does not move, and axe on
every new story. Checked live in a running Storybook: pinned cells at the frame's edge after scrolling (header, both body
rows, and footer), striped-row pinned cells matching their row tint exactly, the brand/info-toned pinned header keeping its
fill, the corner cell layering (`1102` over `1101` over `1100`) with the element at the corner point being the corner cell,
loading rows matching the header's column count, and the empty cell's `colspan`. Lint (`eslint` plus both `tsc` passes),
1518 unit tests, 510 browser tests, the build, and all size/coverage checks pass. Per-component bundle size grew from
1.73KB JS / 0.76KB CSS gzipped to 2.52KB / 1.32KB (it now bundles `Skeleton` and `VisuallyHidden`); still within budget.

## Remaining gaps named, deliberately not built

Nothing further is outstanding from the original three. Two adjacent ideas surfaced while building them, both design
decisions rather than narrow fixes, so recorded here instead of built unprompted:

- **A sticky last column** (an actions or total column pinned to the end edge) — the mirror of `stickyFirstColumn`; would
  reuse the same opaque-cell/tint technique with `inset-inline-end`.
- **Pinning more than one leading column** — e.g. an ID and a name together. Needs the second column's offset to equal the
  first's rendered width, which CSS alone can't know; would require measuring or a consumer-supplied width.
