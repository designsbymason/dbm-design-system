# Indicators — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-04. Findings included one confirmed,
serious contrast/accessibility bug (not just documentation completeness) — the inactive dot's fill
was effectively invisible against its own default background in every theme — plus the recurring
`{...props}`-ordering bug class and the standard documentation-visibility gaps.

**Fixed:**
- **The inactive dot's fill failed contrast catastrophically — a third instance of the exact
  unverified-token-reuse mistake `03-token-system-spec.md` already flags twice (`bg.skeleton`,
  `bg.track`).** `.dot` used `background-color: var(--dbm-bg-neutral-subtle)`, never verified for
  this use. Computed directly from `packages/tokens/src/primitive/color.json`'s real values against
  `bg.surface`: **≈1.04:1 in light mode, ≈1.40:1 in dark mode** — nowhere near the WCAG 1.4.11 3:1
  non-text floor a real interactive `<button>` needs to be perceivable. Unlike `bg.track` (an
  accepted exception for a *passive* progress indicator), these dots are genuinely interactive
  controls a user must be able to see to know slides exist and are clickable. Fixed by switching to
  `bg.neutral` (gray.600/gray.300) — the token spec's own table already documents this token as
  verified "dot vs `bg.surface`: 4.70:1 / 5.86:1 (dual-purpose: dot fill...)", and it's already the
  token Avatar's status dot and Switch's track use for the identical role. Verified live in all 4
  brand/mode combinations (Purple/Emerald × Light/Dark) — dots are now clearly visible in every one.
- **`.dot:hover:not(.active)` colored a `background-color` from `border.neutral`** — a border-family
  token used for a background role, the same token-category-mismatch class just established for
  icon/text tokens (`05-component-api-conventions.md` §6). Now that the base fill is `bg.neutral`,
  hover uses its paired `bg.neutral-hover` instead of reaching into `border.*`.
- **Confirmed instance of the `{...props}`-ordering bug class (`05-component-api-conventions.md`
  §3):** `{...props}` was spread *after* the computed `role`/`aria-label` in the JSX. `role` isn't
  destructured out, so a consumer-passed `role` would have silently overridden the required
  `role="group"`, since later JSX attributes win. Fixed by moving `{...props}` before both computed
  attributes, matching Divider's/ProgressBar's/FieldError's already-fixed pattern. Regression test
  added.
- **`className`, `style`, `id`, `data-testid`, and `aria-label` weren't explicitly redeclared with
  JSDoc** on `IndicatorsProps` — the same established gap as Tag/Avatar/Switch. Added, matching the
  standard wording used elsewhere.
- **No dev-mode `console.warn` when `activeIndex` is outside `[0, count)`.** A plausible off-by-one
  from an external Carousel would silently produce a group where no dot matches `isActive`, leaving
  nothing in the tab order with zero signal to the developer. Added, following `ProgressBar`'s own
  warn-once-per-mount pattern (`hasWarnedOutOfRangeRef`).
- **No `size` prop.** *(Judgment — a named gap, not a blanket enhancement.)* Every other shipped
  visual atom (Avatar, Badge, Spinner, ProgressBar, Skeleton, Switch) exposes the standard
  `xs`–`xl` scale; Indicators hardcoded one fixed dot size regardless of context. Added a new
  component-layer token file (`component/indicators.json`, `indicators.size.{xs,sm,md,lg,xl}` =
  4/6/8/10/12px — following the same reasoning as Avatar's/Badge's/IconButton's own component-layer
  tokens: 3 of 5 steps land on the primitive spacing scale, 2 don't, so a dedicated scale was created
  rather than distorting the shared one). `md` (8px) matches the original hardcoded diameter exactly,
  so existing usage with no `size` prop is visually unchanged. The active dot's pill width derives
  from the diameter via `calc(var(--dot-size) * 3)` rather than a second token family, preserving the
  original 8px/24px ratio at every step.
- **No Playground story existed** — added, with `count`/`size`/`aria-label` genuinely live via
  `args`/`argTypes`. `activeIndex`/`onIndexChange` are wired through local Storybook-demo state
  (there's no uncontrolled variant to lean on, unlike Switch's `defaultChecked`-based Playground) so
  clicking/arrow-keying a dot in the canvas actually moves the position. `GallerySize` was renamed to
  `ManySlides` and converted from a fully-hardcoded `render` (which would have silently ignored the
  new shared Controls panel — the "render ignoring args" bug class) to one that still spreads `args`
  for `count`/`size`/`aria-label` while only hardcoding the genuinely non-controllable `getLabel`. A
  new `AllSizes` gallery story was added for the size scale, with only `size` itself suppressed from
  its Controls panel per the multi-instance-grid convention.
