# Grid

**Tier:** Molecule · **Category:** Layout · **Finalized:** Not yet — pending user confirmation

## Review pass (2026-09-11)

Full `06-engineering-standards.md` §9 pass — first review for this component, and the first
molecule-tier review overall (landed 2026-08-09, before the review-pass discipline existed, and
had no Docs page until now). Also the first component reviewed against the six molecule/organism-
only checkpoints added to §9 the day before this pass. Findings, in the order fixed
(Playground-missing first, Docs-page-missing last, per the standing reporting convention):

1. **Playground story added.** `Grid.stories.tsx` had 8 stories but no `argTypes` and no dedicated
   Playground — every story used a bare `render: () => (...)` that ignored `args` entirely, so
   nothing was live-controllable. Added a full interactive Playground (a 3×2 grid of small,
   non-stretching "chip" cells inside a 20rem-tall container with `autoRows="6rem"`, so both
   item-alignment and content-alignment props have real room to show an effect) plus `argTypes`
   for all 16 props, and gave every existing story `control: false` on the props it intentionally
   hardcodes.

2. **Real, confirmed API gap: `id`/`className`/`style`/`data-testid` weren't explicitly redeclared
   in `GridProps`.** Not a new discovery — `GridItem`'s own review (2026-09-07) already caught this
   exact gap in `Grid` and explicitly deferred it, since `Grid` hadn't been reviewed yet. Fixed by
   redeclaring all four with the same JSDoc wording `Box`/`Stack`/`GridItem` already use.

3. **Feature-completeness gap, closed at explicit user direction: no grid-alignment props.**
   `Grid` had no way to control item or content alignment — a consumer had to drop to the `style`
   escape hatch for anything beyond the implicit browser default. Added `justifyItems`/`alignItems`
   (`justify-items`/`align-items` — how each item aligns within its own cell) and
   `justifyContent`/`alignContent` (`justify-content`/`align-content` — how the grid's own tracks
   are positioned within the container). All four accept a single value or a mobile-first
   responsive map, matching every other prop here, via the same `responsiveStyle` + CSS custom
   property + six-breakpoint media-query cascade `columns`/`gap` already use. Left `undefined` by
   default (no JS-level default value) so existing usage renders identically to before — purely
   additive, non-breaking.

   **Real, non-obvious finding surfaced while building this:** `justifyContent` has **no visible
   effect** under `Grid`'s own default track sizing. Both `columns` and `minChildWidth` generate
   `1fr`-based column tracks, which by definition always expand to fill 100% of the container's
   inline size — leaving no leftover space for `justify-content` to position tracks within. It's
   only reachable by overriding `gridTemplateColumns` directly via `style` with fixed (non-`fr`)
   track sizes — documented explicitly in the prop's own JSDoc, called out in the Docs page's
   Don't list, and demonstrated via exactly that override technique in the dedicated
   `ContentAlignment` story (the only way to show it actually working). `alignContent` doesn't have
   this limitation — row tracks size to content/`autoRows` by default, neither of which is
   `fr`-based, so an explicit container height taller than the row content leaves real block-axis
   space for it to use.

   Also caught and fixed a design mistake made while first drafting the `ItemAlignment` story:
   `justifyItems`/`alignItems` are grid-container-level props applying uniformly to every item —
   not per-item props on `GridItem` (which has no such props). The story originally tried to set
   them individually per `GridItem` instance, which doesn't compile against `GridItemProps` and
   wouldn't reflect how the API actually works. Fixed by comparing two side-by-side grids (one
   unset, one with both props set) instead.

4. **Consumed-atom (`GridItem`) check: no defect found.** Read `GridItem.tsx`/`.module.css` in full
   against `Grid`'s own responsive-token mechanism — consistent, correct, nothing to raise against
   the already-Finalized atom.

5. **Out-of-scope discovery, flagged not fixed here:** running a full `tsc --noEmit` (broader than
   what this package's own `lint` script actually checks — see that finding's own note below)
   surfaced 2 pre-existing type errors unrelated to `Grid`, in two other already-Finalized
   components (`ClientOnly.stories.tsx`, `ThemeProvider.test.tsx`). Not touched as part of this
   review; flagged to the user for a separate task.

