# Bleed — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-02. Implementation was already
correct (token-driven `calc()` negative-margin pattern, `forwardRef` correct, no ARIA needed —
purely structural, matching `Box`'s own precedent). Findings were documentation completeness,
Storybook coverage, and one real, concrete feature gap.

**Fixed:**
- **`inset` didn't support `Responsive<SpaceValue>` the way `Container`'s own `paddingInline`
  does** — a real, concrete gap named against a comparable sibling, not speculative: `Bleed`'s own
  JSDoc describes counteracting `Container`'s padding as its primary use case, but `Container`'s
  `paddingInline` accepts a mobile-first responsive map while `Bleed`'s `inset` was a single fixed
  value, so there was no way to correctly counteract a responsive padding at every breakpoint.
  Widened `inset` to `Responsive<SpaceValue>` and gave `Bleed` a CSS module for the first time (it
  previously had none, by explicit documented design) using the exact `responsiveStyle()` +
  breakpoint-`@media` mechanism already shared by `Container`/`Stack`/`Grid`/`GridItem` — one
  shared `--bleed-margin` custom property resolved per breakpoint on `.root`, applied via three
  `side`-driven variant classes (`.sideInline`/`.sideBlock`/`.sideAll`) using margin longhands
  (kept longhand, not shorthand, matching the component's pre-existing jsdom-calc()-parsing
  rationale). Live-verified pixel-perfect alignment against a real `Container` at both sides of
  the `lg` breakpoint (computed `marginInlineStart`/`End` correctly switched `-16px` → `-32px`,
  0px/1px offset from the border in both cases — the 1px being the border's own width, not a
  miscalculation).
- No Playground story existed — added, with `inset`/`side`/`children` all live (`inset`'s control
  shows the single-value form only; the responsive-map form isn't representable as a single
  Storybook control, so it gets its own dedicated `ResponsiveInset` story instead, matching
  `Affix`'s `offset` precedent).
- Missing variant coverage — only `side="inline"` (the default) had a story. Added `Block`
  (`side="block"`) and `All` (`side="all"`) as static references, plus the `ResponsiveInset` story
  above.
- `children` had no JSDoc description — added.
- `id`/`className`/`style`/`data-testid` weren't explicitly redeclared with JSDoc on `BleedProps`
  — added, matching `Skeleton`'s established pattern.
- No JSDoc note on `style`'s override precedence — added; simpler than `AspectRatio`'s own
  equivalent note, since margins now come from a CSS-module class rather than an inline
  object-spread, so a caller's own inline `style` wins via ordinary CSS cascade (inline beats
  stylesheet), no special merge logic involved.
- Demo image was a hardcoded purple SVG data-URI — replaced with a `bg.track`-colored `<div>`,
  matching the fix just applied to `AspectRatio`'s own stories for the same reason (theme-reactive,
  not baked into a static asset).
- Docs page (`Bleed.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance, both brands × both modes, mobile viewport. One cosmetic nit caught
  and fixed along the way: the `Container` `RelatedCard` preview's inner accent (`bg.brand-subtle`,
  a full-width `height: 20` bar) was technically rendering correctly (confirmed via computed
  style — real position/color) but was nearly imperceptible in that shape at that tint; changed to
  a small square matching `Box`'s/`Stack`'s own card sizing convention. Not a functional bug —
  `Box.mdx` has the identical full-width-bar pattern already, unflagged, since it predates any
  rigorous review pass.

Tests: 8 → 12, covering the responsive custom-property setting (single value and per-breakpoint
map, mirroring `Container.test.tsx`'s own adapted pattern for a CSS-module-driven prop), all three
`side` classes, `style`/`className`/`id`/`data-testid`, and the override-precedence behavior.

Self-verified: `tsc --noEmit`, `eslint`, full Vitest suite (844 tests package-wide), a real `tsup`
package build, and `check-component-bundle-size` (0.32KB JS / 0.23KB CSS gzipped — within budget).

**Follow-up (2026-09-02, same day):** at explicit direction, swapped the demo-shape fill across all
four stories and every `RelatedCard` accent in `Bleed.mdx` (Container/Stack/Box previews) from
`bg.track`/`bg.brand-subtle` to `bg.canvas` — a better semantic fit for a Storybook-demo-only
fill (the token's own description already names it "the live-preview/demo container surface"),
and confirmed via `.storybook/theme.ts` that it's visually distinct from Storybook's own chrome
(`appBg`/`appContentBg` use `bg.neutral-subtle`/`bg.surface`, not `bg.canvas`), so it doesn't blend
into the page. Re-verified live: clearly visible in both light and dark mode.

**Final end-to-end pass, 2026-09-02.** Re-ran the full checklist against the current state (post
all fixes above, including the `bg.canvas` follow-up): `tsc --noEmit`, `eslint`, full Vitest suite
(844 tests package-wide), a real `tsup` package build, and `check-component-bundle-size` (0.32KB
JS / 0.23KB CSS gzipped — within budget). No new findings.

**Finalized 2026-09-02** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Bleed (code, stories, docs, or its tokens) without asking first.
