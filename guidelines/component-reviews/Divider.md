# Divider — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-02. A notably more sophisticated
component than the other Layout atoms reviewed this session — a real SSR-safe `matchMedia` hook
(`useResolvedOrientation`) keeps `aria-orientation` correct across a responsive `orientation` map,
already well-tested (14 unit tests) before this pass. No feature-completeness gap found against
Chakra's own `Divider` (comparable shape); MUI's/Ant's own `Divider` both support label
alignment, which DBM's didn't — see the `align` addition below.

**Fixed:**
- **Confirmed accessibility bug — `{...props}` spread *after* the computed `role`/
  `aria-orientation` attributes.** Verified empirically, not just by reading the code: a
  consumer-passed `role`/`aria-orientation` silently overrode Divider's own computed values
  (`<Divider role="not-a-separator" aria-orientation="wrong-value" />` actually rendered
  `role="not-a-separator"`). The exact "confirmed recurring pattern" bug class already fixed on
  `Skeleton`/`ProgressBar`/`Button`/`Checkbox`/`Affix`/`FieldError` (`05-component-api-
  conventions.md` §3) — Divider is a new confirmed instance. Fixed by reordering the spread before
  the computed attributes; added a regression test (deliberately-invalid values passed via a
  spread object cast through `unknown`, not literal JSX attributes, so the intentional bad input
  doesn't trip static TS/jsx-a11y checks that only scan literal values).
- No Playground story existed — all 7 stories used hardcoded `render: () => (...)` with zero
  `argTypes`. Added a live Playground (`orientation`/`variant`/`label`/`align`/`aria-label` all
  live; `orientation`'s control shows the single-value form, matching `Bleed`'s/`Container`'s own
  established solution for a `Responsive<T>` prop — the responsive-map form keeps its own
  dedicated `ResponsiveOrientation` story).
- `id`/`className`/`style`/`data-testid` weren't explicitly redeclared with JSDoc on
  `DividerProps` (simpler fix than `Box`/`Center`/`Container`'s — Divider isn't polymorphic).
- Docs page (`Divider.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance, both brands × both modes, mobile viewport. Caught and fixed a real
  MDX gotcha along the way: a backslash-escaped quote inside a `Callout`'s `title` attribute
  (`title="role=\"separator\"..."`) — MDX's JSX-in-Markdown parser doesn't support that escape
  sequence (same class of bug documented in `07-storybook-and-documentation-standards.md` §4.1,
  found originally via Avatar); fixed by switching to single quotes for the inner text instead.
  `RelatedCard` accents (`Stack`, `Container`, `Box`) use `bg.canvas` from the start.
- **Possible accessible-name gap for a labeled divider — resolved by adding an `aria-label`
  fallback.** Checked live with axe-core directly: no violation (no ARIA-required-name rule
  applies to `separator`), so this was never a confirmed bug, just a real, worthwhile defensive
  improvement given how AT-implementation-dependent a `role="separator"`'s content-reading
  behavior is. When `label` is a plain string and no explicit `aria-label` is given, it's now used
  automatically as the accessible name; an explicit `aria-label` always wins, and a non-string
  `label` (e.g. an icon) gets no automatic fallback (can't derive a string from arbitrary content).
- **Added `align` (`'start' | 'center' | 'end'`, default `'center'`) — the named gap against MUI's/
  Ant's own `Divider`.** Implemented via a `.lineShort` CSS modifier (`flex: 0 0
  var(--dbm-space-6)`) applied to whichever line segment sits on the short side, overriding the
  default `flex: 1 1 auto` both segments otherwise share equally — works unchanged for both
  orientations, same reasoning as `.line`'s own orientation-agnostic `flex` rule. Live-verified:
  `align="start"`/`"center"`/`"end"` all render correctly, confirmed via a real `Playground`
  control toggle. Only takes effect when `label` is set (a dedicated test confirms `align` is
  inert without one).
- Incidental fix, found live while verifying the Docs page (not one of the six approved findings,
  but free and clearly a pre-existing defect): the `Vertical` story's demo wrapper was missing a
  `gap`, so "Left"/"Right" rendered touching with no visible space — the divider line itself was
  always rendering correctly (confirmed via `getBoundingClientRect`, a real 64px-tall, 1px-wide
  line — just hard to see in a screenshot without breathing room around it). Added
  `gap: var(--dbm-space-3)` to match every other story's own wrapper.

Tests: 14 → 26 (the ordering regression test, `id`/`data-testid`, four `aria-label` fallback
cases, three `align` cases, and split the single a11y test into three: no label, with label, and
vertical-with-label).

Self-verified: `tsc --noEmit`, `eslint`, full Vitest suite (862 tests package-wide), a real `tsup`
package build, and `check-component-bundle-size` (0.94KB JS / 0.50KB CSS gzipped — within budget,
the increase from the `align`/`aria-label` logic and the extra `.lineShort` CSS rule).

**Follow-up fix (same day, requested after the pass above):** the native Storybook Controls panel
showed an inert "Set string" placeholder for `aria-label` instead of a live input, and the panel's
row order read oddly (`aria-label` sat after the `id`/`className`/`style` escape-hatch cluster
instead of near `label`/`align`). Root causes, per the established
`07-storybook-and-documentation-standards.md` §4.1/§5 conventions:
- `meta.args` in `Divider.stories.tsx` never gave `"aria-label"` an explicit value — an `undefined`
  arg always renders as an inert placeholder regardless of its `argTypes` control declaration.
- The *native* Controls panel's row order is driven by `DividerProps`' own field declaration order
  in `Divider.types.ts`, not by `argTypes` object order or the MDX `propOrder` array (those only
  govern the custom `PropertiesTable`/`PlaygroundControls` blocks) — `"aria-label"` was declared in
  the escape-hatch cluster (after `style`) instead of beside `label`/`align`, where it belongs
  conceptually (it's the accessible-name override tied to the label, not a generic escape hatch).

Fixed by moving the `"aria-label"` field to right after `align` in `Divider.types.ts` (and
reordering `argTypes` in `Divider.stories.tsx` and `propOrder` in `Divider.mdx` to match for
consistency), and giving it an explicit `"aria-label": ""` default in `meta.args`.

That default surfaced a second, real bug while wiring it up: `Divider.tsx`'s own fallback logic
used `??` (`ariaLabel ?? (typeof label === "string" ? label : undefined)`), which only falls
through on `null`/`undefined` — an explicit empty string would have been treated as "set" and
silently suppressed the label-derived fallback (rendering `aria-label=""` instead of `aria-label="OR"`
in the Playground's own default state). Fixed by switching to `||`, matching `Avatar`'s own
established precedent for the identical explicit-override-vs-computed-fallback shape
(`combinedLabel = ariaLabelProp || computedLabel`). Added a regression test
("treats an empty-string aria-label as unset, still falling back to the label"). Tests: 26 → 27.

Re-verified: `tsc --noEmit`, `eslint`, full Vitest suite (863 tests package-wide, unit project),
`check-component-bundle-size` (unchanged). Storybook dev server restarted (required for a
type-declaration-order change to take effect in docgen, per `07-storybook-and-documentation-standards.md`
§4.1) and visually re-verified live: `aria-label` now shows a real, editable text input (confirmed
by typing into it and reading the rendered `aria-label` attribute back from the DOM) in both the
native Controls panel and the Docs-page-embedded `PlaygroundControls`, and the row order in both
now reads `orientation, variant, label, align, aria-label, id, className, style, data-testid`.

**Second follow-up fix (same day, user-reported live in the Playground story):**
- **Vertical orientation appeared to render nothing.** Root cause was the `Playground` story's own
  demo wrapper, not the component: it had no explicit height, and per `Divider`'s own documented
  constraint ("a vertical divider needs an explicit height from its parent — it doesn't invent one
  on its own"), `height: 100%` on the divider resolved to `0` inside an auto-height ancestor. The
  `Vertical`/`VerticalWithLabel` gallery stories already gave their wrappers an explicit height and
  were never affected — this was specific to `Playground`, which needs to support *both*
  orientations from one live control. Fixed by switching `Playground`'s `render` to pick between two
  wrappers based on `args.orientation` — the existing horizontal layout, or a `display: flex` row
  with an explicit `height: var(--dbm-space-24)` (matching the `VerticalWithLabel` story's own
  established height) when `orientation === "vertical"`.
- **Clearing the `label` control left a visible gap with no label text.** A genuine component bug,
  not just a story artifact: `hasLabel` was computed as `label != null`, and an empty string is
  `!= null`, so it still rendered three flex children (line, an empty label `<span>`, line) with
  `gap` applied around the invisible middle one. Fixed by broadening the check to
  `label != null && label !== "" && typeof label !== "boolean"` — the boolean exclusion additionally
  guards the common `label={condition && "OR"}` conditional-render pattern, where React itself
  renders nothing for `false` but the old check would still have counted it as "has a label."
  `resolvedAriaLabel`'s own string-label fallback was narrowed the same way (an empty string no
  longer produces `aria-label=""`). Added three regression tests: empty-string label (single line,
  no `aria-label`), boolean-`false` label (single line), and the no-`aria-label`-for-empty-label
  case explicitly. Tests: 27 → 30. Bundle size unaffected (checked — no change from adding two
  boolean/string checks to an existing conditional).

Re-verified after both fixes: `tsc --noEmit`, `eslint`, full Vitest suite (866 tests package-wide,
unit project). Visually re-verified live in Storybook: toggling `orientation` to `vertical` in the
Playground now shows a real 96px-tall line (confirmed via `getBoundingClientRect`/computed style,
not just a screenshot); clearing `label` now collapses to a single continuous line with no gap and
no `aria-label` attribute (confirmed via direct DOM inspection of the rendered `role="separator"`
element, both before and after).

**Third follow-up (same day, user-requested addition):** added a `"dotted"` `variant`, alongside
the existing `"solid"`/`"dashed"` pair — user asked what other variants were worth adding after a
brief survey of comparable libraries (Chakra/Ant ship only solid/dashed; MUI's extra `variant`
values are inset-margin options, not line styles, and were judged out of scope). `dotted` mirrors
`dashed`'s existing implementation exactly (`.lineDottedHorizontal`/`.lineDottedVertical` CSS
classes, `border-block-end`/`border-inline-end` with `dotted` in place of `dashed`, orientation
picked the same way in `Divider.tsx`'s `lineClassName` ternary) — no new token needed, since line
style itself was never tokenized (matches `dashed`'s own precedent). Added a `Dotted` gallery story
(mirrors `Dashed`), a `dotted` option on the `variant` `argType`, a regression test
("applies dotted line style", mirrors the existing dashed test), a "Dotted" section on the Docs
page (right after "Dashed"), and a "Best practices" note contrasting `dashed` (still reads
structural) vs. `dotted` (more casual). Tests: 30 → 31.

Self-verified: `tsc --noEmit`, `eslint`, full Vitest suite (867 tests package-wide, unit project),
`check-component-bundle-size` (0.94→0.99KB JS, 0.50→0.52KB CSS gzipped — still within budget).
Visually verified live: confirmed `border-bottom-style: dotted` via direct computed-style
inspection (not just a screenshot) in the new `Dotted` story, the `Playground`'s own `variant`
control, and the Docs page's new section — across `purple-dark` and `emerald-light` explicitly
(caught and ruled out a red herring along the way: an earlier malformed test URL had set
`brand=orange`, a nonexistent theme, which correctly produced empty/unstyled CSS custom
properties — not a real bug, just invalid test input).

**Fourth follow-up (same day, user-requested addition):** added a `"double"` `variant` (two
parallel lines) with two new supporting props, `thickness` and `emphasis` — the user asked for
three named variants ("2 parallel lines, equal weight" / "thicker upper line" / "thicker lower
line"). Before implementing, flagged a genuine public-API naming decision rather than guessing:
baking "thick-top"/"thick-bottom" directly into `variant` string values wouldn't generalize to a
vertical divider (whose two lines run side-by-side, not stacked) and would hardcode a fixed weight
into the variant name. Asked the user; their reply raised an even better question — whether
`thickness` should be a general prop (Divider's line weight was otherwise hardcoded to 1px) rather
than baked only into the double variant's naming — which reframed the whole design:
- `variant` gained exactly one new value, `"double"`, instead of three.
- New `thickness?: "thin" | "regular" | "thick"` (default `'thin'`) — maps to
  `border.width.1`/`border.width.2`/`border.width.4` (all pre-existing tokens, no token-layer work
  needed) — sets the baseline stroke weight for *every* variant, not just `double`. `solid` sets it
  via `height`/`width` (mirrors `.line`'s existing "set both, flex-grow owns whichever is the main
  axis" trick); `dashed`/`dotted` set it via the one logical `border-block-end-width`/
  `border-inline-end-width` property their own CSS class already scopes a border to (both are valid
  typed `CSSProperties` keys — confirmed against the installed `csstype` version before relying on
  them). No CSS module changes were needed for the existing `.line`/`.lineDashed*`/`.lineDotted*`
  rules — inline style always wins over the stylesheet's own hardcoded fallback value.
- New `emphasis?: "none" | "start" | "end"` (default `'none'`) — logical, RTL-aware, matching
  `align`'s own `start`/`end` convention (resolves the vertical-orientation naming problem the
  physical top/bottom wording couldn't). Only meaningful when `variant="double"`. The emphasized
  line steps *up* one level from `thickness` (capped at `'thick'`, since no heavier token exists);
  the other line stays at the `thickness` baseline.
- **Caught and fixed a real bug via the tests, not just code review:** the first implementation had
  the step direction backwards — the *non-emphasized* line stepped down from `thickness` instead of
  the *emphasized* line stepping up. That meant at the default `thickness="thin"`, `emphasis` would
  have had zero visible effect (nothing to step down from — a broken default demo experience). Three
  tests failed against the intended behavior (which the prop's own JSDoc already correctly
  described, written before the bug), which is what surfaced the mismatch; fixed by flipping the
  direction (`THICKNESS_STEP_UP`, capped at `'thick'`, replacing `THICKNESS_STEP_DOWN`, floored at
  `'thin'`) and correcting the JSDoc/tests to match. The degenerate edge case moved to the *top* of
  the scale instead (`thickness="thick"` + `emphasis` set → both lines render at `'thick'`, capped)
  — a materially better default since a consumer reaching for `"thick"` already gets the boldest
  available result, versus the original bug where the *default* settings silently ate the feature.
- DOM structure for `double`: each line "segment" (there are two when `label` is set, one
  otherwise — same as every other variant) becomes a `<span>` group containing two bar `<span>`s
  with a `space.1` gap between them, instead of a single line span. The group picks its own
  internal `flex-direction` opposite to the divider's own main axis (new `.doubleGroupHorizontal`/
  `.doubleGroupVertical`/`.doubleBarHorizontal`/`.doubleBarVertical` CSS classes, same
  orientation-branching pattern already used for `dashed`/`dotted`), and reuses `.lineShort`
  unchanged for the `align="start"`/`"end"` short-segment behavior (verified via a dedicated test —
  CSS source order already put `.lineShort` after the new rules, so the existing specificity-tie
  behavior needed no changes).
- Added 3 new gallery stories (`Double`, `DoubleEmphasisStart`, `DoubleEmphasisEnd`), a `Docs` page
  section for each, `thickness`/`emphasis` `argTypes` (with `control: false` added to all 9
  pre-existing static gallery stories for consistency, matching how `align` was handled), 3 new
  `TokenRow`s (`border.width.2`, `border.width.4`, `space.1`), a `Best practices` bullet, and a code
  example. Tests: 31 → 42 (double-bar structure, equal-weight default, `emphasis="start"`/`"end"`,
  thickness+emphasis scaling together, the `thick` cap, vertical orientation using `width` instead
  of `height`, `thickness` on solid/dashed/dotted via both CSS properties, and the `align`+`double`
  interaction).

Self-verified: `tsc --noEmit`, `eslint`, full Vitest suite (878 tests package-wide, unit project),
`check-component-bundle-size` (0.99→1.25KB JS, 0.52→0.56KB CSS gzipped — still within budget, the
expected cost of a real new DOM branch plus two props). Visually verified live in Storybook —
confirmed via direct DOM/computed-style inspection (not just screenshots) that: the equal-weight
`Double` story renders two identical bars; `emphasis="start"`/`"end"` correctly make one bar
heavier via the Playground's live controls; `thickness`+`emphasis` scale together (`regular`→
`thick` step observed live); vertical orientation correctly uses `width` instead of `height` on
each bar; and the pairing renders correctly under `purple-dark` (right color, right weights). Docs
page's `PropertiesTable`/`PlaygroundControls` row order confirmed via direct DOM inspection to read
`orientation, variant, thickness, emphasis, label, align, aria-label, id, className, style,
data-testid`, matching `Divider.types.ts`'s own field order.

**Declined (same day):** a `patternGap`-style prop to control dash/dot spacing on the `dashed`/
`dotted` variants was proposed and declined. Native `border-style: dashed`/`dotted` has no property
for dash-length/gap control at all — the only way to get it is to replace the border-based
rendering with a `background-image` technique (`repeating-linear-gradient` for dashes, a tiled
`radial-gradient` for dots). That technique has a real accessibility cost: browsers typically
suppress `background-image` under `forced-colors: active` (Windows High Contrast Mode) unless
`forced-color-adjust: none` is set and compensated for, whereas `border-style`/`border-color` is
preserved and rendered with system colors in that mode — and background colors are also commonly
stripped in print output by default. Shipping it responsibly would need a `@media
(forced-colors: active)` fallback reverting to plain `border-style` (accepting no gap control
there rather than a silently vanishing divider). Weighed against how niche "custom dash spacing" is
as a request, the user agreed it wasn't worth the added complexity and a second rendering code path
to verify — skipped, not implemented.

**Fifth follow-up (same day, user-requested addition):** added a `tone` prop — the user asked how
to control the divider's color, and there was no working answer: every variant hardcoded its color
to `border.default` in the CSS module, and neither `style` (applied to the root `<div>`, a bare
flex container — the visible color lives on the inner `<span>`(s), which don't inherit
`background`) nor `className` (a fragile specificity/load-order fight against the library's own
compiled CSS) actually worked as an override path.
- Named `tone`, not `color` — matching this codebase's own established, repeated convention for
  "semantic feedback coloring, kept separate from visual `variant`" (`Badge`/`Tag`/`ProgressBar`/
  `ProgressCircle` all use `tone`), confirmed by checking those types files directly rather than
  assuming; the user's own wording ("the color prop") was them echoing back a proposal, not
  dictating the literal identifier, so the established convention took precedence.
- `DividerTone = "default" | "brand" | "info" | "success" | "warning" | "danger"` — a constrained
  pick from the existing semantic `border.*` token family (17 tokens exist; trimmed to the 6
  meaningful as a whole-divider color, skipping `neutral-subtle`/`neutral`/`neutral-strong`/
  `strong`/`*-subtle`/`focus`/`code` as either redundant with `default`, scoped to another
  component's own semantics, or not meaningful here) — matches "semantic over primitive"
  (`CLAUDE.md`). `default` maps to `border.default` specifically (Divider's own original resting
  token, gray.200) rather than the generic `border.neutral` (gray.400) Badge/Tag use for their own
  "neutral" tone — picked deliberately so adding this prop doesn't shift any existing usage's
  appearance. All 6 tokens were already contrast-verified against `bg.surface` at ≥3:1 (WCAG
  1.4.11) as part of their original addition — confirmed by reading the token source directly
  rather than re-deriving, no new verification needed.
- Implementation mirrors `thickness`'s own mechanism exactly: `solid` and `double`'s bars override
  `backgroundColor`; `dashed`/`dotted` override the one logical `border-block-end-color`/
  `border-inline-end-color` property their own CSS class already scopes a border to (leaving
  `style` — dashed vs dotted — untouched in the CSS class). No CSS module changes needed at all;
  inline style always wins over the stylesheet's own hardcoded fallback.
- Added a `Tones` gallery story (six labeled dividers, one per tone) and Docs section, `tone`
  `argType`, `control: false` added to all 12 pre-existing static gallery stories for consistency, a
  `Best practices` bullet (reserve non-`default` tones for genuine semantic signal, not decoration),
  a code example, and 6 new `TokenRow`s. Tests: 42 → 46 (default tone, an explicit tone on `solid`,
  `dashed` via `border-block-end-color`, and both `double` bars).

Self-verified: `tsc --noEmit`, `eslint`, full Vitest suite (882 tests package-wide, unit project),
`check-component-bundle-size` (1.25→1.35KB JS, CSS unchanged — `tone` is purely inline-style-driven,
no new CSS rules). Visually verified live in Storybook: all 6 tones render distinctly and correctly
via direct DOM/computed-style inspection (not just screenshots) in the `Tones` story, the
Playground's live `tone` control, a `dashed`+`tone` combination (confirmed `border-style` stays
`dashed` while only the color changes), and legibility checked visually under `emerald-dark`. Docs
page's `PropertiesTable`/`PlaygroundControls` row order confirmed to read `orientation, variant,
thickness, emphasis, tone, label, align, aria-label, id, className, style, data-testid`.

**Sixth follow-up (same day, user-reported live in the `ResponsiveOrientation` story):** the
vertical divider (`lg` and up) was effectively invisible — only the "OR" label showed, no line.
Confirmed via direct computed-style inspection (not just a screenshot, which was too small/scaled
to judge reliably at the viewport width needed to trigger `lg`): each line segment rendered at
**1px tall** — the root `<div>`'s own `height: 100%` (set when `orientation` resolves to
`"vertical"`) wasn't resolving against the Stack ancestor's height at all, so the root fell back to
its own auto/content height (~42px, almost entirely just the label's own line-height), leaving the
flex-grow line segments essentially nothing to grow into.

Root cause: the story's `Stack` wrapper set `minHeight: var(--dbm-space-24)`, not `height`. Per CSS
spec, `min-height` doesn't establish a definite height for a percentage-height *child* the way
`height` does — so `Divider`'s own `height: 100%` silently computed to `auto` instead of resolving
to the Stack's rendered 96px. This is the same underlying "a vertical divider needs an explicit
height from its parent" constraint already documented and already fixed once this session (the
`Playground` story's own bug, `Divider.md`'s second follow-up above) — just triggered through a
different CSS property this time. The already-working `Vertical`/`VerticalWithLabel` stories were
never affected, since both already use a real `height`, not `minHeight`.

Fixed by switching `ResponsiveOrientation`'s wrapper from `minHeight` to `height`
(`Divider.stories.tsx`) — verified content still fits without clipping at the `base`/mobile column
layout (it did before the fix too, `minHeight` was already just adding empty space beneath, not
actively constraining anything). Also extended the Docs page's existing "Don't" bullet about
explicit height to call out this exact `min-height`-isn't-enough nuance directly, since it's a
genuinely non-obvious CSS distinction and this is precisely the mistake that produced the bug.

Re-verified: `tsc --noEmit`, `eslint`, full Vitest suite (882 tests package-wide, unit project) —
no test changes needed (story-only fix, no component behavior changed). Visually re-verified live:
widened the Storybook preview to a real `≥1024px` viewport (the pane's own width is normally
narrower than `lg`, which is what let this ship unnoticed — confirmed via `matchMedia` inside the
preview iframe before and after), then confirmed via direct computed-style inspection that each
line segment now renders at a real 28px (up from 1px) and the root fills the full 96px Stack
height, with `aria-orientation` correctly reporting `"vertical"`.

**Final review pass (same day, before finalizing):** re-read every file fresh (`Divider.tsx`,
`.types.ts`, `.module.css`, `.stories.tsx`, `.test.tsx`, `.mdx`, `useResolvedOrientation.ts`,
`index.ts`) rather than trusting the incremental follow-ups above to have left everything
consistent.

**Fixed:** `index.ts` only re-exported `DividerOrientation`, `DividerProps`, `DividerVariant` —
`DividerAlign`, `DividerThickness`, `DividerEmphasis`, and `DividerTone` (added across the six
follow-ups above) were never wired into the barrel file, so none of them were actually reachable
from `@dbm-design-system/components`'s public API despite being real, referenced, JSDoc'd prop
types — confirmed by grepping the built `dist/index.d.ts` before the fix and finding them absent
from the package root's own type exports. Fixed by adding all four; re-verified via a real `tsup`
build that all seven `Divider*` types now appear in the generated `dist/index.d.ts`.

**Checked, no defect found:**
- The CSS module's hardcoded fallback values on `.line`/`.lineDashed*`/`.lineDotted*`/
  `.doubleBar*` (e.g. `background: var(--dbm-border-default)`) are now fully unreachable — inline
  style always sets a real value (from `thickness`/`tone`, both always-computed with real
  defaults). Left as-is deliberately: the values are identical to the component's own real
  defaults, so this reads as a reasonable "degrades to the correct default appearance" safety net
  rather than misleading dead code — not worth removing.
- All prop-order consistency (`DividerProps` field order, `Divider.stories.tsx` `argTypes` object
  order, `Divider.mdx`'s `propOrder` array) cross-checked directly against each other — all three
  read `orientation, variant, thickness, emphasis, tone, label, align, aria-label, id, className,
  style, data-testid`.
- Gallery-story `control: false` override count verified exactly (91 = 13 static stories × 7
  overridden props, plus 4 meta-level escape-hatch overrides = 95 total `control: false`
  occurrences in the file).
- A combined live state exercising five props at once (`variant="double"`, `thickness="regular"`,
  `emphasis="start"`, `tone="danger"`, `align="start"`) verified via direct DOM inspection — every
  prop composed correctly with no interaction bugs (start bar correctly stepped up to `thick`,
  both bars correctly `danger`-colored, leading segment correctly shortened). Zero axe violations
  on this combined state via a live `axe.run()` in the browser (not just jest-axe/jsdom).
- Mobile viewport (375px): Docs page confirmed with zero horizontal overflow.
- Re-checked `emerald-dark` (a brand/mode combination not previously exercised for the `Playground`
  story specifically) — renders correctly.
- `NarrowViewport` story (untouched by any follow-up) re-checked live — unaffected, still correct.

Self-verified: `tsc --noEmit`, `eslint`, full Vitest suite (882 tests package-wide, unit project —
unchanged, this pass added no new test since the only fix was a type-only export), a real `tsup`
package build (confirmed the four newly-exported types appear in `dist/index.d.ts`), and
`check-component-bundle-size` (1.35KB JS / 0.56KB CSS — unchanged, a type-only export has zero
runtime cost).

**Finalized 2026-09-03.**