6. **Docs page added** (`Grid.mdx`), full 10-section template. Live-verified: TOC renders all 10
   section headings via the hidden "Intro" heading pattern; Properties table renders all 16 props
   in the declared order with real, non-empty descriptions and correct value-option pills for every
   enum prop; all 10 story canvases render real content (including the two new alignment stories);
   both `RelatedCard`s (`GridItem`, `Stack`, `Box`) render live previews and navigate correctly.

   **Real bug caught and fixed during this same verification pass:** all three `RelatedCard` `href`
   props were written without the required `/?path=` prefix (`href="/docs/atoms-layout-box--docs"`
   instead of `href="/?path=/docs/atoms-layout-box--docs"`) — confirmed by reading the actual
   rendered `<a>` element's `href` attribute in the live DOM, not assumed from the source. This is
   exactly the RelatedCard-href convention `07-storybook-and-documentation-standards.md` §4.1
   already documents (a `RelatedCard`'s `href` is a raw anchor and must include `/?path=`, the
   opposite of a Markdown-syntax link, which must omit it and let Storybook's own `Link` add it).
   Fixed by adding the missing prefix to all three; re-verified live — the rendered `href` now
   reads `/?path=/docs/...` and a real click-through lands on the correct target page. The
   Markdown-syntax links in the page's own prose (in the Intro and Usage guidelines sections) were
   already correct (bare `/docs/...`, no prefix) and needed no change.

   Both brand themes × both modes confirmed live via a full page screenshot each (not just the
   toolbar toggle existing) — text, badges, code blocks, and callouts all render with correct
   contrast in Emerald/Dark. `GridItem.mdx`'s own "Grid" `RelatedCard` still links to `Grid`'s
   Storybook story directly (not its new Docs page) — this is a leftover from before `Grid` had a
   Docs page, and updating it means touching an already-Finalized component. **Flagged, not
   changed**, pending authorization.

## Out-of-scope discovery (informational, not part of this component's own findings)

Running `pnpm exec tsc --noEmit` (the bare project tsconfig, broader than what `lint` actually
runs) surfaced 2 pre-existing type errors having nothing to do with `Grid`:
`src/atoms/ClientOnly/ClientOnly.stories.tsx` (a `tone` prop passed to `Text` that doesn't exist on
its type) and `src/atoms/ThemeProvider/ThemeProvider.test.tsx` (an unused `@ts-expect-error`).
Neither is caught anywhere in this package's own tooling today — `lint` only typechecks
`.storybook/tsconfig.json`, not the main `src` tree, and `build` (`tsup`) only follows the public
`index.ts` import graph, which never reaches `.stories.tsx`/`.test.tsx` files. Both errors are in
already-Finalized components, so neither was touched here.

## Verification

`tsc --noEmit` (main tsconfig — clean for every `Grid`-owned file; the 2 pre-existing unrelated
errors above are the only output), `eslint . --max-warnings 0` (whole package, clean),
`typecheck:storybook` (`.storybook/tsconfig.json`, clean), full `vitest` unit suite (1070/1070
passing package-wide, 19/19 for `Grid` itself, up from 12 pre-review), the `storybook` Vitest
project (375/375 passing package-wide, unrelated console warnings from other components'
own dev-mode checks, not `Grid`), `tsup` build (clean), `check-component-bundle-size` (`Grid`:
0.55KB JS / 0.48KB CSS gzipped, comfortably within budget), and `check-foundations-token-coverage`
(unaffected, still in sync) all run and passing. Live-verified in Storybook: Playground's
`justifyItems` control confirmed to actually reposition the chips (not just accepted by the
control); the `ItemAlignment` and `ContentAlignment` stories confirmed to show the documented
effect, including `justifyContent`'s fixed-track-size workaround actually working; 0 accessibility
violations across three different stories checked; both brand themes × both modes confirmed live
on the Docs page; `RelatedCard` navigation confirmed via a real click-through, not just the
rendered `href`.

## Post-review fix (2026-09-11, user-reported)

**"Does justifyContent prop have any values? I don't see any listed in the docs page properties
table."** Confirmed: `justifyContent`'s argType had `control: false` (correctly, since the prop is
inert in the Playground's own demo — see finding 3 above) but no `options` array, unlike its three
sibling alignment props. `control: false` only governs whether the Playground/Controls widget is
live — it has no bearing on whether `PropertiesTable` shows a prop's documented value set, so
stripping the control shouldn't have stripped the values too. Fixed by adding
`options: ["start", "center", "end", "stretch", "between", "around", "evenly"]` (identical to
`alignContent`'s own set) alongside the existing `control: false`. Re-verified live: the Properties
table now shows all 7 value pills for `justifyContent`, and the Playground's own Controls panel
still correctly shows "–" for it (unaffected by adding `options`). `eslint`, `tsc`, and the full
`Grid.test.tsx` suite (19/19) re-run clean after the fix.

## Post-review audit (2026-09-11, user-requested): full prop/control wiring check

**Request: "check all the grid props/values and make sure they are listed and implemented for
grid. Also, review and make sure grid controls/props are wired properly for all grid stories and
in grid docs page playground."**

**Prop/value audit: no gaps found.** Cross-checked all 16 props in `GridProps` against their
implementation in `Grid.tsx` (every one wired to real CSS behavior) and against `Grid.stories.tsx`'s
`argTypes` (every one declared, with a real `options` array for every enum-typed prop) and
`Grid.mdx`'s `PropertiesTable` (all 16 present, correct order, real descriptions, correct value
pills). Nothing missing.

**Control-wiring audit: found a systemic bug across all 10 non-Playground stories.** Every one used
an args-free `render: () => (...)` — even though several props were left "live" (no `control:
false`) in their own `argTypes`, moving those controls did nothing, since the story never read
`args` at all. Confirmed empirically on "Fixed 4 columns": changing the `gap` control from 4 to 12
left the canvas's computed `gap` at 16px (unchanged). This is exactly the "story ignores its own
args" bug class `06-engineering-standards.md` §9 already documents — it predates this review
(the original 8 stories all had this shape) but should have been caught during finding 1's own
Playground work and wasn't.

**Fixed all 10 stories** — each now uses `render: (args) => ...` and genuinely shares whichever
props aren't its own specific focus:
- `DefaultColumns`/`FixedColumns`/`ResponsiveColumns`/`WithSpanningItems`/`DensePacking`: `columns`
  fixed (hardcoded or explicitly forced `undefined`), everything else live via `{...args}`.
  `DefaultColumns` needed `columns={undefined}` specifically (not just `control: false`) since the
  whole point of the story is the prop being genuinely absent.
- `ResponsiveGap`: `gap` fixed (a responsive map, the multi-instance-gallery exception), `columns`
  now live.
- `FluidMinChildWidth`: `minChildWidth` fixed, everything else live.
- `ItemAlignment`: redesigned so both comparison grids share one `sharedProps` object built from
  `args` — `columns`/`gap`/`autoRows`/etc. now update both grids in lock-step; only
  `justifyItems`/`alignItems` differ (left grid forces them `undefined`, right grid uses their live
  value). The first draft of this fix left the left grid fully hardcoded, which would have let the
  two grids silently drift apart under any other live control — caught before shipping.
- `ContentAlignment`: `columns` fixed (always overridden by the story's own `gridTemplateColumns`
  style override), everything else live, including `justifyContent`/`alignContent` themselves via a
  story-level `args` override of their old hardcoded values.
- `AsUnorderedList`: `as` fixed, `columns`/`gap` now live (`args: { columns: 3, gap: 3 }` matching
  the original hardcoded demo values).

**A second, related bug found and fixed while verifying `ContentAlignment`:** `justifyContent` has
`control: false` at the *meta* level (correct everywhere else, since it's genuinely inert under
default track sizing) — but that also silently disabled it on this one story, the single place it
actually has a visible effect, since a story's `argTypes` only override what it explicitly
redeclares. Fixed by re-declaring `justifyContent`'s control (`select`, the same 7 options) directly
in `ContentAlignment`'s own `argTypes`, overriding the meta-level `false`. Confirmed live: the
control now shows `between` (not `-`), and changing it to `center` visibly regrouped the three
chips.

**One TypeScript error surfaced and fixed while rewriting `ItemAlignment`:** `args.justifyItems`/
`args.alignItems` are typed `Responsive<GridItemsAlign>` (a plain value *or* a breakpoint map),
which isn't directly renderable as JSX text — rendering them in the story's own comparison label
needed a small `typeof value === "string" ? value : "unset"` guard first.

**Re-verified after all fixes:** `tsc --noEmit`, `eslint . --max-warnings 0`, `typecheck:storybook`,
full `vitest` unit suite (1070/1070) and `storybook` project (375/375), `tsup` build, and
`check-component-bundle-size` all clean. Live-verified every fixed story in the browser, not just
read the code: `gap` on "Fixed 4 columns" (16px → 48px on a real control change, computed style
confirmed both before and after); `columns` on "Default" (control disabled, canvas shows 12,
`gap` control live at its own `2` default); both grids in "Item alignment" moving together on a
shared `gap` change, and only the right one moving on a `justifyItems` change; `justifyContent` on
"Content alignment" now showing a real value and genuinely repositioning the chips; `columns` on
"Polymorphic: as=ul" changing the rendered column count. 0 accessibility violations re-confirmed on
"Content alignment."

## Post-review visual pass (2026-09-11, user-requested, with a screenshot)

**Request: improve the stories' visual presentation — the Playground at `gap=0` still showed a lot
of dead white space, `gap=7` had no visible effect, add a consistent dashed container outline
across every story, and review each story's own demo for clarity.**

**`gap=7` — root-caused, not just cosmetic.** The spacing token scale is a fixed, discontinuous set
(`0,1,2,3,4,5,6,8,10,12,16,20,24,32` — no `7`, `9`, `11`, etc.), and `SpaceValue` already enforces
this exact union at the type level; `gap={7}` wouldn't compile in real usage. The Playground's own
`gap` argType was a plain `control: "number"`, which let an invalid step through — it silently
resolved to nothing and the whole `gap` declaration collapsed to its initial value (0), with no
error anywhere. `Stack.stories.tsx` (already Finalized) already gets this right — `control:
"select"` with the literal `[0,1,2,3,4,5,6,8,10,12,16,20,24,32]` options array. Fixed `Grid`'s own
`gap` argType to match exactly.

**Dead space at `gap=0` — a demo-content sizing issue, not a `gap` bug.** The Playground's chips
were a fixed 3rem inside columns that could be 19rem+ wide at the canvas's full width — at any
`gap` value, most of the visible "space" was actually the chip-to-cell-edge gap `justifyItems`/
`alignItems` need to demonstrate positioning, not the `gap` prop itself, which made the two easy to
conflate. Fixed by bumping the shared chip size (3rem → 4.5rem) and constraining the Playground's
own container to `maxWidth: 28rem` (and `height: 20rem → 16rem`) — chips now fill a consistent,
substantial share of each cell, `gap` changes read clearly, and there's still enough leftover room
for `justifyItems`/`alignItems`/`alignContent` to visibly move. `ItemAlignment`'s two comparison
grids got the same chip-size bump plus a proportionally widened container (`10rem → 13rem`).
**Known, accepted limitation carried over from the original design, not introduced by this fix:**
with the chip's size expressed as a fixed dimension, `justifyItems="stretch"`/`alignItems="stretch"`
can't visibly stretch it to fill the cell — a definite size always wins over `stretch`. Every other
value (`start`/`center`/`end`/`baseline`) demonstrates correctly; `stretch` reads identically to
`start` in this specific demo. Not fixed here — flagging it rather than leaving it silently
undocumented.

**Dashed container outline — added to every story, not just the Playground and Content alignment.**
`DefaultColumns`, `FixedColumns`, `ResponsiveColumns`, `WithSpanningItems`, `ResponsiveGap`,
`FluidMinChildWidth`, `DensePacking`, `ItemAlignment` (both grids), and `AsUnorderedList` now all
render `outline: "1px dashed var(--dbm-border-default)"` on the `Grid` itself, matching what
`Playground`/`ContentAlignment` already had — the grid's own boundary is now visible everywhere,
including where full-bleed `cellStyle` content already fills the space edge-to-edge.

**Per-story visual review:** the 8 full-bleed-`cellStyle` stories (`DefaultColumns` through
`DensePacking`) needed no content changes — `cellStyle` cells already stretch to fill their cell, so
`gap`/`columns` changes were already clearly visible there; they only needed the outline added.
`ItemAlignment`/`ContentAlignment` (the two chip-based stories) got the sizing fixes above.
`AsUnorderedList` needed only the outline.

**Re-verified:** `tsc --noEmit`, `eslint . --max-warnings 0`, `typecheck:storybook`, full `vitest`
unit suite (1070/1070) and `storybook` project (375/375), `tsup` build, and
`check-component-bundle-size` all clean (Storybook-only change, bundle size unaffected). Live-
verified in the browser: `gap`'s control now shows a real dropdown of exactly the 14 valid steps;
toggling it between `0` and `4` on the Playground shows a clear, unambiguous difference; the dashed
outline renders correctly (including in Emerald/Dark) on every checked story; 0 accessibility
violations re-confirmed on Playground, `DefaultColumns`, `ItemAlignment`, and `AsUnorderedList`.

## Post-review fix #2 (2026-09-11, user-reported): fixed-size demo chip was itself broken

**"Are gap values related to spacing tokens? Changing values don't seem like updating the gap
correctly."** Confirmed `gap` genuinely is token-driven and was computing correctly in every case
(re-verified via computed style at `gap=0`, `4`, `32`) — the *previous* fix (bumping the shared
chip to a fixed `4.5rem`) traded one problem for two new, real ones, both traced to the same root
cause: a **fixed-size** demo chip can't adapt to whatever column/row size the current props
actually produce.

1. **At large `gap` values, the chip overflowed its own shrinking column** — confirmed on the
   Playground at `gap=32`: columns shrank to 64px (1fr tracks give up space to a growing gap
   before anything else), but the chip stayed a fixed 72px, visibly spilling past the grid's own
   dashed boundary.
2. **In `ContentAlignment`'s fixed 4rem (64px) tracks, the 4.5rem (72px) chip was *permanently*
   oversized** — confirmed live: chips visibly overflowed their columns even at the story's own
   default settings, unrelated to `gap` entirely.
3. **The deeper issue behind "gap doesn't seem to update correctly":** with a small fixed chip in
   a wide column (the Playground's own original design), most of the visible space between chips
   was the *column's own unfilled leftover* (needed so `justifyItems`/`alignItems` have room to
   move), not `gap` itself — confirmed by measuring actual chip-to-chip pixel distance: at the
   original ~19rem-wide columns, that baseline leftover was ~77px against which a `gap` change of
   16px (a ~21% relative change) was easy to miss or misread as "not working." The first round of
   fixes (bigger chip, narrower container) reduced this in absolute terms but didn't fix the
   underlying mismatch.

**Fixed by switching `chipStyle` from a fixed rem size to a percentage of its own cell (`80%` width
and height)** — CSS resolves a grid item's percentage width/height against its own grid area, which
is already definite once the grid's tracks are sized, so this works correctly (verified, not
assumed) and: cannot overflow regardless of how small `gap` or a story's own fixed tracks make the
column (percentage can never exceed 100% of its container); shrinks the baseline "leftover space" at
every column width (re-measured: chip-to-chip distance at `gap=0` dropped from ~77px to ~30px in the
Playground), so a `gap` change now reads as a much larger, clearer relative jump against a small,
consistent margin.

