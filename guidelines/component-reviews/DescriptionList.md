# DescriptionList

Molecule, Data Display. Build session: 2026-09-27. **Finalized 2026-09-29** — the full `06-engineering-standards.md` §9 checklist, two user-reported bug fixes (grid alignment and icon-prefixed terms), a prop rename (`alignedTerms` → `alignedDetails`), a Storybook Controls-panel consistency pass, and a final pre-Finalize §9 review are all complete; see "Final `06-engineering-standards.md` §9 review pass" below for what that last pass checked (this entry also records the initial build, including one real defect found and fixed during the build itself).

**Renamed `alignedTerms` → `alignedDetails`, 2026-09-28, at the user's request — pure identifier rename, no logic change.** The prop's own mechanism sizes every `Term` to a shared width, but what a reader actually perceives and cares about is that every `Details` value lands at the same starting position — `Term`s are already always left-aligned at their own start regardless of the prop, so "aligned" more accurately describes what happens to `Details`. Renamed throughout: the prop itself, its JSDoc, the CSS class, the internal derived variable/context field (`alignTerms` → `alignDetails`, for internal consistency — not itself part of the request, but the same category of change), every story/snippet/test/doc reference. This document uses `alignedDetails` throughout, including in entries describing work done before the rename (a same-day, pre-release rename on an unshipped component — not worth preserving "as it was called at the time" for every mention).

## What it is