- Docs page (`Indicators.mdx`) built to the full template — visually verified section by section in
  a running Storybook instance (Playground live-control check including the `size` control, the
  Properties table's full prop list with no empty rows, both variant galleries, both Do/Don't
  Callouts, the Accessibility Callout, live token swatches for `bg.neutral`/`bg.neutral-hover`/
  `bg.brand` in the Design tokens section, and both RelatedCards — Icon, Image), confirmed across
  Purple/Emerald × Light/Dark.

Tests: 21 → 25 (added: the `role`-override regression test, default/custom `size`-class coverage,
and the out-of-range `activeIndex` dev-warning pair).

Self-verified: `pnpm build` on `@dbm-design-system/tokens` (new `--dbm-indicators-size-*` CSS vars
confirmed in `component-tokens.css`), `tsc --noEmit` (both the package and `.storybook`),
`eslint --max-warnings 0`, full Vitest suite (918 tests package-wide), and a real `tsup` package
build.

Review pass complete — all findings actioned. Per `06-engineering-standards.md` §9, "Finalized" is a
status the user declares explicitly, not one a review pass asserts on its own; awaiting that
confirmation before this entry (and `07-storybook-and-documentation-standards.md` §6's status table)
records a Finalized date.

**Follow-up, same day (2026-09-04), at explicit direction:** the inactive dot's fill (`bg.neutral`,
chosen above to fix the original contrast bug) read as visually too dark. Asked before changing it,
since the literal request — `bg.track`/`bg.track-hover` — would have reintroduced the same class of
bug this review had just fixed: `bg.track` is explicitly documented (`03-token-system-spec.md`) as a
deliberate exception that *fails* the WCAG 1.4.11 3:1 non-text floor (1.14:1 light / 1.40:1 dark
against `bg.surface`), accepted only for a passive, non-interactive indicator like `ProgressBar`'s
track — not for a real, clickable `<button>` a user needs to perceive. `bg.track-hover` also doesn't
exist as a token. Landed instead on `bg.track-strong` (gray.500/gray.400, 3.25:1/4.34:1 — already
documented in the token spec as intended for exactly this case: "used where the boundary must read
as real, e.g. `Switch`'s always-interactive track") for the base fill, with `bg.neutral` itself
reused as the hover state (one step more prominent, already verified, no new token needed). Updated:
`Indicators.module.css` (`.dot`/`.dot:hover`), `Indicators.mdx` (Accessibility bullet + both
`TokenRow` entries), and `03-token-system-spec.md`'s `bg.neutral`/`bg.track-strong` rows. No prop,
type, or test changes — purely a color-value swap between two already-existing semantic tokens, so
none of the checklist sections beyond Theming/Design quality are affected. Re-verified visually
across Purple/Emerald × Light/Dark; `tsc`/`eslint`/full Vitest suite/`tsup` build all re-confirmed
clean.

**Follow-up, same day (2026-09-04), at explicit direction: added `orientation` prop
(`"horizontal" | "vertical"`, default `"horizontal"`).** Matches Divider's own already-established
`orientation` prop pattern (`05-component-api-conventions.md`), applied to a new component rather
than a new convention. More than a CSS flip, as flagged before starting:
- `.root.vertical` switches to `flex-direction: column`; the active dot's pill elongation swaps from
  `width` to `height` (`.root.vertical .active`), preserving the same 3x-diameter ratio on whichever
  axis is actually active. `.dot`'s transition list gained `height` alongside the existing
  `width`/`background-color` so the swap animates smoothly regardless of orientation.
- Keyboard: `ArrowDown`/`ArrowUp` replace `ArrowRight`/`ArrowLeft` when vertical — only the
  axis-matching pair responds (confirmed live: the non-matching pair is a genuine no-op, not just
  visually irrelevant), matching how other orientation-aware composite widgets behave. `Home`/`End`
  are unconditional in both orientations, unchanged.
- **A real, caught-by-testing correctness finding: `aria-orientation` is not a supported ARIA
  attribute on `role="group"`.** The initial implementation set `aria-orientation={orientation}`
  unconditionally (reasoning, in hindsight wrong, from Divider's own `aria-orientation` usage on
  `role="separator"`, a role that *does* support it) — caught immediately by the existing jest-axe
  test (`aria-allowed-attr` violation), not by manual inspection. Removed rather than switching to a
  role that does support it (`toolbar`, `tablist`) — neither accurately describes a plain group of
  navigation buttons, and `role="group"` is otherwise the correct, already-tested semantic. Orientation
  is conveyed through actual arrow-key behavior and visual layout instead; documented as a deliberate
  omission (with the "why") in the Docs page's Accessibility section rather than left unexplained.
- Docs page updated: intro paragraph, Playground description, a new "Vertical orientation" Variants
  entry, a Usage-guidelines Do bullet, the Accessibility section's keyboard bullet plus the new
  `aria-orientation`-omission bullet above, and a vertical code example. `propOrder` updated
  (`orientation` after `size`). New `Vertical` gallery story added (its own `args` override, live
  `count`/`size`/`aria-label` still controllable). `orientation` added to the Playground's
  `argTypes`/`args` as a `select` control.
- No token additions — `flex-direction`/pill-axis are layout mechanics, not values needing a design
  token.

Tests: 25 → 28 (added: default/vertical orientation-class coverage, a vertical-mode jest-axe check,
and the ArrowDown/Up-navigates-while-ArrowRight/Left-is-a-no-op pair — mirroring, not replacing, the
existing horizontal keyboard tests).

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest suite
(923 tests package-wide), a real `tsup` build, and live Storybook verification — vertical layout,
click-to-navigate, ArrowDown/Up working, ArrowRight/Left confirmed as a no-op via the Actions panel
call count, and the Docs page's new/updated sections all rendering correctly.

**Follow-up, 2026-09-05, at explicit direction: added a progress label (`showLabel`/`formatLabel`).**
Raised first as a feature-completeness question alongside three other candidates (loop navigation —
already implemented via the existing modulo wraparound; auto-advance — declined, since it requires
internal timer state that contradicts the component's deliberate fully-controlled design and drags
in WCAG 2.2.2 pause/stop requirements that really belong to the not-yet-built `Carousel`; and a
dedicated spacing prop — declined, since `style`/`className` already override the gap today and a
first-class prop would mostly duplicate that escape hatch). Progress label was the one with a
direct, strong precedent: mirrors `ProgressBar`'s own `showValueLabel`/`formatValueLabel` shape
exactly (`showLabel?: boolean`, `formatLabel?: (activeIndex, count) => ReactNode`, defaulting to
`` `${activeIndex + 1}/${count}` ``), including the identical "provided without the boolean" dev-mode
warning pattern (`hasWarnedUnusedFormatRef`).
- **Structural change: the component now always renders an outer wrapper `<div>`** around the
  existing `role="group"` element, with the label as an optional sibling `<span>` inside it —
  matching `ProgressBar`'s own root/track split (ref, `className`, and `{...props}` all still target
  the inner group element, never the wrapper, so this is invisible to any existing consumer's props
  or the exposed `ref`). The wrapper renders unconditionally (not only when `showLabel` is set) to
  keep the component's DOM shape stable across a `showLabel` toggle, rather than switching structure
  based on a prop value — deliberate, matching `ProgressBar`'s own precedent, confirmed to have zero
  visual effect when no label is shown (a single-child flex container is invisible either way).