**Re-verified:** `tsc --noEmit`, `eslint . --max-warnings 0`, `typecheck:storybook`, full `vitest`
unit suite (1070/1070) and `storybook` project (375/375) all clean. Live-verified in the browser:
`gap=0`/`4`/`32` on the Playground (computed style + measured chip-to-chip pixel distance each
time, not just visual impression) — no overflow at any value, chip always proportionally sized;
`ContentAlignment`'s previously-overflowing chips now fit cleanly inside their fixed 4rem tracks;
`ItemAlignment` re-checked, alignment differences still clearly visible with the smaller, correctly-
scaled chips. 0 accessibility violations re-confirmed on Playground, `ContentAlignment` (one
"inconclusive" axe entry present both before and after this change — persists across a fresh re-run,
unrelated to this fix), and `ItemAlignment`.

## Post-review enhancement (2026-09-11, user-requested): column track visualization

**"For Grid component stories, add a background color to represent each column or row to better
visualize grid items in the grid layout. Use color token bg.warning-subtle."**

**Real technical obstacle found and worked around, not assumed away:** the first approach
considered — extra grid items inside the same grid, each explicitly spanning one column and every
row — was checked against the CSS Grid placement algorithm before building anything: an
explicitly-positioned item is treated as "occupying" its cells for the purposes of every *other*
item's own auto-placement, so a full-height stripe in column 1 would have silently excluded every
auto-placed real child from ever landing in column 1 at all — breaking the very layout the story
demonstrates. Built as a separate, absolutely-positioned overlay instead (`ColumnTrackOverlay`,
`aria-hidden`, `zIndex: -1`, `pointerEvents: "none"`), running its own nested grid that mirrors the
real grid's `columns`/`gap`/`gridTemplateColumns` so its track boundaries land pixel-for-pixel on
the real ones, with zero interaction with the real grid's own placement.