A compact key/value display block: real `<dl>` semantics. `DescriptionList` is the `<dl>`; `DescriptionList.Item` wraps one `DescriptionList.Term` (`<dt>`)/`DescriptionList.Details` (`<dd>`) pair in its own `<div>` (an HTML5-valid grouping). `variant` (`bordered`/`ghost`, mirroring `Table`'s exact vocabulary), `size` (the shared 5-step scale), `orientation` (`horizontal`/`vertical` — horizontal wraps the details below the term via plain CSS `flex-wrap` once the item's own container narrows too far, with no breakpoint configuration needed), and `columns` (`Responsive<number>`, a CSS Grid of items with `DescriptionList.Item`'s own `span` as an escape hatch for a wide value).

## Design decisions made without a prior spec (inventory only said "Key/value display block")

- **No `tone` prop.** Unlike `Table`/`Card`, this is a plain content-display block, not a feedback-type component — tone was judged not to genuinely apply (`06-engineering-standards.md` §9's "never forced onto a component where they don't apply").
- **No `striped`/`hoverable`.** `Table` already covers the many-row, eye-tracked case; a `DescriptionList` is typically a handful of fields. Considered and deliberately deferred, not built.
- **No title/actions slot.** A consumer composes a heading via `Card.Header` (or any heading) above the list instead — keeps this component focused, matches "composition over configuration."
- **The automatic between-item divider (bordered/ghost) only draws when `columns` is left at its default of `1`.** A wrapping multi-column grid can't correctly show both row and column boundaries with a single divider line without a real `<table>` (which a `<dl>` correctly isn't) or knowing which items fall in the visual last row (not statically knowable once column count changes per breakpoint). Documented in `DescriptionListProps.columns`'s own JSDoc and the MDX Usage guidelines' Don't list.
- **`orientation` is not responsive (a plain value, not `Responsive<T>`).** The horizontal case degrades via CSS `flex-wrap` — genuinely container-width-driven, arguably better than a viewport-breakpoint map here. `columns` stays `Responsive<number>` since collapsing an actual grid-column count needs real breakpoints, which `flex-wrap` can't do.
- **`DescriptionList.Details`'s `numeric` sets `tabular-nums` only, no alignment change** — unlike `Table.Cell`'s `numeric` (which end-aligns), a standalone details value isn't part of a dense multi-row numeric column, so end-aligning it would look adrift from its term. Documented explicitly as a deliberate difference in the prop's own JSDoc.

## Real defect found and fixed during the build (not by a separate review pass)

**A spanning item broke `columns`' responsive collapse (found live, real browser, desktop→mobile viewport check).** `DescriptionList.Item`'s `span` was applied as a literal `grid-column: span N` inline style. When `columns` resolved to `1` at a narrow viewport (e.g. `columns={{ base: 1, md: 3 }}` on mobile) but an item still requested `span={3}`, CSS Grid implicitly widened the grid to fit the span request — regenerating 3 columns via auto-sized implicit tracks even though the explicit grid was 1 column, breaking the whole point of the responsive collapse. Confirmed via `getComputedStyle(dl).gridTemplateColumns` showing three uneven auto-sized tracks (`0px 81px 109px`) at a 320px viewport, instead of one full-width track.

**Fix:** `columns` (the raw `Responsive<number>`, not resolved) is now threaded through `DescriptionListContext`; `DescriptionList.Item` resolves it to the real, currently-active column count via `useResolvedResponsiveValue` (the same `matchMedia`-based hook `Popover`'s `side` and others already use for values that can't be expressed as pure CSS cascade) and clamps `Math.min(span, resolvedColumns)` before writing `grid-column`. Verified live at both a 320px and a ~1100px real iframe width, in both directions (3 columns at desktop, correctly collapsing to 1 with no implicit-track regression at mobile).

## Verification performed this session

- Unit tests (16, `DescriptionList.test.tsx`): rendering, real `<dl>`/`<dt>`/`<dd>`/wrapping-`<div>` structure, every prop default, variant/size/orientation class application, the columns→dividers interaction, `--dl-cols-*` custom properties (plain number and responsive map), `span`→`grid-column` (including the clamp fix), the non-positive-`span` dev warning (fires once, ignored value), `numeric`, aria-label/labelledby/describedby, ref forwarding (root + all three sub-parts), className/style/id/data-testid passthrough (root + sub-parts), jest-axe (bordered, ghost, vertical, multi-column) — all pass.
- `pnpm --filter @dbm-design-system/components exec tsc --noEmit` — clean.
- `eslint --max-warnings 0` on the new files — clean.
- `storySnippets.test.ts` (guards every `*.snippets.ts`) — passes with the new file included.
- Full package unit-test project (`vitest run --project unit`, 90 files / 4603 tests) — all pass, no regressions.
- Docs page (`DescriptionList.mdx`) visually verified live in a running Storybook instance: Playground (live controls, all working), Properties table (every Default populated correctly on first pass — no docgen-drop shape hit), all 5 variant/gallery stories, Usage guidelines Do/Don't grid, Accessibility callout, Design tokens table, Related components (3 live mini-previews) — checked in Purple/Light, Purple/Dark, and Emerald/Dark.
- One MDX authoring bug caught and fixed the same way `07-storybook-and-documentation-standards.md` already documents: backslash-escaped quotes inside a `<TokenRow usage="...">` attribute (`size=\"xs\"`) broke the whole MDX parse — switched to single quotes (`size='xs'`) per the established convention.
- Multi-column responsive collapse verified live at a real 320px and ~1100px iframe width (not just reasoned about) — this is what caught the span-clamping defect above.

## Feature added post-build: `alignedDetails` (2026-09-28, at the user's request)

An optional boolean, **default `true`**, that sizes every term in the list to the width of the widest
one, so every details value starts at the same position — a real aligned label column, not several
independently-sized terms. Named `alignedDetails` rather than the user's own suggestion
(`equalWidthTerms`) to match this codebase's established adjective-form boolean convention (`striped`,
`hoverable`, `divided`, `stacked`, `colorful`), offered as a recommendation and adopted.

**The real constraint this ran into:** aligning every term to one shared width needs every
term/details pair to join a single 2-column CSS Grid — flex children sized independently per item (the
original design) can't share a track. The standard way to do that without JS measurement or layout
flicker is `display: contents` on `DescriptionList.Item`, so its `<dt>`/`<dd>` become direct grid
children of the list. That would normally conflict with `Item`'s own `span` (a `display: contents`
element has no box to apply `grid-column: span N` to) — resolved by noticing `span` already only has
an effect once `columns` is greater than `1`, and **term alignment only has one unambiguous shape at
the default `columns={1}`** (the same reasoning already used for the between-item divider) — so
`alignedDetails` is scoped to exactly that case (`orientation="horizontal"` and a genuine single column)
and the conflict with `span` never actually arises. Past `columns={1}`, or under `orientation="vertical"`
(no side-by-side term/details relationship to align in the first place), the prop has no effect and
each term still hugs its own content — documented plainly in the prop's own JSDoc and the MDX Usage
guidelines, not a silent gap.

