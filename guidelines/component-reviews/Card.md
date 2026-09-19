# Card — Storybook/component review findings

**Data Display:** Card — built 2026-09-19, item 11 in the itemized molecule-tier build order
(`04-component-inventory.md`). Adds no new dependency and no new token — every value already had a home on an
existing scale. **Finalized 2026-09-19** — declared by the user after the full review pass and the four same-day
follow-ups recorded below; see the closing entry at the bottom of this file. Everything above it records the build and
review history leading there.

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

Docs page follows the §4 template (10 sections, hidden Intro heading). Fourteen visible stories — Playground, Variants,
Tones, Sizes, With media, Divided sections, Horizontal orientation, Media position, Responsive orientation, Interactive link,
Interactive disabled, Footer alignment, Equal height, With a table — plus four hidden sub-part stories. Six have `play`
functions:
**Interactive link** (focus ring is solid and visible), **Equal height** (footer bottoms align across cards of
differing content height), **Horizontal** (media is beside the content, on the right side for `start`/`end`, and fills the card's height),
**Media position** (media is above, below, beside-start, and beside-end as asked), **Responsive orientation** (the card's `display` matches the breakpoint the test viewport is in), and
**Disabled** (a click on the disabled card never reaches the link's handler, and it stays focusable). Every fixed-render story suppresses the controls it doesn't
consume via a shared `noControls` map. Props read variant → tone → size → orientation → divided → interactive → disabled →
asChild → aria-* → id → className → style → data-testid, matching Controls, Playground, and Properties table. **With a table** shows a `ghost`
`Table` inside a Card — the composition `DataTable` will build on.

## Functional verification

- 83 unit tests (React Testing Library + jest-axe), all passing: structure and DOM order, every variant, size, and
  tone (including nesting isolation), orientation, divided, footer alignment, the interactive and disabled dev
  warnings (once each), the full disabled matrix (see the follow-up below), `asChild` (no wrapper, class merge, ref),
  native attribute passthrough, refs on all 5 parts, and jest-axe scenarios.
- Full package: `eslint --max-warnings 0` and both `tsc --noEmit` passes clean; jsdom `unit` project 62 files / 1610
  tests; real-browser `storybook` project 81 files / 530 tests including a11y on every story and all six `play`
  tests; `tsup` build; `storybook build`; and all three CI checks (`check-component-bundle-size` — Card at 1.59KB JS /
  1.31KB CSS gzipped, within budget; `check-foundations-token-coverage`; `check-storybook-bundle-size`).
- Live-browser checks: variants and tones in light and dark, hover (elevated shadow steps `sm` → `md`), keyboard focus
  ring, media clipping to the rounded corners, the toned-header spacing fix, and a 375px width.

## Follow-up (2026-09-19, same day, at explicit direction) — three features built

The three gaps this review first named (dividers, horizontal orientation, a disabled state) were built. All three are
opt-in, so the default card is unchanged. Props now read variant → tone → size → **orientation → mediaPosition → divided** →
interactive → **disabled** → asChild → …

- **`divided`** — a boolean on the root, off by default. A `border.default` hairline between adjacent header/body/footer
  sections, drawn by CSS (`.divided > :is(.header, .body, .footer) + :is(…)`), so it adds no elements. Decisions:
  - **No line against `Card.Media`** — media already has a hard edge.
  - **No line under a tinted header** (a toned card) — the tint already marks that edge; the divider then appears only
    between body and footer.
  - **A section after a divider takes its top padding back**, since the "drop the top padding after a section" rule
    would otherwise leave its content touching the line.
- **`orientation="vertical" | "horizontal"`** — default `vertical`. Horizontal turns a card *that has a `Card.Media`* into a
  two-column grid (`:has(> .media)`, the repo's first use of `:has()`, within the "last 2 versions of evergreen browsers"
  target): media takes the first column (2fr : 3fr) spanning every content row, and the header/body/footer stack in the
  second. The row template is `auto 1fr auto`, so the body absorbs spare height and the footer stays at the bottom when
  the media is the taller side (verified live at 260px of media against ~180px of content: 1px from the bottom edge).
  `img`/`picture`/`video` fill the full height with `object-fit: cover`. A horizontal card with no media is just a
  vertical one.
  - **Made responsive in a second follow-up the same day** — see the section after this one. It first shipped as a plain
    value; the reasoning and the mechanism that replaced it are below.
  - **Found live at 375px:** the header's trailing badge shrank below its own label, and a long title word ran under
    it. Fixed in the header itself, which also protects narrow vertical cards: the title gives way (`min-inline-size: 0`,
    last-resort `overflow-wrap: anywhere`) and every later child keeps its size (`flex-shrink: 0`). At ~295px a
    horizontal card still breaks a long word mid-title — that is the "too narrow" limit above, degrading legibly instead of
    overlapping.
- **`disabled`** — meaningful only with `interactive`. Modelled on `Link`'s existing pattern rather than a new one:
  `aria-disabled` plus a **capture-phase** click guard (`preventDefault` + `stopPropagation`), not a native `disabled`
  attribute (an `<a>` has none), so the slotted link keeps its `href` and stays reachable by keyboard per WAI-ARIA. The
  capture phase matters: it stops the click before a `Slot`-composed child's own handler (a router's navigation) runs.
  - Styled like `Link`/`Button`: `opacity.40`, `cursor: not-allowed`, and hover/pressed feedback removed
    (`.interactive:not(.disabled):hover`); deliberately no `pointer-events: none`, which would suppress the cursor.
  - A consumer's own `onClickCapture` is composed, not overwritten: it runs when the card is enabled and is skipped
    when disabled. A consumer's own `aria-disabled` still passes through when the card isn't disabled.
  - `disabled` without `interactive` has no effect (no `aria-disabled` on a role-less `<div>`) and warns once in
    development, mirroring the `interactive`-without-`asChild` warning.
  - **Known trade-off, same as `Link`/`Button`:** the 40% opacity also dims the keyboard focus ring on a focused disabled
    card. Disabled (inactive) controls are exempt from WCAG's non-text contrast requirement, and the ring stays visible;
    it is not boosted separately.
- **Verification.** 22 new unit tests (70 total): the class and DOM order for horizontal, composition with variant/tone/
  size, no leakage into a nested card, that `divided` adds no elements, and for `disabled` — `aria-disabled`, the kept
  `href`, focusability, the click blocked before the child's handler and `preventDefault` called, a click passing when
  enabled, a consumer's `onClickCapture` composed, a slotted `<button>`, the no-`interactive` no-op and single warning,
  and two jest-axe cases. Three new stories, three new `play` assertions. Live: horizontal and divided in light and dark,
  hover on a disabled card (shadow does not step up, cursor `not-allowed`, opacity 0.4), and a 375px width with no page
  overflow. A real defect surfaced only in the browser test run: the Disabled story's own link navigated the test page on
  click and crashed the runner until its spy called `preventDefault`.

## Follow-up (2026-09-19, same day, at explicit direction) — responsive orientation, media on the end side, Playground media control

The two gaps left after the previous follow-up were built, plus a Playground control.

- **`orientation` is now `Responsive<"vertical" | "horizontal">`** — a single value, or the same mobile-first map keyed by
  breakpoint (`{ base: "vertical", md: "horizontal" }`) that `Stack` and `Grid` take. Breakpoints are *viewport* widths,
  as everywhere else in the system; a card's own container width isn't available to it (making the card a size container
  would give it no intrinsic inline size). This is documented, including the consequence: a horizontal card in a narrow
  sidebar on a wide screen still needs `orientation="vertical"`.
  - **Mechanism — deliberately not `Stack`'s.** `Stack` cascades each responsive prop through nested `var()` fallbacks in
    six media blocks (~200 lines). A layout switch touches many properties, so instead the card's rules are *static* and
    read three custom properties (`--card-display`, `--card-columns`, `--card-footer-self`); a **class per breakpoint and
    orientation** (14 in all, `.orientMdHorizontal` …) only sets those three. Six `@media` blocks, ascending, same
    specificity, so the larger breakpoint wins. `orientation` maps to classes in `Card.tsx`; no inline styles.
  - **Custom properties inherit, so every `.card` resets its own three** — otherwise a card nested in a horizontal card's
    body would inherit its grid. Verified live (a plain card inside a horizontal one stays `flex`) and by a unit test.
  - **No orientation class at all when `orientation` isn't passed** (found by a unit test: the default had been adding a
    redundant `orientBaseVertical`). An explicit `"vertical"` does add it, which is what lets a map override an earlier
    breakpoint.
  - The named breakpoint thresholds are hardcoded literals in the CSS with a comment saying so, exactly as in `Stack` and
    `Grid` (custom properties can't appear in `@media` conditions).
- **`mediaPosition="start" | "end"`** — a new root prop. **Originally horizontal-only; extended to vertical cards in a third
  follow-up the same day** (see the section after this one). It is **logical**, so in a horizontal card `end` is the left
  side in right-to-left text (verified live with `dir="rtl"`). In a horizontal card it swaps the column template only: the
  grid uses **named column lines** (`media`, `content`), so items are placed by name and the same rules serve both sides.
  **Visual only — the media stays first in the DOM**, so reading order for assistive technology doesn't change (a unit
  test asserts it); the docs say so and tell authors not to use `mediaPosition` to reorder content. It is not itself
  responsive; combine it with a responsive `orientation`.
  - Dropped `min-block-size: 0` from the horizontal media rule: it was unnecessary once verified against the browser tests,
    and it would have let media shrink in a *vertical* card with a constrained height.
  - The image/video `block-size: 100%; object-fit: cover` rule is now static for every card. In a stacked card the media's
    height is its content's, so the percentage resolves to nothing and it is inert; the existing With-media and
    Equal-height stories are unchanged.
- **Playground `media` control (Storybook only).** A boolean that renders a demo `Card.Media` (a token gradient), so
  `orientation` and `mediaPosition` have something to act on — previously the Playground silently added media when
  `orientation` was horizontal. It is *not* a `Card` prop: its argType carries `table: { disable: true }`, which
  `PropertiesTable` already honours, so it appears in the Playground controls (in a dedicated `playgroundPropOrder`, just
  before the props it makes visible) and never in the Properties table. Verified live on the Docs page. The demo media is one
  `aspect-ratio: 16 / 9` element with `height: 100%`, which serves both orientations.
- **Verification.** 9 more unit tests (79 total): every breakpoint's class including `2xl`/`3xl`, a map with no base, an
  `undefined` entry, DOM order unchanged whatever the map, `mediaPosition` default/explicit/end/with a responsive
  orientation, and no orientation class by default. One new story with a `play` test (`Responsive orientation`), and the
  Horizontal story gained a media-on-end card. Live: media on the end side, the responsive card as `flex` at 375px and
  `grid` at 900px, RTL mirroring, and nested-card isolation.

## Follow-up (2026-09-19, same day, at explicit direction) — `mediaPosition` in vertical cards

`mediaPosition` now also works in a vertical card: `"start"` is the top and `"end"` is the bottom (a horizontal card: the
inline-start / inline-end side).

- **Mechanism:** `order` on the media in the flex column (`.mediaStart > .media { order: -1 }`, `.mediaEnd > .media
  { order: 1 }`). In a horizontal card `order` is inert — the media is placed by its grid lines — so the same two classes
  serve both orientations and a responsive `orientation` map needs no extra handling.
- **`mediaPosition` no longer defaults to `"start"` — it is unset by default.** With it unset the media stays wherever it
  sits in the DOM, which keeps the documented "sections in any order" behaviour (a `Card.Media` written last still renders
  last) rather than silently pulling every media to the top. Explicit `"start"` pins it to the top even if it was written
  last; unset in a horizontal card still means the start side. The Properties table shows the default as `unset`; the
  Playground control's starting value is `"start"` (media first in the demo either way).
- **Accessibility trade-off, stated in the docs.** `order` moves the media visually but not in the tab or reading order,
  so media at the *bottom* is still first for a screen reader and for Tab (WCAG 1.3.2 / 2.4.3 territory when the media
  contains a link or button). The docs say: if the media holds anything focusable, place `Card.Media` last in the DOM and
  leave `mediaPosition` unset. Text and images (the normal case) are unaffected.
- **Spacing:** unchanged and still DOM-adjacency based — the section after media keeps its own top padding, so a card with
  media pinned to the bottom still reads header-first with correct padding and no divider against the media.
- **Verification:** 4 more unit tests (83 total): unset applies no position class, `start`/`end` apply theirs, it works in a
  vertical card, the media stays first in the DOM in both orientations, and it doesn't leak into a nested card. A new
  **Media position** story shows all four combinations with a `play` test asserting the geometry of each (above, below,
  beside-start, beside-end). Verified live.

## Gaps named, not built

Left out deliberately; each can be added without breaking the current API:

- **A container-width orientation** (switching on the card's own width rather than the viewport's) — needs a size-container
  mechanism the card can't take on itself; see the responsive section above.
- **A responsive `mediaPosition`** — plain today; only worth adding if a real case wants the side to change per breakpoint.
- **Moving the media in the tab and reading order too** — `mediaPosition` is visual only by design; a real DOM reorder would
  need the sections to be re-rendered in a different order, which is what placing `Card.Media` in the DOM already does.

**Finalized 2026-09-19.** Before finalizing, the review checklist (`06-engineering-standards.md` §9) was re-run against the final
state: the only numeric literals in `Card.module.css` are the six documented breakpoint thresholds inside `@media` conditions
(custom properties can't appear there — the same limitation `Stack` and `Grid` note), every prop in `Card.types.ts` carries JSDoc
(17 on `CardProps`, and every sub-part's props), there is no `any`, and `{...rest}` is spread before every computed attribute. The
full package was re-confirmed clean immediately before: `eslint` plus both `tsc` passes, the `unit` project (83 tests for `Card`;
1610 for the package), the real-browser `storybook` project (530 tests, including axe on every story and all six `play` functions),
`tsup` build, `storybook build`, and every size and coverage check (`Card`: 1.59KB JS / 1.31KB CSS gzipped, within budget). CI
green on the last push. Final surface: four sub-parts (`Media`, `Header`, `Body`, `Footer`); root props `variant` (four values),
`tone` (six), `size`, `orientation` (a single value or a responsive map), `mediaPosition`, `divided`, `interactive`, `disabled`,
and `asChild`; and `Card.Footer`'s `align`. Per `06-engineering-standards.md` §9, don't make further changes to `Card` (code,
stories, docs, or its tokens) without asking first.