**Two real alignment bugs found and fixed during verification, not assumed correct from the code
alone:**

1. **`<div>` is not valid content for a real `<ul>`** (only `<li>`/`<script>`/`<template>` are) —
   `AsUnorderedList` renders the overlay inside a real `<ul>`. Confirmed live that React's direct
   DOM APIs (unlike HTML-string parsing) don't actually enforce this and would have silently
   accepted the invalid nesting with no console warning — still fixed properly by adding an `as`
   prop to the overlay (`"div" | "li"`) rather than relying on the browser being lenient.
2. **The overlay didn't mirror the real grid's own `justifyContent`/`alignContent`** — found by
   measuring actual `getBoundingClientRect()` coordinates on `ContentAlignment` (not assumed from
   a screenshot): the overlay's stripes sat packed at the container's start (CSS Grid's own
   `justify-content: normal` default), while the real chips were spread via `justifyContent=
   "between"` — completely different positions, not just a few pixels off. Root cause: `Grid.tsx`
   maps the abstracted `"between"/"around"/"evenly"` prop values to real CSS keywords
   (`space-between` etc.) internally via a private, unexported `CONTENT_ALIGN` map; the overlay
   needs the identical translation, added here as a small duplicated `toCssContentAlign` helper
   (Storybook-only presentational code, not shipped logic, so duplication was the pragmatic choice
   over exporting internal implementation detail from the component itself). Fixed and *re-verified
   by measurement*, not just visual re-inspection: stripe and chip rects now match exactly.
   Applied to every story's overlay usage, not just `ContentAlignment` — `alignContent` is a live,
   uncontrolled prop on every story, so the same latent misalignment was possible anywhere a reader
   changed it, not just the one story that happens to default away from "normal."