**Implementation:** `.root.alignedDetails` becomes a fixed 2-column grid (`minmax(auto, 40%) minmax(0,
1fr)`); `.item` gets `display: contents` (`.itemContents`) so its `<dt>`/`<dd>` auto-flow directly into
that grid, one term/details pair per row — the browser's own grid track-sizing algorithm does the
actual alignment (sizing column 1 to the widest term across every row), no JS measurement involved.
Padding moved from the (now boxless) item onto the term/details themselves, split inline-start/
inline-end so the two together match the original visual padding, with the grid's own `column-gap`
providing the space between them. The between-item divider moved from `.item` (invisible once it has
no box) onto the term/details directly (`.dividers.alignedDetails > .item:not(:first-child) > .term/
.details`), using the same `:not(:first-child)` technique as before — still correct, since `display:
contents` removes an element from the box tree, not the DOM, so its position among the real children
is unaffected.

**Verified, not assumed:**
- A dedicated hidden real-browser story (`AlignedTermsChecks`) measures actual rendered widths —
  confirms a short and a long term really do share one width when `alignedDetails` is on, that the
  resulting details values start at the same inline position, that the opt-out (`false`) genuinely
  gives each term its own narrower/wider box, and that the term/details still resolve to real `<dt>`/
  `<dd>` elements (not dropped from the accessibility tree by `display: contents`).
- The pre-existing `ResponsiveLayoutChecks` story's "narrow container wraps the details below the
  term" case had to be given an explicit `alignedDetails={false}` — it was specifically testing the
  flex-wrap degrade, which the new default would otherwise have silently swapped out from under it.
  Caught by re-running the story, not assumed safe.
- jest-axe: zero violations in the Storybook Accessibility panel, both light and dark, for the default
  (`alignedDetails` on) case.
- Added 4 new unit tests (scoping to `columns===1`/`orientation==="horizontal"`, the `false` opt-out,
  the divider-moves-to-term/details behavior) — 20 total, all passing. Ran the real-browser
  `@storybook/addon-vitest` Chromium project against this component's stories directly
  (`vitest run --project storybook src/molecules/DescriptionList/DescriptionList.stories.tsx`) — 9/9
  pass, including both hidden check stories' `play` assertions. This also closes the "real
  addon-vitest run" item that was previously left outstanding below.
- Full package regression: `tsc --noEmit` clean, `eslint --max-warnings 0` clean, `storySnippets.test.ts`
  clean, full `vitest run --project unit` — 91 files / 4628 tests, all passing.
- Docs page re-verified live (Playground toggle, generated "Show code" reflecting `alignedDetails={false}`,
  Properties table default, new gallery story) in Purple/Light and Purple/Dark.

## Real defect found in `alignedDetails`, fixed the same session (user-reported, with a screenshot)

**A leftover flex-layout rule still matched in the new grid layout, resolving against the wrong reference box.** `.orientationHorizontal > .term { max-inline-size: 40%; }` was written for the original per-item flex layout, where `.term` is a flex child of `.item` and `40%` resolves against the item's own width. `.term` still carries the `orientationHorizontal` class in aligned mode, but its actual layout context there is `.root`'s grid — so the same `40%` instead resolved against the *grid track's* own width (which had already auto-sized to the term's content), capping the term to 40% of its own already-tight column. Confirmed live via `getBoundingClientRect`: a 126.8px track held a 50.7px term (exactly 40% of the track), opening a ~92px gap before the details and splitting the between-item divider into two visibly disconnected segments — both symptoms the user reported from a single screenshot, plus the term column itself reading as far narrower than its own visual column.

