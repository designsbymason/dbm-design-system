# Blockquote

**Tier:** Atom · **Category:** Typography · **Finalized:** ✅ 2026-09-06

## Review pass (2026-09-05)

Full `06-engineering-standards.md` §9 pass — first review for this component. Findings, in the
order fixed (Playground-missing first, Docs-page-missing last, per the standing reporting
convention):

1. **Playground story added.** `Blockquote.stories.tsx` previously had only two static stories
   (`Default`, `With attribution`); now has a full interactive `Playground` with every prop wired
   through `args`/`argTypes`.

2. **Real contrast defect, found and fixed: `.footer`'s attribution color.** Was
   `var(--dbm-text-tertiary)`. Computed live in the browser: **4.12–4.13:1 against `bg.canvas` in
   light mode, ~2.96:1 in dark** — below the 4.5:1 WCAG AA text floor, matching the exact failure
   already documented in `03-token-system-spec.md` ("Never place `text.tertiary` on `bg.canvas`,
   light or dark"). This wasn't a hypothetical for this component: Blockquote is an
   editorial/typography atom most naturally dropped directly into an article/blog page body — i.e.
   `bg.canvas`, not a card (`bg.surface`) — and Storybook's own preview backdrop is `bg.surface`,
   which is exactly why this was invisible in every prior live check. Unlike `Text`/`Heading`'s
   optional `color="tertiary"` (a consumer's own choice, out of scope here), this was Blockquote's
   own hardcoded internal default, so it's this component's responsibility to fix. **Fixed** by
   switching to `var(--dbm-text-secondary)` — re-verified live: 6.05:1 light / 5.10:1 dark against
   `bg.canvas`, both comfortably clearing AA.

3. **`className`/`style`/`id`/`data-testid` now explicitly redeclared** in `Blockquote.types.ts`
   with their own JSDoc (previously only worked structurally via the native
   `ComponentPropsWithoutRef<"blockquote">` extension, invisible to the Properties table per the
   confirmed Button/Box docgen gap).

4. **`cite`** (the single most Blockquote-specific native attribute — the quote's source URL) is
   now likewise explicitly redeclared with its own JSDoc, matching the native-prop-audit
   convention established on `Input`.

5. **`argTypes` added** to the stories file for every prop, with real descriptions and appropriate
   controls (`select` for `variant`, `text` for `attribution`/`cite`/`children`, `control: false`
   for the non-editable escape-hatch props).

6. **Unit tests extended**: added coverage for `style`/`id`/`data-testid` passthrough, the new
   `variant` prop, the decorative quote-mark's `aria-hidden` state, and a11y across all three
   render states (plain, with attribution, pull-quote). 11/11 passing (up from 8).

7. **Feature-completeness:** no dedicated Blockquote component exists in comparable production
   component libraries to compare against. The pre-existing default treatment already matched real-world precedent
   (GitHub/Notion/WordPress default blockquote rendering) — no functional gap there.

8. **Design enhancement, added at explicit direction: `variant="pull-quote"`.** A second visual
   treatment — larger (`font-size.2xl`), centered, no left border, with a decorative
   `aria-hidden` quote-mark glyph (`font-size.6xl`, `text.brand` — so it re-colors correctly across
   both brand themes) — for a standalone editorial callout, distinct from the default's
   inline-embedded treatment. Named precedent: common editorial-theme pull-quote
   patterns; no forcing comparable in any comparable production component library. Live-verified across both brands ×
   both modes (quote mark correctly resolves `purple.600`/`emerald.700` light,
   `purple.300`/`emerald.400` dark) and at mobile viewport width (wraps cleanly, no overflow).

9. **Docs page added** (`Blockquote.mdx`), full 10-section template, first in the sidebar group.
   Live-verified: TOC renders all 10 section headings, Properties table renders all 8 props in
   the declared order with non-empty descriptions, all 6 story canvases render real content, both
   `RelatedCard`s (`Text`, `Heading` — linked via their own `--default` story since neither has a
   Docs page yet, matching the established fallback pattern from `Input.mdx`) render live previews
   with correct links, zero console errors.

## Verification

`tsc --noEmit` (main + `.storybook`), `eslint`, full `vitest` unit suite (971/971 passing across
the whole package), `tsup` build, `check-foundations-token-coverage` (no new tokens — still in
sync), and `check-component-bundle-size` (0.39KB JS / 0.28KB CSS gzipped — trivial, nowhere near
budget) all run and passing. Live-verified in Storybook: both brand themes × both modes, mobile
viewport, Playground controls actually driving the canvas, Docs page rendering end to end.

## Follow-up (2026-09-06, at explicit direction)

Default variant's left accent border changed from `border.neutral` (generic gray) to `border.brand`
— pairs it with the same brand family already used by the pull-quote variant's decorative quote
mark (`text.brand`), so both variants now read as identifiably on-brand rather than the default one
being visually generic. Updated `border.neutral`'s own `$description` in all 4 semantic theme files
to drop Blockquote from its consumer list, and `border.brand`'s to add it — both cross-referencing
each other. Live-verified: resolves to the exact brand anchor (`#5548A4` purple.600 light) and the
correct value in all 4 brand/mode combinations (checked via computed style, not just visually).
`Blockquote.mdx`'s "Design tokens used" table updated to match. Re-ran the full verification suite
(971/971 tests, lint, typecheck, build, Foundations token-coverage) — all still passing.

## Finalized

**2026-09-06** — confirmed by the user after the full checklist (including the border-color
follow-up) was re-verified end to end: baseline correctness, feature-completeness, accessibility
(jest-axe zero violations across all three render states), responsiveness, design quality,
theming (all 4 brand/mode combinations, re-checked live after the follow-up), Storybook
documentation (Docs page, Properties table, Design Tokens table — all consistent, no stale
`border.neutral` references), and functional verification (`tsc`, `eslint`, full 971-test suite,
`tsup` build all clean). No further changes without asking first, per
`06-engineering-standards.md` §9's finalization rule.