**Scope, deliberately not comprehensive:** `ResponsiveColumns` and `ResponsiveGap` don't get an
overlay — both stories' whole point is that `columns`/`gap` itself changes per breakpoint, and the
overlay needs one concrete value to mirror; a static overlay would only match one breakpoint and
visibly misalign at the other two. `FluidMinChildWidth` (auto-fill) is skipped for the same reason
— the actual rendered column count isn't known ahead of render.

**Real, honest finding about the token itself, not silently glossed over:** `bg.warning-subtle` is
a genuinely pale/near-white tint in light mode (`#fdfaf5`) and a dark, low-luminance tint in dark
mode (`#211300` against a `#2c2a34` surface) — confirmed correct implementation (computed styles
match the token exactly), but the *visual* result is real yet subtle by design, consistent with
what "subtle" tokens are for. Flagged to the user rather than silently swapping to a bolder token
on my own judgment, since the exact token was specified explicitly.

**Re-verified:** `tsc --noEmit`, `eslint . --max-warnings 0`, `typecheck:storybook`, full `vitest`
unit suite (1070/1070) and `storybook` project (375/375) all clean. Live-verified in the browser:
overlay position/size matches the real grid exactly on multiple stories (measured, not assumed);
`AsUnorderedList`'s DOM now contains only valid `<li>` children; `ContentAlignment`'s stripe-to-chip
alignment re-measured correct after the `justifyContent`/`alignContent` fix; 0 accessibility
violations re-confirmed across `DefaultColumns`, `ContentAlignment`, `WithSpanningItems`, and
`AsUnorderedList`; Docs page re-checked, no console errors, Playground embed renders correctly.
One incidental finding along the way: the dev server entered a broken, stuck-indexing state after a
transient syntax error (introduced and fixed within the same edit) and needed an explicit restart,
not just a page reload, to recover — noted here in case it recurs, not a code defect.

