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

Not yet finalized — pending confirmation.
