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

## Status

Review pass complete, all findings actioned. **Not yet Finalized** — per
`06-engineering-standards.md` §9, only the user declares a component's review pass done. Two items
need a decision before or alongside that:

- Whether to update `GridItem.mdx`'s own "Grid" `RelatedCard` to link to `Grid`'s new Docs page
  instead of its raw story (an edit to an already-Finalized component, needs authorization).
- What to do about the 2 pre-existing, out-of-scope `tsc` errors and the underlying tooling gap
  (`lint` not covering main-`src` typecheck) — see the section above.
