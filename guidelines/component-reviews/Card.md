# Card — Storybook/component review findings

**Data Display:** Card — built 2026-09-19, item 11 in the itemized molecule-tier build order
(`04-component-inventory.md`). Adds no new dependency and no new token — every value already had a home on an
existing scale. **Not yet Finalized** — only the user declares that; see the status row in
`07-storybook-and-documentation-standards.md` §6.

A compound component of native elements: `Card` (root) with `Card.Media`, `Card.Header`, `Card.Body`, and
`Card.Footer`. Each sub-part's own props get a `### Card.{Part} properties` subsection on the Docs page via a hidden,
docs-only stories file per
[ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md).

## Decisions made with the user before building

Asked rather than guessed, since the guidelines only said "header/body/footer slots":

- **Sub-parts: `Media`, `Header`, `Body`, `Footer`** — `Media` is the fourth because a full-bleed image or video is
  the one thing a padded section can't express.
- **Variants: `outlined` (default), `elevated`, `filled`, `ghost`, plus a `tone` accent** (`brand`, `neutral`, `info`,
  `success`, `warning`, `danger`, default `neutral`) — the same tone set `Table` already uses.
- **Interactivity: `interactive` + `asChild`.** A clickable card is a link or a button *the consumer supplies*, per
  [ADR-0007](../adr/0007-as-vs-aschild-by-content-source.md) (content comes from the
  caller, so `asChild`, not `as`).
- **Density: `size`** on the shared `xs`–`xl` scale, driving section padding.

## Design decisions made during the build

- **The card has no padding of its own; each section pads itself.** That is what lets `Card.Media` run edge to edge
  with no negative-margin trick. `size` sets one custom property (`--card-pad`) on the root, which every section reads —
  so **no React context is needed**, and a card nested inside another card's body reads its own `size`/`tone`.
- **Spacing between sections is one padding unit, not two.** A section that follows another drops its own top padding
  (`.header + .body`, `.body + .footer`, …). Media has no padding, so whatever follows it keeps its top padding.
- **`variant` and interactive states are driven by custom properties** (`--card-bg[-hover|-active]`,
  `--card-border[-hover]`, `--card-shadow[-hover|-active]`); each variant only *sets values*. `outlined` is the base
  and has no class of its own.
- **`elevated` uses the shadow primitives**, swapped per theme (`--dbm-shadow-light-*` / `--dbm-shadow-dark-*`) — shadows
  aren't a reactive semantic token. In dark mode a `border.default` hairline returns, because a shadow alone barely
  reads on a dark surface. Verified live: the dark card carries the dark shadow and an `rgb(67,64,79)` border.
- **`tone` is a subtle tint on the header plus a tone-coloured border** (`bg.<tone>-subtle` + `border.<tone>`), not a
  solid fill. A solid fill would put body text and sub-part content on a saturated surface; the tint keeps everything
  on `text.primary`. A `ghost` card stays borderless when toned — the tone then only tints its header.
- **A toned header re-adds top padding to whatever follows it.** The "drop the top padding after a section" rule
  above leaves body text touching a *tinted* header's bottom edge, so `.toned > .header + .body/.footer` restore one
  padding unit. Found live in the Tones story; verified afterwards at exactly one `--card-pad` (24px at `md`).
  Consequence: in a side-by-side gallery a toned card is one padding unit taller than an un-toned one.
- **`interactive` is styling only** — cursor, hover/active surface, focus ring. The semantics come from the slotted
  element. `interactive` without `asChild` and without an explicit `role` warns once in development (the card would
  look clickable but expose nothing to a keyboard or screen reader); the warning runs in `useEffect`, since the React
  Compiler lint rule forbids reading a ref during render.
- **Deliberate deviation — the focus ring keeps the card's own radius** (`radius-lg`, 12px) instead of the standard
  small focus-ring radius. The card clips its media to that radius with `overflow: hidden`; shrinking the radius on
  focus would visibly square off the media's corners. Verified: a 2px solid `border.focus` ring, 4px offset, 12px radius.
- **`text-decoration: none`** on the root, so an `asChild` `<a>` doesn't pick up link underlining.

## Baseline correctness

