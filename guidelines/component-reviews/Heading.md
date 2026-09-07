# Heading — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-06.

**Fixed:**
- **Confirmed accessibility bug — `{...props}` spread *after* the computed `role`/`aria-level`
  attributes.** The exact "confirmed recurring pattern" bug class already fixed on `Skeleton`/
  `ProgressBar`/`Button`/`Checkbox`/`Affix`/`Divider`/`FieldError` (`05-component-api-conventions.md`
  §3) — Heading is a new confirmed instance. A consumer-passed `role`/`aria-level` (both flow
  through via `...props`, since only `as`/`children` are `Omit`-ed) silently overrode the
  deliberately-computed ARIA fallback that makes an `as`-overridden Heading discoverable at the
  correct level to assistive technology. Fixed by reordering the spread before the computed
  attributes; added a regression test (deliberately-invalid values passed via a spread object cast
  through `unknown`, not literal JSX attributes, so the intentional bad input doesn't trip static
  TS/jsx-a11y checks that only scan literal values — same technique as Divider's own regression
  test).
- **`HeadingSize` only covered 8 of the 11 font-size token steps** (`md`-`6xl`), omitting `xs`/`sm`/
  `base` — a real divergence from `05-component-api-conventions.md` §2's explicit exception for
  Text/Heading/Icon using the *full* font-size scale, not a judgment call. Resolved by aliasing
  `HeadingSize = TextSize` directly (rather than a separately-declared duplicate union) and adding
  the three missing CSS classes (`sizeXs`/`sizeSm`/`sizeBase`) to `Heading.module.css`, matching
  `Text.module.css` exactly. `level`'s decoupled-default-size mechanism (`defaultSizeForLevel`,
  already existing) is unaffected — level defaults still land on `5xl`-`lg`, all still valid steps.
- `id`/`className`/`style`/`data-testid` weren't explicitly redeclared with JSDoc on `HeadingProps`
  — added, matching `Box`/`Blockquote`'s established pattern (`style`'s wording follows
  `Blockquote`'s phrasing for a component with its own CSS module, not `Box`'s no-module wording).
- No Playground story existed — all 8 stories used hardcoded `render: () => (...)`/static `args`
  with no live-editable panel. Added a live Playground (every prop wired through `args`/`argTypes`,
  matching the real component defaults where one exists, a sensible non-blank demo value where one
  doesn't — `align="start"`, `wrap="wrap"`, `size="4xl"` matching `level={2}`'s own default).