## Post-review fix #3 (2026-09-12, user-reported): overlay wasn't visible at all

**"I understand bg.warning-subtle is very pale, but it is not displayed in storybook's Grid stories
at all. fix it."** The previous entry's own diagnosis (color contrast too close to white) turned out
to be incomplete — re-investigated from scratch rather than trusting the prior conclusion, and found
**two further, more fundamental bugs**, both confirmed by direct experiment before fixing, not
assumed:

1. **Every stripe was rendering at ~2px tall, not the grid's full height.** Measured via
   `getBoundingClientRect()`: `{height: 2}`. Root cause: the overlay's own nested grid has no
   `grid-template-rows` of its own, and each stripe `<div>` has no content — so the single implicit
   row sized to its content's natural (empty) min-content height, i.e. near-zero, regardless of the
   outer overlay's own correct, full-size `inset: 0` box. Fixed with an explicit
   `gridTemplateRows: "1fr"` on the overlay, forcing the one row to fill the already-definite outer
   box.
2. **The overlay was painting behind an unrelated ancestor, not just behind the real chips.**
   `position: "relative"` alone does **not** establish a new CSS stacking context (only `position`
   combined with a non-`auto` `z-index` does) — without an explicit `zIndex` on `Grid` itself, the
   overlay's `zIndex: -1` had nothing local to resolve against and escaped to whichever ancestor
   further up the tree *did* establish one, painting behind that instead. Confirmed by direct
   experiment: setting `zIndex: 0` on `Grid` (overlay still at `-1`) was the one change that made an
   already-correctly-sized, already-correctly-colored overlay actually appear, behind the real
   content as intended. Added `zIndex: 0` alongside `position: "relative"` on every story's `Grid`
   style (9 call sites).

**A visible border was also added** (`border.warning`, not just the `bg.warning-subtle` fill) once
the geometry bugs were fixed and the fill's own real-but-subtle contrast against white became the
only remaining limiting factor — this was validated as the right call only *after* confirming the
first two bugs were the actual "not displayed at all" cause, not a workaround for them. The fill
stays exactly `bg.warning-subtle`, as specified; the border gives the track boundary itself
guaranteed visible contrast regardless of theme.