- Label styling (`text.primary`, `font-family.primary`, `font-size.xs`, `font-weight.semibold`,
  `font-variant-numeric: tabular-nums`) copied directly from `ProgressBar.module.css`'s own
  `.valueLabel`, including the not-`aria-hidden` accessibility choice (the label is real, readable
  text, not marked decorative — same reasoning `ProgressBar` already settled on for its own value
  label).
- Vertical orientation composes cleanly with no extra work: the wrapper reuses the same `.vertical`
  modifier class as the inner group (a shared CSS-module class matched by two separate compound
  selectors, `.wrapper.vertical` and `.root.vertical`), so the label automatically sits below the
  column instead of beside the row — confirmed live.
- Docs page updated: `propOrder` (`showLabel`/`formatLabel` after `getLabel`), Playground
  description, `PlaygroundControls`' `exclude` list (`formatLabel`, a function prop), a new "With
  progress label" Variants entry, Do/Don't bullets, an Accessibility bullet, a code example, and 4
  new `Design tokens used` rows for the label's typography. New `WithProgressLabel` gallery story;
  `showLabel` added to the Playground's `argTypes`/`args` as a real boolean control, `formatLabel`
  set to `control: false` (function prop).

Tests: 28 → 32 (added: default-hidden, default-format-renders-as-sibling-not-child, custom
`formatLabel`, a jest-axe check with the label shown, and the warn-once/no-warn pair for
`formatLabel` without `showLabel`).

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest suite
(929 tests package-wide), a real `tsup` build, and live Storybook verification — the label rendering
correctly in both orientations, and the Docs page's Properties table/Variants/Design-tokens sections
all confirmed live.