- Docs page (`Heading.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance (Playground controls actually driving the canvas, both new `align`/
  `wrap` selects confirmed live via direct DOM/computed-style inspection, not just a screenshot; the
  Reset-to-defaults button confirmed to revert both; the Properties table's 14 rows confirmed
  correctly ordered with no empty descriptions), both brands × dark mode, and the existing
  `NarrowViewport` story re-confirmed to still wrap with zero horizontal overflow at 375px.

**Added (feature-completeness gaps, named against comparable components per the `06` §9
guardrail, both approved before implementation):**
- **`align?: "start" | "center" | "end"`** — named gap against MUI's `Typography` (`align`) and
  Radix Themes' `Heading` (`align`). Logical keywords (not `left`/`right`), per `06` §7's
  RTL-safe-by-default convention — `text-align: start/center/end` is itself the logical form, no
  `-inline` suffix needed. Unset by default (inherits the surrounding layout's own alignment,
  visually unchanged from before this pass). Maps directly to a literal CSS keyword, not a design
  token — `text-align` isn't a color/spacing/etc. value the token system covers, the same category
  `Stack`'s `align`/`justify` (flexbox keywords) already fall into; documented as such on the Docs
  page's Design tokens section rather than silently omitted.
- **`wrap?: "wrap" | "nowrap" | "balance" | "pretty"`** — named gap against Radix Themes' `Heading`
  (`wrap`, mapping to CSS `text-wrap`). `balance` avoids an orphaned short last line on a multi-line
  heading; `pretty` avoids poor breaks with less layout cost. Unset by default (browser's own `wrap`
  behavior, visually unchanged). Same non-tokenized-literal treatment as `align` — documented on the
  Docs page rather than silently omitted.
- **Dev-mode warning: `as` set to an actual `h1`-`h6` tag.** `as` is meant for overriding to a
  *non*-heading element (per its own pre-existing JSDoc); passing a real heading tag stacks an
  explicit `aria-level` override on top of that tag's own native implicit level, a confusing,
  almost-certainly-unintended combination. Warns once per instance (`useRef`-gated, matching `Tag`'s
  established `hasWarned*Ref` pattern), pointing the consumer at `level` instead.
- **Dev-mode warning: `wrap="nowrap"` combined with `truncate` set to more than 1 line.** A newly
  possible conflict introduced by adding `wrap` — `nowrap` keeps the heading on a single line, so a
  multi-line clamp never has more than one line to act on. Does not warn for `truncate={1}` (a
  genuinely harmless, non-conflicting redundancy) or for `wrap="nowrap"` alone.

**Kept as-is (confirmed intentional, not a gap):** `level`/`size` decoupling itself — the existing
`defaultSizeForLevel` map already gives every level a sensible default `size` while `size` stays
fully overridable, the same split MUI's `variant`/`component` and Radix Themes' `size`/`as` make.
Discussed directly and confirmed as the desired pattern before the `HeadingSize` fix above; nothing
architectural changed here, only the range of values `size` itself accepts.

Tests: 18 → 29 (three new `xs`/`sm`/`base` size assertions, default-vs-explicit `align`/`wrap`
assertions across all values, the `{...props}`-ordering regression test, both new dev-warning
pairs — warns-once and does-not-warn cases each — and an explicit `id` passthrough test).

Self-verified: `tsc --noEmit`, `eslint` (including the `.storybook` typecheck), full Vitest suite
(983 tests package-wide, unit project), a real `pnpm build` across the workspace, the Foundations
token-coverage check (unaffected — no semantic tokens added), and `check-component-bundle-size`
(within budget). Visually verified live in Storybook: Playground `align`/`wrap` controls confirmed
to actually drive the canvas (not just show a value) via direct DOM/computed-style reads; all 11
`AllSizes` steps confirmed at increasing `font-size`; `Align`/`Wrap` gallery stories confirmed
correct under `emerald-dark`; Properties table confirmed complete with no stray empty-description
rows.

**Follow-up fix (same day, user-reported): Storybook Controls-panel wiring, both the native panel
and the Docs-page Playground.**

- **Confirmed real bug: changing `level` in the Playground appeared to do nothing — neither the
  canvas nor `size`'s own displayed value changed.** Root cause: the Playground's `meta.args` gave
  `size` a fixed demo value (`"4xl"`), which permanently short-circuits `Heading`'s own internal
  `size ?? defaultSizeForLevel[level]` fallback — since `size` was never actually `undefined`,
  changing `level` had no visible effect, exactly the "control exists but has no effect" bug class
  `06-engineering-standards.md` §9 already warns about, just caused by a story default rather than
  a component bug. Fixed by leaving `size` genuinely `undefined` in `meta.args` instead of giving it
  a demo value — the one deliberate exception to "every live control needs an explicit default,"
  documented inline, since a fixed default here would hide the exact behavior the Playground exists
  to demonstrate. Verified live, using DOM class name as the ground-truth signal (not absolute
  pixel values — a fluid `clamp()` size resolves against a different effective width once nested in
  the Docs page's own Canvas preview box, an unrelated pre-existing Storybook characteristic, not a
  regression): changing `level` now correctly re-renders at that level's own matched default size,
  confirmed on both the native per-story Controls panel and the Docs-page Playground.
- **Confirmed real bug: `truncate` showed an inert "Set number" placeholder button instead of a
  live input.** Root cause, verified directly (not assumed): a Storybook `number`-type control
  renders as a "Set number" placeholder whenever its arg value is `undefined`, regardless of having
  an explicit `control: "number"` argType — a distinct failure mode from the "docgen guessed the
  wrong type" case this project had previously documented, and one this review's own prior pass
  didn't know about yet. `truncate`'s real default is "off" (no truncation), and no number honestly
  represents "off" to pre-fill instead. Fixed by setting `truncate` to `control: false` at the meta
  level (shows "–" everywhere) — the exact same shape and reasoning as `Textarea`'s own `minRows`/
  `maxRows`, confirmed by reading that component's own stories file directly rather than guessing —
  and demonstrating it with a literal hardcoded value in the "truncate (line-clamp)" story instead
  of a live control, matching `Textarea`'s own precedent of never exposing this class of prop live,
  even in its own dedicated demo story. Added to the Docs page's `PlaygroundControls` `exclude`
  list too, so that panel doesn't show a dead "–" row for it either.
- **Confirmed real bug: two gallery stories (`Align`, `Wrap`) had a `level` control that looked
  enabled but did nothing.** Found while re-auditing every story after the fixes above, not
  user-reported directly — both stories hardcoded `level={3}`/`level={2}` as a JSX literal on every
  instance *after* `{...args}`, which always wins over whatever the (enabled, untouched) `level`
  control said. Fixed by moving the fixed value into each story's own `args: { level: N }` override
  instead of a JSX literal, so `{...args}` alone carries it through and the control genuinely drives
  the render — verified live by changing `level` and confirming all instances in both galleries
  re-rendered at the new tag.
- **Full re-audit of every hardcoded prop value against every story's `argTypes`,** not just the
  three bugs above — grepped every `level=`/`size=`/`as=`/`wrap=`/`align=`/`truncate=`/`fontFamily=`
  literal in the stories file and cross-checked each one is paired with that same prop's control
  disabled in that story. All consistent: nothing live is silently shadowed by a literal, and
  nothing disabled is missing its "–"/hardcoded pairing.
- **Re-verified prop order across all three surfaces reads identically:** the native Controls panel
  (read directly from the rendered DOM, not inferred), the Docs page's `PlaygroundControls`, and its
  `PropertiesTable` all read `children, level, size, align, weight, color, fontFamily, wrap,
  truncate, as, id, className, style, data-testid` — required moving `children` to the front of
  `HeadingProps`' own declared field order (was last), since the native panel's row order is driven
  by that declaration order for explicitly-declared props, not by `argTypes`/`propOrder` (which only
  govern the custom blocks) — the same mechanism already documented in
  `07-storybook-and-documentation-standards.md` §4.1 for exactly this class of fix. Required a
  Storybook dev-server restart to take effect (HMR doesn't invalidate docgen's own cache for a
  changed type file, per that same section).

Self-re-verified: `tsc --noEmit`, `eslint` (including `.storybook` typecheck), full Vitest suite
(983 tests package-wide, unchanged — this pass was Storybook-wiring only, no component behavior
changed), and a real `pnpm build`. Visually re-verified live in Storybook, native Controls panel and
Docs-page Playground both: every one of the 14 props read against its own story's intended
live/disabled state on `Playground`, `Default`, `AllLevels`, `AllSizes`, `FontFamily`, `Align`,
`Wrap`, and `Truncate` (8 stories spot-checked directly via the rendered DOM, not by reading source
and assuming).

**Second follow-up fix (same day, user-requested): make `truncate` genuinely interactive, and show
`size`'s live-computed default instead of a blank placeholder — both on the Docs page's own
`PlaygroundControls` block, not the native Storybook Controls tab.**

- **`truncate` was over-corrected in the prior follow-up.** Re-reading `PlaygroundControls.tsx`
  directly (rather than assuming) showed its own `number`-control branch already renders a real,
  always-live `Input` that's empty (not `0`, not a placeholder) whenever the arg is `undefined` —
  the "Set number" placeholder button problem only ever existed in Storybook's *native* per-story
  Controls addon tab (its own vanilla `NumberControl`, unrelated code this project doesn't own or
  customize), not in this project's own hand-built Docs-page widget. Setting `truncate` to
  `control: false` fixed the native tab but threw away an already-working live control on the more
  important surface. Reverted to `control: "number"`; the "truncate (line-clamp)" story's own
  `truncate` is live again (defaults to 2 via `args`, not a JSX literal, so the control genuinely
  drives it). The native tab's own "Set number" behavior is unavoidable and documented inline as a
  known, secondary-surface-only limitation.
- **Added a new, generic, opt-in mechanism to `PlaygroundControls.tsx` (shared Storybook
  infrastructure, used by every component's Docs page): `argType.resolveDisplayValue?.(args)`** —
  computes what a control should *display* when its own arg is `undefined`, from the story's full
  live `args`, without that computed value ever becoming a real, sticky arg on its own (`onChange`
  always writes the user's actual explicit choice). Purely additive per the `06` §9 three-question
  test — no existing argType sets this field, so every other component's Playground behaves exactly
  as before (`effectiveValue === value` whenever `resolveDisplayValue` is absent); nothing to
  re-verify on any other finalized component. Wired for Heading's own `size` control:
  `resolveDisplayValue: (args) => defaultSizeForLevel[args.level]`, reusing the exact mapping
  `Heading.tsx` uses internally (newly exported, package-internal only, not from the public barrel)
  rather than duplicating it. `size`'s control now shows the size `level` actually resolves to
  (e.g. `"xl"` at `level={5}`) instead of "Choose option…", live-verified by changing `level` and
  reading the control's own displayed text plus the canvas's real class name — while the underlying
  `size` arg stays genuinely `undefined` until explicitly touched, so the level→size fallback this
  Playground exists to demonstrate is unaffected.

Self-re-verified: `tsc --noEmit` (both the package and `.storybook` configs), `eslint`, full Vitest
suite (983 tests package-wide, unchanged), and a real `pnpm build`. Visually re-verified live in
Storybook, Docs-page Playground: `size` control confirmed to track `level` (changed `level` to 5,
control showed "xl", canvas rendered `<h5>` with the `sizeXl` class); `truncate` confirmed genuinely
typeable (typed "3", canvas's `webkit-line-clamp` became "3"; cleared it, clamp returned to "none",
input genuinely empty afterward, not a placeholder button at any point).

**Third follow-up fix (same day, user-requested): the same `size`/`truncate` gaps on the *standalone*
Playground story (the native Storybook Controls tab, not the Docs-page embed), plus a real,
previously-unrelated font-loading bug surfaced along the way.**

- **`size` control on the standalone story now shows the resolved size instead of "Choose
  option…".** The Docs page's own `resolveDisplayValue` mechanism (second follow-up above) only
  exists inside the custom `PlaygroundControls` block, which depends on `DocsContext` — unavailable
  outside an MDX Docs page, so it can't reach the native per-story Controls tab at all. Fixed
  differently there: the `Playground` story's own `render` now uses `useArgs()` (`storybook/
  preview-api`, already an established pattern via `Backdrop.stories.tsx`) to write a *real*
  `size` arg equal to `defaultSizeForLevel[level]` whenever `level` changes — but only while `size`
  still equals the last value this same sync wrote, so an explicit user pick sticks instead of
  being silently overwritten on the next `level` change. Live-verified: default state shows "4xl"
  (not blank); changing `level` to 6 updates it to "lg"; manually picking "xs" then changing `level`
  again leaves it at "xs" instead of resyncing. Accepted, documented edge case: if a user's manual
  pick happens to exactly match what the sync had already set, the next `level` change treats it as
  still-automatic and resyncs it anyway — nothing in `args` distinguishes "auto-set" from
  "coincidentally re-picked the same value" beyond this heuristic.
- **`truncate` still shows "Set number" on the standalone story — not fixable without replacing
  Storybook's own native Controls addon.** Confirmed there's no equivalent path here: unlike `size`
  above, the native `<select>`/`NumberControl` widgets are Storybook's own vanilla components with
  no per-instance custom-render hook, and `PlaygroundControls` itself can't run outside a Docs page
  (it needs `DocsContext`). The Docs-page Playground already provides the genuinely-empty,
  always-live number field asked for; this is a real, accepted limitation of the secondary,
  native-only surface specifically, not something left unfixed by oversight.
- **Found and fixed a real, unrelated bug while investigating: neither Nunito nor Lora were ever
  actually loaded as web fonts anywhere in this project.** The reported symptom ("weight updates for
  primary but not secondary") traces to this — confirmed via `grep` (zero `@font-face`/Google-Fonts
  references in the whole repo) and via `document.fonts`/network inspection in a live browser (only
  Storybook's own unrelated manager-chrome font was present). Every component using
  `fontFamily="secondary"` has been silently rendering the browser's own fallback (`Georgia, serif`)
  the entire time — most fallback sans-serif stacks carry real distinct weight faces, but a fallback
  serif like Georgia traditionally ships only regular/bold, which is what made the weight difference
  disappear specifically for `secondary`. Fixed by adding `.storybook/preview-head.html`, loading
  real Nunito and Lora at all 4 weights the `weight` prop offers (400/500/600/700) via Google Fonts
  — Storybook-preview-only, matching every other Storybook-only asset's own category (`07` §8); a
  real published-package consumer still needs to load these fonts themselves, or accept the
  fallback stack, which this fix doesn't change or decide. Confirmed both font families now load
  (network fetch of the actual `@font-face` rules, `document.fonts` listing real Nunito/Lora entries
  at all 4 weights) and that `weight` now visibly changes rendered text for `fontFamily="secondary"`
  in this browser.
  **Caveat, disclosed rather than silently resolved:** while verifying the *exact* visual result of
  each individual weight step, the specific browser this session tests in showed one weight per
  font family (not consistently the same one — "medium" for Lora, "bold" for Nunito, in two separate
  test runs) rendering at a width inconsistent with a smooth progression, despite `getComputedStyle`
  correctly reporting the requested weight/font-family throughout. This pattern (a single
  unpredictable step, not a consistent one, and not tied to font-family vs. its own fallback) is
  most consistent with a variable-font weight-axis rendering quirk specific to this sandboxed test
  browser, not a real defect in the fix or the component — but it wasn't fully root-caused, so
  flagged here rather than asserted as resolved. Worth a quick visual double-check in a normal
  desktop browser (all 4 weights, both font families) before this is treated as fully closed.

Self-re-verified: `tsc --noEmit`, `eslint`, full Vitest suite (983 tests package-wide, unchanged —
this pass touched Storybook tooling only), and a real `pnpm build`.

**Fourth follow-up fix (same day, user-reported with a screenshot): three real bugs in the third
follow-up's own work, found by testing what it actually claimed rather than trusting the earlier
verification.**

- **The `size`-tracks-`level` fix from the third follow-up was genuinely broken, reproduced.**
  Root cause confirmed: the `useRef`-based "was this value the one I last auto-set" heuristic has
  no guaranteed lifetime — the moment the story's component instance is recreated for any reason
  (an HMR reload is the most common one, but not the only one) while `args.size` already holds a
  previously-auto-set value, the fresh `ref` comes back empty, the check reads the existing value
  as "the user must have picked this," and the sync permanently stops re-firing with no visible
  error. Fixed by removing the ref-based tracking entirely: changing `level` now unconditionally
  re-snaps `size` to that level's own default. This trades away "a manually-picked `size` survives
  a *later* `level` change" — `size` set independently still works as long as `level` isn't touched
  again afterward, and "Size set independently of level" is the dedicated, always-correct demo of
  that combination — for a sync that cannot silently wedge itself off, which matters more. Verified
  by changing `level` through several different values in one session (not just once, which is what
  let the original bug pass its own verification) and confirming both the control and the canvas's
  real class name update correctly every time.
- **`truncate` still showed "Set string" after switching its control to `text` — the control *type*
  was never the actual variable.** Verified directly: a `text` control with an `undefined` value
  gates on Storybook's "Set X" boundary button exactly the same as a `number` control does — the
  prior finding blamed the control type without checking a text control with a genuinely-unset
  value first. The real fix is pairing `text` with a real `""` starting arg (a defined value, so
  neither surface's gate applies) rather than `undefined` — `parseTruncateArg` (already added) reads
  `""` back as "no truncation," so the component's own real prop is unaffected. Verified: the
  control renders as a real, empty, always-live text field on both the native Controls tab and the
  Docs-page Playground; typing "2" applies `webkit-line-clamp: 2` live; clearing it removes
  truncation and leaves the field genuinely empty, not reset to a placeholder button.
- **`as` was reported as "not interactive" — confirmed it was never actually broken.** Set `as=div`
  directly via a Storybook URL arg (bypassing the control entirely, to test the underlying
  mechanism in isolation) and confirmed the real, styled heading element does render as a `<div>`
  with `role="heading"` and the correct `aria-level` — the wiring was always correct. The perceived
  "not interactive" almost certainly comes from `div`/`span`/`p` rendering visually identically at
  matched styling, so toggling the control produces no eye-visible change without opening devtools.
  Disabled its control in the Playground per direct request (`control: false`, matching `id`/
  `className`/`style`/`data-testid`'s existing treatment) — `as` stays fully live, with its effect
  made actually visible via a card background, on the dedicated "Polymorphic: as=..." story.

Self-re-verified: `tsc --noEmit`, `eslint`, full Vitest suite (983 tests package-wide, unchanged),
and a real `pnpm build`. Visually re-verified live in Storybook — native Controls tab and Docs-page
Playground both — everything in this entry above, plus a fresh full-server restart before testing
(not just a hot-reloaded session) specifically to rule out the exact class of stale-instance bug
the `size` fix above was root-caused to.

**Fifth follow-up fix (same day, user-requested): the `size`-tracks-`level` fix extended to every
other story with a live `level`, a Truncate-story-specific display bug, and a spacing gap in the
Font family gallery.**

- **`size` showed "Choose option…" on `Default`, `Font family`, `Text alignment`, `Line-wrapping`,
  `truncate`, and `Narrow viewport`** — the unconditional sync added to the `Playground` story in
  the fourth follow-up was Playground-only; every other story with a live (or fixed-but-real)
  `level` still had no equivalent. Extracted the sync into a shared `useSyncSizeToLevel(level)` hook
  (`06-engineering-standards.md` §1's DRY rule — identical logic now needed in six places, not one)
  and applied it: via the meta-level fallback `render` for `Default`/`Narrow viewport` (both rely on
  it, having no `render` of their own), and directly in `Font family`/`Text alignment`/
  `Line-wrapping`/`truncate`'s own `render` functions. Verified on all six: each story's `size`
  control now shows the size its own current `level` actually resolves to.
- **`truncate` (the story) showed an empty input despite `args.truncate` being set to `2`.** Real,
  confirmed bug: that story's own control is `text`-typed, and a `text` control only displays
  `typeof value === "string"` values — the literal number `2` fails that check and renders as
  empty, even though the canvas was rendering the clamp correctly the whole time (same
  string-vs-number display mismatch already documented for `truncate`'s own argType, just not
  applied to this specific story's `args` yet). Fixed by setting `args.truncate` to the string
  `"2"` instead — `parseTruncateArg` already normalizes either shape back to a real number for the
  component itself, so nothing about the actual rendered output changed, only the control's own
  display.
- **Added visible spacing between the two `Font family` gallery instances.** They were two
  `Heading`s back to back inside a bare Fragment — `Heading` itself sets `margin: 0`, so nothing
  separated them. Wrapped in this system's own `Stack` (`gap={4}`, i.e. `space.4`/16px) rather than
  a manual `margin`/`gap` style, matching `Divider.stories.tsx`'s own established use of `Stack` for
  exactly this kind of gallery spacing. Verified live via `getBoundingClientRect()`: a real 16px gap
  between the first heading's bottom edge and the second's top edge (was 0).

Self-re-verified: `tsc --noEmit`, `eslint`, full Vitest suite (983 tests package-wide, unchanged —
Storybook-only changes), and a real `pnpm build`. Visually re-verified live in Storybook (native
Controls tab) on all six affected stories plus the Docs page's own embedded Canvas for each.

**Sixth follow-up fix (same day, user-reported): a real CSS specificity bug in shared Docs
infrastructure, not a control-wiring issue — Heading is the first component whose own rendered
output collided with it.**

- **User-reported symptoms, all from one root cause:** on the Docs page specifically (not the
  standalone story), changing `level` correctly updated the `size` control but the canvas's actual
  font size didn't match; some rendered headings had a bottom border and some didn't; and — echoing
  the "font weight doesn't update" report from an earlier turn, but this time on the Docs page,
  where it turned out to be a *different* bug wearing the same symptom — `weight` appeared inert for
  both font families there.
- **Root cause, confirmed via the actual cascade, not assumed:** `.storybook/docs.css`'s
  `.sbdocs-content h1/h2/h3` rules exist to style the MDX page's own `##`/`###` prose section
  headings ("Playground", "Properties", etc.) — but their selector is a plain descendant combinator,
  which also matches any *real* `<h1>`-`<h3>` a story renders inside its embedded Canvas, at
  (0,1,1) specificity — higher than any single-class rule a component's own CSS Module can produce
  (e.g. Heading's `._size4xl_...` at (0,1,0)). Every other component's Docs page was unaffected
  simply because no other component's own rendered output happens to be a real semantic heading
  element — Heading is the first one where this collision was even possible. Confirmed directly:
  an actual `<h2 class="_size4xl_...">` inside the Playground's Canvas computed to this rule's
  `font-size.2xl`/bold/bordered instead of its own class's real values — explaining the font-size
  mismatch, the inconsistent borders (any instance that happened to render as `h1`/`h2`/`h3` got
  one; `h4`/`h5`/`h6` never matched the selector at all, hence "some have it, some don't"), and the
  apparent dead `weight` control (the rule hardcodes `font-weight: bold`, unconditionally, so
  nothing the control did to a `level={2}`-default instance could ever show).
- **Fixed by scoping all three rules to exclude anything inside `.sbdocs-preview`** (addon-docs' own
  stable wrapper around every embedded Canvas, confirmed via the rendered DOM) —
  `.sbdocs-content h2:not(.sbdocs-preview h2)`, and the equivalent for `h1`/`h3`. `:not()`'s
  specificity is that of its own argument, so this is *more* specific than before for genuine prose
  headings (still wins, confirmed unaffected on both Heading's own prose sections and, spot-checked,
  Blockquote's Docs page) while not matching at all for anything nested inside a Canvas, regardless
  of how many wrapper elements a real component's own render nests it under.

Self-re-verified: `tsc --noEmit`, `eslint`, full Vitest suite (983 tests package-wide, unchanged —
a Storybook-CSS-only fix), and a real `pnpm build`. Visually re-verified live in Storybook: the
Playground's default `<h2>` now computes to the real `4xl` size with no border; changing `weight`
now visibly changes it for both font families; a `level={3}` instance in the "All levels" gallery
now shows its own real size/color/weight instead of the docs-chrome's forced `md`/`text.secondary`/
`semibold`; and the actual prose "Properties"/"Import" section headings are confirmed still styled
correctly (own `2xl`/bordered and `md`/`text.secondary` treatment intact), both on Heading's own
Docs page and, spot-checked on a second component (Blockquote), unaffected elsewhere.

**Final review pass (same day, before finalizing):** re-read every file fresh (`Heading.tsx`,
`.types.ts`, `.module.css`, `.stories.tsx`, `.test.tsx`, `.mdx`, `index.ts`) rather than trusting
the incremental follow-ups above to have left everything consistent, and re-ran the full
`06-engineering-standards.md` §9 checklist end to end.

**Fixed:** `index.ts` only re-exported `HeadingLevel`, `HeadingProps`, `HeadingSize` —
`HeadingAlign` and `HeadingWrap` (both added during the original pass) were never wired into the
barrel file, so neither was actually reachable from `@dbm-design-system/components`'s public API
despite being real, referenced, JSDoc'd prop types — the exact same gap already documented for
Divider's own review, now a confirmed second instance. Confirmed via a real `tsup` build before the
fix (both types absent from `dist/index.d.ts`) and after (both present, `grep` count of 5
occurrences across the declaration file).

**Checked, no defect found:**
- Full checklist re-verified top to bottom: `forwardRef`, `className`/`style`/`id`/`data-testid`
  redeclared, `{...props}` ordering, zero hardcoded values, SSR safety, TypeScript strict/no `any`,
  JSDoc complete on the component and all 14 props.
- Live-verified across both brands × both modes (not just one, and not just the Playground's
  default state): `purple-light` and `emerald-dark` explicitly checked — color, font-size, and
  border-bottom (the sixth follow-up's own fix) all correct in both.
- Mobile viewport (375px): confirmed zero horizontal overflow across the *entire* Docs page (not
  just spot-checked sections), the page title correctly fits without wrapping, and the
  `NarrowViewport` story's own heading genuinely wraps (`scrollWidth` > its own rendered width, not
  overflowing the viewport).
- Properties table re-confirmed complete: all 14 rows present, correct order, every description
  populated, sensible defaults shown (`level`/`weight`/`color`/`fontFamily` show their real
  defaults; `size`/`align`/`wrap`/`truncate`/`as`/escape-hatches correctly show "—").
- `check-component-bundle-size`: 1.37KB JS / 0.38KB CSS gzipped — comfortably within budget.
- Full Vitest suite (983 tests package-wide, unit project), `tsc --noEmit`, `eslint` (including
  `.storybook`), a real `pnpm build`, and the Foundations token-coverage check — all clean.

**Known, deliberately-deferred nice-to-have (not a defect, not blocking):** Radix Themes' `Heading`
also offers a `trim` prop (leading-trim, removing the extra space above/below text that a font's own
line-height reserves — the invisible padding from a font's ascent/descent/line-gap metrics, not
anything set in CSS, which is why text never sits perfectly flush against a border or icon without a
fudge-factor negative margin). Discussed directly with the user (2026-09-06) and declined for now.
Not added here — no other component in this system has it yet either, so adding it only to Heading
would be an isolated, inconsistent one-off rather than a system-wide convention.

If this gets picked up in a future pass, two real (not just cosmetic) pieces of work, not just prop
plumbing:
- **Real font-metrics work, not a copy of Radix's own numbers.** Radix's `trim` is pre-computed
  specifically for Inter, the one font they ship. DBM uses two different fonts (Nunito primary, Lora
  secondary), each with its own ascent/descent/line-gap metrics from its own font file's OS/2 table
  — the actual crop values have to be derived (or extracted via a tool like fontkit/opentype.js) per
  font, not assumed to transfer from Radix's own Inter-tuned values.
- **A scoping decision, not just a Heading-local one.** Leading-trim is a generic typography concern
  — `Text` would reasonably want the same prop eventually, using the same per-font metrics. Adding
  it to `Heading` alone now, ahead of `Text`'s own review, means either a real API inconsistency
  between the two siblings until `Text` catches up, or doing both together at that point instead.

Finalized 2026-09-06.

**Post-finalization addition (2026-09-07, at explicit request): implemented `trim`.** Authorized
directly (per `06-engineering-standards.md`'s finalized-component rule) after the effort/scoping
discussion above. Applying that same doc's three-question test for whether an authorized change
reopens finalized status: purely additive — no existing prop's default or rendered output under an
unchanged value changed — so **stays finalized**, with this addition getting its own scoped
mini-pass rather than a full re-run.

- **`trim?: "start" | "end" | "both"`** — leading-trim, unset by default. Two-layer implementation,
  in this order: (1) a pre-calculated negative-margin fallback, always applied; (2) the native CSS
  `text-box-trim`/`text-box-edge` properties, gated behind `@supports (text-box-trim: trim-start)`
  (and the `trim-end`/`trim-both` equivalents) — where supported, this *also* zeroes the fallback
  margin so the two don't stack and over-trim. Verified current support before writing the
  `@supports` query rather than assuming (Chrome/Edge 133+, Safari 18.2+, not yet Firefox, as of
  2026-09-07) — confirmed via web search, not from training-data memory, since this is a genuinely
  still-stabilizing CSS feature.
- **Real, empirically-measured font metrics, not estimated ones.** Used Canvas `TextMetrics` in a
  live browser against the actual loaded Nunito/Lora webfonts (`fontBoundingBoxAscent`/`Descent`
  minus a capital letter's own `actualBoundingBoxAscent`, at a 100px reference size) rather than
  publishing guessed values — confirmed consistent between weight 400 and 700 for each family before
  computing a single pair of ratios per family. Values: Nunito (`fontFamily="primary"`) `-0.30em`
  start / `-0.35em` end; Lora (`fontFamily="secondary"`, default) `-0.31em` start / `-0.27em` end.
  **Verified live, not just computed:** applied the calculated margins to real rendered text in the
  actual browser and confirmed via `getBoundingClientRect()` before/after that the ink shifted by
  the expected pixel amount (17.84px measured vs. 17.85px expected for Nunito's top trim, 18.59px
  vs. 18.60px for Lora's) — the arithmetic alone was not treated as sufficient proof.
- **New component-layer token file, `component/heading.json`** (`heading.trim.primary-start`/
  `-end`, `heading.trim.secondary-start`/`-end`) — the fallback margins have no home on any existing
  primitive scale (they're derived from font metrics, not a design/pixel grid), matching the
  established Avatar/Badge/IconButton/Indicators precedent for exactly this situation. Documented in
  `03-token-system-spec.md`'s "Component-layer tokens" section. CSS architecture: each
  `fontFamilyClass` sets local `--heading-trim-start`/`--heading-trim-end` custom properties from
  the matching global tokens, so `.trimStart`/`.trimEnd`/`.trimBoth` can reference one generic pair
  regardless of which font family is also applied, rather than needing a combinatorial class per
  font-family-times-trim-value pairing.
- **Real gap found and fixed in the test suite while writing trim's own tests, not just for this
  prop:** confirmed via direct experimentation that jsdom's `getComputedStyle` does not reliably
  resolve `margin-block-start`/`-end` (logical properties) the way it resolves `text-align`/
  `text-wrap` — a `toHaveStyle({ marginBlockStart: ... })` assertion produced a false negative even
  against the exact literal value the CSS Module declares. Worked around by asserting the applied
  CSS Module class instead (which is what the component's own logic is actually responsible for);
  the real, resolved margin behavior is what got verified live in an actual browser instead, per the
  bullet above. Left a comment on the test itself explaining why, so a future contributor doesn't
  try the "obvious" `toHaveStyle` approach on a similar logical-property case and hit the same false
  negative without knowing why.
- Docs page: new "Leading-trim" Variants section, a Usage guidelines Do/Don't pair, a Best practices
  note, an Accessibility note (purely visual, no AT impact), a code example, and the four new
  `TokenRow` entries with a note that the tokens are the fallback path only — the native property,
  where supported, doesn't consume them at all.
- Tests: 31 → 33 (default renders no trim class; `start`/`end`/`both` each apply their own class).

**Follow-up (2026-09-07, same day, at explicit request): Trim story layout revised.** Original story
showed only 2 rows (unset vs `both`) on `bg.brand-subtle`, which was functionally correct but read as
too subtle in a screenshot. Rewrote to show all 4 states (unset/`start`/`end`/`both`), each as its
own labeled row in a `Stack gap={8}`, on `bg.canvas` (clearly visible box edges), with placeholder
text changed from `"Hgy"` to `"Typography"`. Verified live in both the standalone story and the Docs
page embed (`<Canvas of={HeadingStories.Trim} />` — no separate Docs-page change needed, it reflects
the story automatically): all 4 rows render with correct labels and text, background resolves to
`rgb(240, 240, 243)` consistently across rows, and consecutive rows have ~58-64px of clearance with
no overlap. Purely a demo-presentation change — no prop, token, or component code touched — so
doesn't reopen finalized status any more than the trim addition itself did.

Self-verified: `tsc --noEmit`, `eslint` (including `.storybook`), full Vitest suite (985 tests
package-wide, unit project), a real `pnpm build` (confirmed `HeadingTrim` now appears in the public
`dist/index.d.ts`), and a real `pnpm --filter @dbm-design-system/tokens build` (confirmed the four
new `--dbm-heading-trim-*` custom properties are generated). `check-component-bundle-size`: 1.42KB
JS / 0.54KB CSS gzipped (up from 1.37KB/0.38KB, still comfortably within budget) — measured via a
direct reproduction of the check script's own build logic rather than the script itself, which
failed with an unrelated, pre-existing error (`Affix` build output missing) reproducible even after
clearing its cache; the identical build logic run directly, byte-for-byte, succeeded for all 50
components including `Affix` and `Heading`, so this reads as flakiness in the script's own
invocation in this environment, not a real defect in any component — flagged for a separate look,
not blocking this addition. Visually re-verified live in Storybook: native `text-box-trim` confirmed
active in a real supporting browser (`text-box-trim: trim-both` in computed style, fallback margin
correctly zeroed to avoid double-trimming); the underlying fallback custom-property chain confirmed
resolving to the correct per-font values in that same real browser (unlike jsdom, which does not
resolve it — see the test-suite finding above); the Trim gallery story's own box height measurably
shrinks between untrimmed and `trim="both"` instances.