**Re-verified after all three fixes together, live, not just via computed style:** `Playground` at
`gap=0` (columns visibly touch, matching the already-fixed gap-token behavior) and `gap=4`
(clear separation) in both Purple/Light and Purple/Dark; `ContentAlignment` re-confirmed
stripe-to-chip alignment still correct after adding `zIndex`/`gridTemplateRows` (measured, not
assumed — the earlier `justifyContent`/`alignContent` fix and this fix touch adjacent but distinct
parts of the same style object); `DefaultColumns` (full-bleed `cellStyle` content) now shows a
clean 12-column outline even though the fill itself is fully covered; `AsUnorderedList`'s `<li>`
overlay renders correctly. 0 accessibility violations re-confirmed across all four. `tsc --noEmit`,
`eslint . --max-warnings 0`, `typecheck:storybook`, full `vitest` unit suite (1070/1070), and
`storybook` project (375/375) all clean.

## Post-review enhancement #2 (2026-09-12, user-requested): color scheme, full-width demos, responsive overlays for the 3 skipped stories

**Color scheme change, applied globally (all stories share the same `cellStyle`/`chipStyle`/
`ColumnTrackOverlay` definitions, so this was centralized, not per-story):**
- Dashed container outline: `border.default` → `border.focus`.
- Real grid items (`cellStyle`/`chipStyle`): fill `bg.brand-subtle` → `bg.brand`, text
  `text.primary` → `text.on-brand`.
- Column-track stripes: fill `bg.warning-subtle` → `bg.brand-subtle`, **border removed entirely**
  (per explicit instruction — `bg.brand-subtle` turned out to have enough real contrast against
  white to not need the `border.warning` crutch the previous fix added; confirmed live, re-verified
  via computed style: `rgb(249, 249, 255)` against the canvas's white, visibly distinct without a
  border in both light and dark).

**Playground now extends full canvas width** — removed the `maxWidth: "28rem"` constraint added
during the earlier gap-visibility fix; no longer needed now that the chip is percentage-sized
(scales correctly at any width) rather than a fixed rem value.

**`ItemAlignment` restacked** — the two comparison grids now render one per row (`flexDirection:
"column"` instead of the default row), each at `width: "100%"` instead of a fixed `13rem`.

