# Stack — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-03. Core layout mechanism
(`responsiveStyle()` + breakpoint-`@media` cascade, matching `Grid`'s identical pattern) was
already sound and fully token-driven — no `{...props}`-ordering bug (Stack computes no `role`/
`aria-*` attribute of its own to be overridden), no hardcoded values, SSR-safe. Findings were code
completeness, one real feature gap, and Storybook coverage — no rendering-behavior bugs in the
existing prop surface.

**Fixed:**
- **`id`/`className`/`style`/`data-testid` weren't explicitly redeclared with JSDoc** on
  `StackProps` — the same gap already fixed on `Box`/`Center`/`Container`, adapted for the
  identical generic `<E extends ElementType>` polymorphic signature. Functionally these already
  worked via the inherited `ComponentPropsWithoutRef<E>` spread; the gap was documentation
  visibility (JSDoc for the manifest generator, and Storybook's `react-docgen` not reliably
  surfacing inherited-only native props — `05-component-api-conventions.md` §3).
- **Feature-completeness gap against MUI's own `Stack`:** `StackDirection` only supported
  `row`/`column` — MUI's comparable `direction` prop also accepts `row-reverse`/`column-reverse`, a
  standard flexbox capability Stack's own CSS already passes straight through with zero additional
  logic (`flex-direction` accepts these values natively, and the JS-side mapping function was
  already a plain identity passthrough). Added both values to `StackDirection`, plus a dedicated
  gallery story and Docs-page variant demonstrating them.
- **jest-axe only tested the default element**, never a non-default `as` on `Stack` itself (e.g.
  `as="ul"`, which the component already has a dedicated `AsUnorderedList` story for) — added,
  matching the same fix already applied to `Box`/`Container`.
- **No Playground story existed** — added, first in the group, with `as`/`direction`/`gap`/`align`/
  `justify`/`wrap` all live; `divider`/`children` stay `control: false` (Stack's real content is
  always a set of styled demo swatches, not representable as a plain string, same reasoning as
  `Container`'s own `children` exclusion).
- **The "render ignoring its own args" bug class (confirmed pattern, originally found on `Avatar`)
  was present on every pre-existing gallery story** (`AllGapSteps`, `AlignAndJustify`, `Wrapping`,
  `ResponsiveDirection`, `ResponsiveEverything`, `AsUnorderedList`, `WithDivider`) — each used a bare
  `render: () => (...)` while the meta-level Controls panel (`as`/`direction`/`gap`/`align`/
  `justify`/`wrap`) stayed live and silently did nothing when toggled. Fixed per-story: `Row` and
  `AlignAndJustify` (single-instance, genuinely representable) converted to real args-driven
  stories; `AllGapSteps`/`Wrapping`(now also args-driven)/`ResponsiveDirection`/
  `ResponsiveEverything`/`AsUnorderedList`/`WithDivider` get an explicit `argTypes` disabling every
  meta-level controllable axis (matching `Container`'s own `AllSizes`/`ResponsivePadding`/`AsMain`
  precedent), so the Controls panel reads "–" instead of a misleading live-looking-but-broken
  control.
- **`WithDivider`'s story hand-rolled a raw styled `<div>`** to fake a vertical separator instead of
  using the system's own `Divider` component, even though Stack's own JSDoc says `divider` is
  "typically a `Divider`." Replaced with a real `<Divider orientation="vertical" />` — and caught a
  real instance of `Divider`'s own documented caveat in the process: a vertical divider's
  `height: 100%` doesn't resolve against a `direction="row"` `Stack` whose only other content is
  padding-driven `<span>`s (confirmed via a live `getBoundingClientRect()` check — it collapsed to
  1px tall). Fixed by giving the `Stack` an explicit `height` (`space.10`), matching the exact fix
  pattern already established in `Divider.stories.tsx`'s own `ResponsiveOrientation` story.
- Docs page (`Stack.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance (Playground live-control check, Properties table, both Do/Don't
  Callouts, Accessibility Callout, TokenRow, and all three RelatedCards — Grid, Divider, Box),
  across both brands and both light/dark modes, plus a mobile-viewport check on both the Docs page
  header and the `Wrapping` story. `RelatedCard`'s `Grid` link points at Grid's own story canvas
  (`?path=/story/...`), not a Docs path, since Grid doesn't have a Docs page yet — matching the
  same precedent already used elsewhere (e.g. `Icon` links before it had a Docs page).

Tests: 15 → 20 (added: row-reverse/column-reverse coverage, `id`/`data-testid` passthrough, a
non-default-`as` jest-axe pass).

Self-verified: `tsc --noEmit` (both the package and `.storybook`), `eslint --max-warnings 0`, full
Vitest suite (886 tests package-wide), a real `tsup` package build, and
`check-component-bundle-size` (0.58KB JS / 0.44KB CSS gzipped — within budget).

**Finalized 2026-09-03** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Stack (code, stories, docs, or its tokens) without asking first.
