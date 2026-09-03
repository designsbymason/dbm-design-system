# Container — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-02. Implementation was already
sound — this is the component that originated the `Responsive<SpaceValue>` + `responsiveStyle()`
+ breakpoint-`@media` mechanism `Bleed` later copied, and its CSS module was already fully
token-driven, with the literal breakpoint pixel values in each `@media` condition already
documented as an accepted CSS-spec limitation (custom properties can't be referenced inside a
media condition), matching `Bleed`'s own precedent. No feature-completeness gap found against
Chakra's own `Container`. Findings were entirely documentation completeness and Storybook
coverage — no code-behavior bugs.

**Fixed:**
- **No real Playground existed — `as`, `paddingInline`, and `children` all showed broken "Set
  object" placeholder controls**, confirmed live; only `size` had `argTypes` wired at all. Added a
  live Playground (`as`/`size`/`paddingInline` all live; `paddingInline`'s control shows the
  single-value form only, matching `Bleed`'s own established solution for this exact
  `Responsive<SpaceValue>` shape — the responsive-map form keeps its own dedicated
  `ResponsivePadding` story instead). `children` stays `control: false` — Container's real content
  is always a styled demo block so the max-width/centering effect is actually visible, not
  representable as a plain string, same reasoning as `Affix`'s own `children` exclusion. The five
  pre-existing gallery stories (`Default`, `AllSizes`, `NarrowViewport`, `ResponsivePadding`,
  `AsMain`) all kept, given `argTypes: { control: false }` on whichever props aren't each story's
  own point (matching the same treatment already applied to `AspectRatio`/`Bleed`/`Center`'s own
  static references).
- **`id`/`className`/`style`/`data-testid` weren't explicitly redeclared with JSDoc** on
  `ContainerProps` — the same gap already fixed on `Box`/`Center`, adapted for the identical
  generic `<E extends ElementType>` polymorphic signature. This was the last of the three
  components flagged with this exact gap during earlier reviews — now closed on all three.
- **jest-axe only tested the default element** (`<Container><main>...</main></Container>`), never
  a non-default `as` on `Container` itself (e.g. `as="main"`, which the component already has a
  dedicated `AsMain` story for) — added both directions, matching the same fix already applied to
  `Box`.
- Docs page (`Container.mdx`) built to the full template — visually verified section by section in
  a running Storybook instance, both brands × both modes, mobile viewport. `RelatedCard` accents
  (`Bleed`, `Center`, `Box`) use `bg.canvas` from the start, matching the now-consistent convention
  across every other reviewed Layout atom.

Tests: 11 → 13 (added `id`/`data-testid` coverage, split the single a11y test into
default-element-and-non-default).

Self-verified: `tsc --noEmit`, `eslint`, full Vitest suite (850 tests package-wide), a real `tsup`
package build, and `check-component-bundle-size` (0.39KB JS / 0.27KB CSS gzipped — within budget).

**Final end-to-end pass, 2026-09-02.** Re-ran the full checklist against the current state (post
all fixes above): `tsc --noEmit`, `eslint`, full Vitest suite (850 tests package-wide), a real
`tsup` package build, and `check-component-bundle-size` (0.39KB JS / 0.27KB CSS gzipped — within
budget). No new findings.

**Finalized 2026-09-02** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Container (code, stories, docs, or its tokens) without asking first.