**The 3 stories with no overlay — real reason, and now actually fixed, not left as a permanent
gap:** `ResponsiveColumns`, `ResponsiveGap`, and `FluidMinChildWidth` were deliberately left without
`ColumnTrackOverlay` in the original build — inline styles can't express `@media` queries, and the
overlay's `columns`/`gap` props only ever took one static value, which would have visibly misaligned
at two of every three breakpoints. Asked to fix rather than accept the gap, so built the real
capability instead of declaring it out of scope again:
- Added `Grid.stories.module.css` (Storybook-only, not shipped) with `.responsiveColumnsOverlay`
  (`1 → 2 → 3` at the same `md`/`lg` thresholds as `ResponsiveColumns`' own `columns` prop) and
  `.responsiveGapOverlay` (`1 → 8` at `lg`, matching `ResponsiveGap`'s own `gap` prop) — genuine
  `@media` cascades, not a JS/inline approximation.
- `ColumnTrackOverlay` gained `responsiveColumns`/`responsiveGap` boolean props that apply these
  classes and omit the conflicting inline `gridTemplateColumns`/`gap` (inline styles always beat
  class rules, so the two are mutually exclusive per property). `columns` still governs how many
  stripe `<div>`s render — the *maximum* across breakpoints (3, in both cases) — with the overlay's
  new `overflow: "hidden"` cropping whichever excess stripes don't fit the current breakpoint's
  actual track count (they auto-place into additional implicit rows below, invisibly).
- `FluidMinChildWidth` needed a different technique (no discrete breakpoint set to enumerate — the
  real column count is however many `auto-fill` tracks fit the current width, genuinely unknowable
  ahead of render): the overlay's `gridTemplateColumns` now reuses the identical
  `repeat(auto-fill, minmax(var(--dbm-space-32), 1fr))` formula the real `Grid` computes internally,
  so both derive the *same* count from the *same* container width with no JS measurement needed — a
  generous supply of 12 stripe `<div>`s, with the same `overflow: hidden` cropping any that don't
  fit.

**Re-verified live, via computed style, not just visual impression, on all three:** `ResponsiveColumns`
confirmed at both the default (~500px, 1 column) and an explicit 1280px desktop viewport (3 columns) —
`gridTemplateColumns` on the real grid and the overlay matched exactly at both (`389.328px 389.336px
389.336px` at desktop). `ResponsiveGap` confirmed at the default width — both real grid and overlay
computed `gap: 4px` (the `base` value) identically. `FluidMinChildWidth` confirmed — both real grid
and overlay independently computed 4 columns from the same container width, with `overflow: hidden`
correctly containing the unused stripe supply (verified via matching `getBoundingClientRect()` on the
overlay and the real grid).

**Re-verified overall:** `tsc --noEmit`, `eslint . --max-warnings 0`, `typecheck:storybook`, full
`vitest` unit suite (1070/1070), `storybook` project (375/375), `tsup` build, and
`check-component-bundle-size` (unaffected — `Grid.stories.module.css` is Storybook-only, never
reaches the published package) all clean. Live-verified: token values re-confirmed via computed
style (`border.focus`, `bg.brand`, `text.on-brand`, `bg.brand-subtle` all matched exactly); Docs page
re-checked, no console errors; 0 accessibility violations across every story checked, in both light
and dark.

## Post-review fix #4 (2026-09-12, user-reported): row-gaps never showed anywhere

**"I see the vertical gap in storybook's Grid stories, but visually, I don't see the horizontal
gaps; there is no white space between the rows."** Confirmed and root-caused, not just patched: the
overlay's original design rendered exactly `columns` many stripes, each an explicit `grid-row: 1 /
100`-equivalent (via `gridTemplateRows: "1fr"` on a single row spanning the overlay's *entire*
height) — one continuous block per column. Column-gaps showed correctly (real CSS `gap` between
adjacent stripes along that one row), but since a column was only ever *one* uninterrupted stripe
top to bottom, there was no row boundary anywhere for a row-gap to visibly break — this was true on
every single story with more than one row, not an isolated case.

**Redesigned, not patched:** `ColumnTrackOverlay` now renders one stripe per grid *cell* (`count`
many, no explicit position), letting the same CSS Grid auto-placement algorithm the real content
uses lay them out. Real row-gaps now appear naturally between every row, at exactly the same
position the real grid's own rows break, for free — no separate row-count tracking needed for the
common case. Two real design questions this raised, both resolved deliberately:

1. **How many stripes to render.** For a plain grid (`Cells`/`Chips`, no `colSpan`), `count` matches
   the real content's own item count exactly — auto-placement then naturally reproduces the same row
   count as the real content at *any* column count, including a responsive one that changes per
   breakpoint (`ResponsiveColumns`) or one CSS itself computes (`FluidMinChildWidth`'s `auto-fill`),
   with no separate calculation. For the two `colSpan` stories (`WithSpanningItems`, `DensePacking`),
   the real content's cell *occupancy* isn't 1 item = 1 cell, so `count` is `rows × columns` instead
   (`8` = 2×4 for both, computed once by hand from each story's own known layout — verified by
   tracing the actual auto-placement algorithm for `DensePacking`'s `row dense` case, not assumed).
2. **How tall each auto-generated row should be**, now that empty stripe `<div>`s are placed one per
   cell instead of one continuous block: for a `Chips`-based story (`Playground`, `ItemAlignment`),
   the real grid's own resolved `autoRows` (e.g. `"6rem"`) is now passed straight through to the
   overlay's `gridAutoRows` — exact, not approximated. For a `Cells`-based story (every other one,
   none of which set an explicit `autoRows`, relying on `cellStyle`'s own padding + text for natural
   height), each stripe now gets the same `padding: var(--dbm-space-3)` plus a `visibility: hidden`
   text node — matching real content's box model closely enough that natural content-driven row
   sizing lands on close to the same height, without hardcoding a guessed pixel value.

**Re-verified live via measured `getBoundingClientRect()`, not visual impression, on `Playground`**
(the case checked most rigorously): row 1 and row 2 stripes both measured exactly 96px tall
(matching `autoRows="6rem"`), with exactly 16px between them (matching `gap={4}` = `space-4` =
1rem), and every real chip's own rect falling entirely inside its corresponding stripe's bounds.
Spot-checked visually (row-gap clearly visible, 0 accessibility violations) on `FixedColumns`,
`ItemAlignment`, `AsUnorderedList` (DOM re-confirmed still valid — `<li>`-only children), 
`WithSpanningItems` and `DensePacking` (both correctly show the full underlying track rectangle,
including the row-gap, even beneath spanning items that themselves cover multiple stripe cells at
once), and `FixedColumns` again in Emerald/Dark. Full suite re-run clean: `tsc --noEmit`,
`eslint . --max-warnings 0`, `typecheck:storybook`, `vitest` unit (1070/1070) and `storybook`
project (375/375) tests.

## Status

Review pass complete, all findings actioned. **Not yet Finalized** — per
`06-engineering-standards.md` §9, only the user declares a component's review pass done. Two items
need a decision before or alongside that:

- Whether to update `GridItem.mdx`'s own "Grid" `RelatedCard` to link to `Grid`'s new Docs page
  instead of its raw story (an edit to an already-Finalized component, needs authorization).
- What to do about the 2 pre-existing, out-of-scope `tsc` errors and the underlying tooling gap
  (`lint` not covering main-`src` typecheck) — see the section above.