**Fix:** `.root.alignedDetails .term { inline-size: 100%; max-inline-size: none; }` — the grid track's own `minmax(auto, 40%)` (on `.alignedDetails` already) is the correct, sufficient place for that 40% cap (bounding the *column*, not the individual term box); resetting removes the stale, wrongly-scoped duplicate and lets the term stretch to fill its real track, so its divider border reaches the column's own edge. Verified via `getBoundingClientRect` before/after (term width now equals its track's full width) and visually in both light and dark mode. A regression-guard assertion was added to the hidden `AlignedTermsChecks` story (`gap < 24px`, generous headroom over the real `space-4`/16px column-gap) so this exact class of bug fails loudly if it recurs.

**This first fix was incomplete — the user re-reported the same symptoms with a second screenshot,** and pushed back specifically on the "small known gap" framing above and the CSS Grid approach generally ("Maybe grid approach is not the best method... do it properly and carefully"). Re-investigating rather than defending the first fix found the actual, different root cause:

**Root cause #1 (the real one): a plain percentage as a grid track's growth *limit* is a definite length, and CSS Grid's "Maximize Tracks" algorithm step actively grows a track toward its growth limit using the grid's own free space — not only when content needs it.** `minmax(auto, 40%)` on the term column therefore grew toward 40% of the *list's own width* regardless of how short the actual terms were: a 448px-wide list measured a 178px term column for "Customer"/"Email"/"Status" text under 100px — 40% of 448, coincidentally exactly matching what the first fix's own live check had measured and misread as "the fix worked" (it only confirmed the term's box now filled its own track; it never checked whether the *track itself* was sized correctly). Confirmed by recomputing: the CSS Grid spec's Maximize Tracks step distributes positive free space to all tracks up to their growth limits, and a percentage growth limit resolves to a concrete pixel value the moment the grid's own size is known — unlike `max-content`, which stays tied to actual content regardless of free space.

**Fix:** `fit-content(40%)` in place of `minmax(auto, 40%)` — the CSS Grid function purpose-built for "hug content, but cap it": sized to the column's own max-content, reaching for 40% only once content genuinely needs that much (verified: a 768px-wide list with the same three short terms now measures a 102px term column, not ~307px).

**Root cause #2: a real grid `column-gap` leaves a literal gap no border can be drawn into**, so the between-item divider (drawn as a border on the term and the details separately) could never look continuous no matter how correctly each segment was sized — this was true even after root cause #1's fix, and is what the user's second screenshot was actually showing. **Fix:** `column-gap: 0` on the shared grid, with the same visual spacing moved into the term's own trailing `padding-inline-end` (a fixed `space.4`, matching what the column-gap used to be) instead of true grid gutter — the term's and details' boxes are now directly adjacent, so their divider borders touch and read as one unbroken line, while the *text* keeps the identical visual gap it had before (verified: `dd.left` now exactly equals `dt.right`, a 0px true gap, confirmed live).

**Both fixes verified with real margin, not just a passing screenshot:** a dedicated real-browser scenario (short terms in a 768px-wide container — the exact shape that exposed root cause #1) measures the term column at 102px against a 200px regression-guard ceiling (the old bug's value would have been ~307px); the zero-gap assertion checks for an *exact* pixel match, not "small enough." Re-verified live in Purple/Light and Purple/Dark.

## Icon-prefixed term example, added at the user's request (2026-09-28)

The user asked directly whether `DescriptionList.Term` is always text. Answer: no —
`children: ReactNode`, already unrestricted — but the follow-up ("add an icon-prefixed term
example and verify it live") surfaced a real rendering bug that a code-only answer would have missed.

**First attempt (Link's own technique — a plain inline `Icon` next to bare text, `vertical-align`
for baseline correction) broke at a narrow width, found live on the Docs page (which renders each
Canvas at its own, often narrow, embed width, not the wide viewport used while first building the
story).** The icon separated onto its own line, with the details value appearing wedged between the
icon and the wrapped-below label. Root-caused in two passes, not one:

1. First hypothesis: ordinary JSX formatting (icon and text on separate lines) inserts a real
   whitespace text node between them, giving the browser a legal break point. Fixed by removing the
   line break — did **not** fully fix it.
2. Re-investigated rather than trusting the first fix: confirmed directly in the rendered DOM that
   there was genuinely zero whitespace between the icon and "Customer" (`dt.childNodes` was exactly
   `[svg, "Customer"]`), and it **still wrapped**. The actual cause: an atomic inline-level box (an
   SVG) gets an implicit line-break opportunity immediately after it in normal inline flow,
   independent of whitespace — this is normal browser behavior, not a whitespace bug.

**Fix:** wrap the icon and its label in a small `display: inline-flex` span (`align-items: "center"`,
a `space.1` `gap`) instead of relying on inline text-flow rules at all — flex children never wrap
between each other the way inline content can, so this holds at any width. Verified live by
programmatically wrapping the existing (still-broken) DOM in the browser first (confirming the
hypothesis before writing any source change), then applying the same fix to the actual source and
re-verifying: a dedicated real-browser story (`AlignedTermsChecks`' `narrow-icon-term` scenario, a
13rem/208px container — matching the Docs-page embed width that exposed the bug) asserts the icon and
its label's own text-node stay within 10px of each other vertically (an exact same-line check, not
just "doesn't crash"). Re-verified in Purple/Light and Purple/Dark.

Documented the working technique (not the broken one) in three places so it can't regress silently
by being copied from stale docs: `DescriptionListTermProps.children`'s own JSDoc, the MDX Usage
guidelines, and the MDX Code examples/Storybook snippet (all three originally shipped the broken
`vertical-align` version in the same session, before the narrow-width Docs-page check caught it — all
three were corrected together, not just the story).

## `align-items: baseline` broke vertical centering and the divider, once a row's two cells had different natural heights (user-reported, with a screenshot)

The icon-prefixed-term example (above) shipped with `align-items: baseline` on the shared grid (inherited from the original, icon-free design). An icon-prefixed term's line is genuinely taller than a plain-text details line, and `baseline` positions each cell by its own text baseline rather than its box — so `Jane Cooper` (no icon) sat visibly off-center against the taller `Customer` term, and — the same underlying cause, a second symptom — the divider border below `Email` (drawn separately on the term's box and the details' box) landed a few pixels higher on the term side than the details side, since the two boxes no longer shared a common top edge once their natural heights diverged.

**Fix:** `align-items: stretch` on `.alignedDetails` (replacing `baseline`) — both `.term`'s and `.details`' own boxes now always span the row's full height, whichever side's content happens to be taller, which is what actually fixes the divider (both sides' borders are drawn at the same, shared row-top edge, unconditionally). Centering the *content* within that now-possibly-taller box is a separate, additional rule: `.alignedDetails .term`/`.details` are now `display: flex; align-items: center`, so a short plain-text line (or an icon+text run) centers vertically within whatever height the row ends up being.

**Verified with exact-match assertions, not just "close enough":** measured live that the term's and details' *boxes* land at identical top/bottom (`toBe`, not `toBeCloseTo`) for a row with a genuinely taller icon-prefixed term next to a plain-text details value, and that the icon's own center, the term text's center, and the details text's center all land at the same Y position (within 2px). Re-verified the "Aligned vs. per-item term widths" gallery (multi-line wrapped term next to a longer wrapped details value) — stretch+center reads as an improvement there too, centering the shorter wrapped term against the full height of the taller wrapped value rather than pinning both to the same top baseline. Checked in Purple/Light and Purple/Dark; full suite (typecheck, lint, unit, real-browser Chromium) re-verified clean.

## Storybook Controls panel: inert `aria-label` control and prop order, both user-reported

Two related Storybook-hygiene defects, both against the established, already-Finalized-component convention this project checks for explicitly (`06-engineering-standards.md` §9's own Storybook checklist items) rather than anything specific to `DescriptionList`:

1. **`aria-label` showed as an inert "Set string" placeholder in the Controls panel** — it had `control: "text"` but no explicit value in the Playground's own `args`, and an arg left `undefined` renders as a non-interactive placeholder button rather than a live control (the documented failure mode `07-storybook-and-documentation-standards.md` §5 already names). Rather than inventing a default value, checked how `Table`/`Card` — both already-Finalized components with the identical "accessible-name override, never visibly rendered" `aria-label` prop — handle this: both set `control: false` outright, since there's nothing in the canvas for a live edit to demonstrate. Matched that precedent exactly, and added `aria-label` to the `PlaygroundControls` `exclude` list alongside `aria-labelledby`/`aria-describedby` (which were already excluded).
2. **Prop order put `id`/`className`/`style`/`data-testid` before the `aria-*` props**, the reverse of every other already-Finalized component checked (`Table`, `Card`, `Alert`, `Breadcrumb`, `AvatarGroup` all order `aria-label, aria-labelledby, aria-describedby, id, className, style, data-testid`). Fixed in three places, not just the visible one: the `DescriptionListProps` interface's own field declaration order in `DescriptionList.types.ts` (confirmed via `Card.types.ts` that the already-Finalized components' *interfaces*, not just their `propOrder` arrays, follow this same order), `DescriptionList.stories.tsx`'s `argTypes`, and the MDX `propOrder` array.

**The interface reorder needed a Storybook dev-server restart to actually take effect** — confirmed live: the native per-story Controls tab still showed the old order after saving the file (Vite HMR doesn't invalidate react-docgen's own cache for a changed type file, the exact gotcha `07-storybook-and-documentation-standards.md` already documents from `Tabs`' own review). Restarted the server and re-verified both the native Controls tab and the Docs page's `PropertiesTable`/`PlaygroundControls` show the corrected order and the corrected `aria-label` control. Full suite re-verified clean: typecheck, lint, unit tests (4629), docs token-drift guard, story-snippets guard, and the real-browser Chromium suite (10/10).

## Cross-links added (2026-09-29, at the user's request)

`Table.mdx`, `Card.mdx`, and `EmptyState.mdx` (all already-Finalized) now each carry a `RelatedCard`
back to `DescriptionList`, closing the one-directional-linking gap noted below. Purely additive
(a new card each, nothing existing changed) — per `06-engineering-standards.md` §9's three-question
finalization test, none of the three reopen. Verified live in Purple/Light and Emerald/Dark, and that
each preview is inert (a click on it doesn't navigate away from the Docs page it's on).

## Final `06-engineering-standards.md` §9 review pass (2026-09-29)

Closed every item this component's review had left outstanding, plus a full re-sweep of the rest of
the checklist. **Found zero real defects in the component's actual runtime behavior** — every
previously-unverified item came back clean on the first real-browser check:

- **Keyboard navigation** — confirmed programmatically (not just reasoned about): zero elements
  inside a rendered `DescriptionList`, across all 16 descendants of a real example, carry a
  `tabIndex`/are natively focusable. Matches the component's own "deliberately non-interactive"
  design — there is nothing for keyboard navigation to get wrong.
- **Right-to-left** — added a dedicated real-browser check story (`RightToLeftChecks`) covering
  horizontal orientation (term/details swap sides), an icon-prefixed term (the icon stays on the
  logical start side, not stranded by a hardcoded physical offset), and a multi-column grid (column
  order mirrors). All three passed against real `getBoundingClientRect` measurements on the first
  run — no fix needed. Every directional value in this component's CSS was already a logical
  property, and this is the first time that was actually confirmed in a real browser rather than
  assumed from reading the CSS (the project's own standing rule, motivated by `RangeSlider`'s
  identical assumption once being wrong).
- **Forced colors (Windows high contrast)** — verified by code inspection rather than a live emulation
  this project's own browser tooling can't drive directly: `DescriptionList.module.css` has neither of
  the two patterns that have ever caused a forced-colors defect elsewhere in this codebase (a
  transparent border reserved for layout stability, or CSS-generated `content`) — every border is a
  real, non-transparent token, which forced-colors mode recolors but does not hide.
- **Context provided to children, tested nested inside itself** — a real checklist gap: added a unit
  test nesting a differently-configured `DescriptionList` inside another one's own `Details`, and
  documented (in `DescriptionList.tsx`'s own context comment, not just left implicit) why this
  component deliberately does *not* merge with an outer instance's context the way `ButtonGroup`
  does — every field here always resolves to a concrete value via its own destructuring default, so
  there's no "left unset, should inherit the parent" case for merging to solve in the first place.
- **Realistic content at every size** — checking the icon-prefixed-term example specifically at `xs`
  and `xl` (not just the default `md` it was built and screenshotted at) found a real, if minor,
  design-quality gap: the demo's own icon was hardcoded to `size="sm"` regardless of the list's own
  `size`, reading as visibly undersized at `xl` and slightly large at `xs`. Not a component defect
  (`DescriptionList.Term` has no icon slot to own that sizing decision in the first place), but a
  polish gap in the shipped example — fixed by scaling the demo's own icon size with the control.

Full suite re-verified clean after every change in this pass: typecheck, lint, unit tests (22 now,
including the new nested-context test), docs token-drift guard, story-snippets guard, and the
real-browser Chromium suite (11 stories now, including the new `RightToLeftChecks`).

## Not yet done

**Closed across follow-up sessions:** `DescriptionList.docs.test.ts` (the CSS-vs-mdx token drift
guard); `04-component-inventory.md`'s molecule build-order list and
`07-storybook-and-documentation-standards.md` §6's status table updated to record the build; a real
run of the `@storybook/addon-vitest` Chromium project against this component; the reverse
`RelatedCard` cross-links from `Table`/`Card`/`EmptyState`; and (2026-09-29) the full
`06-engineering-standards.md` §9 checklist, including keyboard-nav verification, an RTL pass, and a
forced-colors check — all closed with zero real defects found. See this file's own sections above for
the detail on each.

As of this review pass, every checklist item this file has ever flagged as outstanding is now closed.

**Declared Finalized by the user, 2026-09-29.**
