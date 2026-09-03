# Center — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-02. Implementation was already sound
(correct flex-centering CSS module, `forwardRef` correct via the standard `Box`-shared polymorphic
workaround, no unnecessary opinions). No feature-completeness gap found against Chakra's own
`Center` (same "flex align/justify center" pattern). Findings were entirely documentation
completeness and Storybook coverage.

**Fixed:**
- No Playground story existed — `Default`/`Inline` both used a hardcoded `render: () => (...)`
  with zero `argTypes`. Added a live, args-driven Playground (`as`/`inline`/`children` all live —
  `inline` genuinely toggles `display: inline-flex`, confirmed live) and gave the two pre-existing
  static-reference stories explicit `control: false` on all three props, matching the established
  pattern for a story demonstrating one deliberately-chosen combination.
- `id`/`className`/`style`/`data-testid` weren't explicitly redeclared with JSDoc on `CenterProps`
  — the same gap just fixed on `Box`, adapted for the identical generic `<E extends ElementType>`
  polymorphic signature. (`Container` has this too, still out of scope until its own review.)
- jest-axe only covered the default element, never a non-default `as` — added both directions
  (inverse of the gap just found and fixed on `Box`).
- Docs page (`Center.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance, both brands × both modes, mobile viewport. `RelatedCard` accents
  (`Stack`, `Container`, `Box`) built with `bg.canvas` from the start, at explicit direction,
  matching `AspectRatio`/`Bleed`/`Box`'s own now-consistent convention — no follow-up fix needed
  this time.

Tests: 7 → 9 (added `id`/`data-testid` coverage, split the single a11y test into
default-element-and-non-default).

Self-verified: `tsc --noEmit`, `eslint`, full Vitest suite (848 tests package-wide), a real `tsup`
package build, and `check-component-bundle-size` (0.23KB JS / 0.09KB CSS gzipped — within budget).

**Final end-to-end pass, 2026-09-02.** Re-ran the full checklist against the current state (post
all fixes above): `tsc --noEmit`, `eslint`, full Vitest suite (848 tests package-wide), a real
`tsup` package build, and `check-component-bundle-size` (0.23KB JS / 0.09KB CSS gzipped — within
budget). No new findings.

**Finalized 2026-09-02** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Center (code, stories, docs, or its tokens) without asking first.