- `forwardRef` on all 5 parts (root `div`, and each sub-part's `div`); verified by a ref test per part.
  `className`/`style`/`id`/`data-testid` accepted and documented on all 5.
- With `asChild`, the root renders exactly the slotted child — no wrapper element — and `className`/`style`/ref merge
  onto it (tested).
- `{...props}` spread first on every part.
- Zero hardcoded values: every colour, spacing, radius, border width, shadow, and motion value in `Card.module.css`
  traces to an existing token. No component-layer token was needed.

## Accessibility

- A `Card` is a plain container: no implicit role, so it adds nothing to the accessibility tree unless the consumer
  gives it one. `aria-label`/`aria-labelledby`/`aria-describedby` are typed and documented, and pair with
  `role="region"` when the card should be a labelled landmark (the Docs page shows this with `aria-labelledby`
  pointing at the card's heading).
- **Contrast, measured from the built token values** (WCAG AA 4.5:1 for text): `text.primary` on `bg.<tone>-subtle`
  is at least **13.46:1** (light) and **15.05:1** (dark) across all five colour tones. `filled`: `text.primary` on
  `bg.neutral-subtle` is **13.53:1 / 9.66:1**, and on its hover `bg.neutral-subtle-hover` **12.41:1 / 6.59:1**
  (light / dark). Every pairing clears AA.
- `tone` is decorative reinforcement, never the only carrier of meaning — the Docs page says to put the meaning in the
  content (a heading, a `Badge` with text), not in the border colour alone.
- Keyboard: nothing to do on a non-interactive card; an `interactive` card's focus ring is verified visible by a
  `play` test (Tab focuses the link, the outline is solid and non-zero).
- jest-axe clean on every variant, every tone, the link-card, and the `region` card; axe also runs on every story in
  real Chromium.

## Responsiveness and theming

- Width is the container's; the root is `min-inline-size: 0` and flex-column, so it never forces overflow. The footer
  wraps (`flex-wrap`). Verified at 375px: `scrollWidth === clientWidth`, media scales to the card width.
- All four themes are covered by tokens alone — verified live in light and dark for both brands (variants, tones,
  media), including the dark-mode elevated treatment above.
- Alignment of footer content is logical (`start`/`center`/`end`/`between` → `flex-start`/…), so it mirrors under RTL
  with no extra work, per [ADR-0009](../adr/0009-rtl-mirroring-is-a-per-component-judgment-call.md).

## Storybook and documentation

Docs page follows the §4 template (10 sections, hidden Intro heading). Nine visible stories — Playground, Variants,
Tones, Sizes, With media, Interactive link, Footer alignment, Equal height, With a table — plus four hidden sub-part
stories. Two have `play` functions: **Interactive link** (focus ring is solid and visible) and **Equal height** (footer
bottoms align across cards of differing content height). Every fixed-render story suppresses the controls it doesn't
consume via a shared `noControls` map. Props read variant → tone → size → interactive → asChild → aria-* → id →
className → style → data-testid, matching Controls, Playground, and Properties table. **With a table** shows a `ghost`
`Table` inside a Card — the composition `DataTable` will build on.

## Functional verification

- 48 unit tests (React Testing Library + jest-axe), all passing: structure and DOM order, every variant, size, and
  tone (including nesting isolation), footer alignment, the interactive dev warning (once; not with `asChild`; not
  with a `role`), `asChild` (no wrapper, class merge, ref), native attribute passthrough, refs on all 5 parts, and
  jest-axe scenarios.
- Full package: `eslint --max-warnings 0` and both `tsc --noEmit` passes clean; jsdom `unit` project 62 files / 1575
  tests; real-browser `storybook` project 81 files / 525 tests including a11y on every story and both `play` tests;
  `tsup` build; `storybook build`; and all three CI checks (`check-component-bundle-size` — Card at 1.04KB JS / 0.85KB
  CSS gzipped, within budget; `check-foundations-token-coverage`; `check-storybook-bundle-size`).
- Live-browser checks: variants and tones in light and dark, hover (elevated shadow steps `sm` → `md`), keyboard focus
  ring, media clipping to the rounded corners, the toned-header spacing fix, and a 375px width.

## Gaps named, not built

Left out deliberately; none blocks a first release, and each can be added without breaking the current API:

- **Dividers between sections** (a hairline above the footer, say) — today a consumer composes one with `Divider`.
- **Horizontal orientation** (media beside content) — needs a decision on how `Media` sizes itself in a row.
- **A disabled interactive state** — a disabled card is a disabled link/button, which the slotted element already
  expresses; no card-level prop was added.
