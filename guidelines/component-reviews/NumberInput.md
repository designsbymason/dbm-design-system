# NumberInput — Storybook/component review findings

**Inputs & Forms:** NumberInput — initial build + full `06-engineering-standards.md` §9 review pass
complete (2026-09-14), item 5 in the itemized molecule-tier build order
(`04-component-inventory.md`), the second of the three thin `Input`-wrapping molecules
(`PasswordInput`, `NumberInput`, `SearchInput`).

**Architecture decision (asked, not guessed) — value/onChange typed as real numbers, not strings.**
Unlike `PasswordInput` (kept `value`/`onChange` exactly string-typed, matching `Input`'s own native
passthrough with zero deviation), `NumberInput`'s stepper buttons need real number arithmetic to
compute the next value — the actual question was whether that arithmetic stays internal (public API
stays string-based, matching `Input` exactly) or becomes the component's own public contract.
Presented both real options rather than assuming: (A) `value?: number` / `onValueChange?: (value:
number | undefined) => void` as a dedicated callback, with the raw native `onChange` (string-based)
kept available separately for anyone who wants it; (B) `value?: string` / `onChange` with the exact
same signature `Input` already has, where the stepper buttons would need to synthesize a real native
`input` event (bypassing React's own value-tracking via the native property setter, then dispatching
a real event) to feed back through that same `onChange` typing already uses, rather than exposing a
second callback. **User chose (A)** — matches how developers actually think about a number field
(`min`/`max`/`step` are just number math, no parsing) and matches production `NumberInput`
precedent in comparable production libraries, without needing the event-synthesis trick option (B) would have
required. `onChange` still exists, documented as firing only on direct typing, not stepper/clear
clicks — a real, disclosed limitation of choice (A), not a bug.

**Two more real, load-bearing implementation decisions, both worth recording:**
- **Typing isn't force-clamped to `min`/`max` in JS; only the stepper buttons clamp.** `min`/`max`
  pass straight through as real native HTML5 validation attributes (free browser-level constraint
  validation) — but rewriting a user's in-progress typed value the moment it goes out of range would
  be jarring and would make typing "15" impossible one digit at a time if "1" already got force-
  corrected. Matches a native `<input type="number">`'s own unopinionated typing behavior exactly.
- **Floating-point rounding.** Repeated stepper clicks with a decimal `step` (`0.1 + 0.1 + 0.1`)
  drift to values like `0.30000000000000004` via plain JS arithmetic — `decimalPlacesOf(step)`
  derives how many decimals `step` itself implies, and every clamped result is rounded back to that
  precision. Verified with a dedicated regression test (three `+0.1` clicks land on exactly `0.3`,
  not a drifted value).

**Real CSS bug found and fixed during the build itself, before first live-verification: the stepper
buttons rendered as ~2px-tall slivers.** First attempt used `align-self: stretch` on the stepper
container, reasoning (by analogy with `Input`'s own `.clear` button and `PasswordInput`'s own
`.toggle`) that it would let the two-button stack fill the row and grow `.wrapper` to fit. Live
inspection (`getBoundingClientRect` on the actual rendered buttons, not just reading the CSS)
proved that assumption wrong: `align-self: stretch` conforms an item to whatever cross-axis size its
container *already has* — it does not make the container grow to fit the item. With nothing else in
the row establishing a real height, the stepper (and its parent `.affix` span) collapsed to a
near-zero height, and each button rendered at ~2px tall — technically clickable (button positions
still correct), but not a real, usable stepper. **A single-click sanity test with `screenshot`-only
verification would have missed this entirely** — every automated test (`unit` and `storybook`
projects alike) already passed against the broken CSS, since DOM queries and click handlers don't
check rendered pixel dimensions. Fixed by giving the stepper container an explicit `2.2em` height
(relative to the already-cascading per-size `font-size`, so it scales with `size` without five
duplicated per-step values) — this genuinely grows `.wrapper` taller to fit two real, comfortably-
sized buttons, a deliberate, disclosed departure from the "never inflate the row" constraint
`.clear`/`.toggle` were built around, appropriate here since a two-button stepper has no way to fit
inside a single-line row's own height without one. Reconfirmed live via direct `getBoundingClientRect`
measurement after the fix (each button ~17.6px tall at `size="md"`) before trusting a screenshot.

**Molecule composition checkpoints (`06-engineering-standards.md` §9):**
- **Compound-component sub-part completeness** — not applicable; flat props, no sub-parts.
- **Atom-reuse audit** — composes `Input` and `Icon` directly; no reimplementation of either.
- **Consumed-atom defect handling** — none found; `Input` needed no changes.
- **Radix-primitive prop audit** — not applicable; wraps `Input` (itself no Radix primitive).
- **Cross-part ARIA/id wiring** — not applicable in `FormField`'s sense (a single control, not a
  label/control/helper-text triad).
- **Composed tab order** — verified real: `Tab` reaches the native input, then the increment
  button, then the decrement button, then — if `onClear` is set and there's a value — the clear
  button after that, matching `PasswordInput`'s own layering (its slot content, then the separate
  clear-button render path).

**Feature scope, deliberately narrower than `PasswordInput`'s own prop surface.**
`maxLength`/`showCount`/`minLength`/`pattern` are all omitted — confirmed by checking the HTML
spec, none of the four have any effect on `<input type="number">` in real browsers (they're
text-length/regex concepts that don't apply to a numeric value), unlike `PasswordInput`'s
`type="password"`, which is still text-like and genuinely supports all four. Including them here
would have been dead, misleading API surface.

**Self-verification, all real runs:**
- `tsc --noEmit` (package + `.storybook`): clean
- `eslint --max-warnings 0`: clean
- Vitest `unit` project: 1256/1256 whole package (`NumberInput` 22/22)
- Vitest `storybook` (browser-mode play-function/a11y) project: 432/432 whole package
  (`NumberInput` 10/10, including all three interaction stories — `PASS`)
- `tsup` build: clean, all four output targets
- `check-component-bundle-size`: `NumberInput` 1.81KB JS / 1.08KB CSS gzipped, within budget
- `build-storybook` + `check-storybook-bundle-size`: clean, within budget
- Live-verified in a running Storybook instance: Docs page (all sections, Playground live —
  clicking the stepper visibly increments/decrements), `All sizes` (stepper buttons scale
  proportionally at every step, confirmed via direct DOM measurement, not just a screenshot),
  `Decimal step`/`With a clear button`/`Error state`/`Disabled` galleries, all three interaction
  stories replayed and confirmed `PASS`, zero Accessibility-panel violations, all 4 themes
  (Purple/Emerald × Light/Dark) — confirmed via the Docs page's own embedded `Canvas` blocks (the
  bare `/story/...` canvas route's own screenshot artifact, already diagnosed and documented as a
  session-local tooling quirk during `PasswordInput`'s own review, reproduced identically here —
  not re-litigated, the Docs-page embed already confirms the real rendering is correct)
- Confirmed sidebar placement: **Molecules → Inputs → NumberInput**, per the taxonomy in
  `07-storybook-and-documentation-standards.md` §3
- `FormField`'s own `RelatedCard` previews a bare `NumberInput` from the start (not a composed
  `FormField`) — applying the lesson from `PasswordInput`'s own post-review crop fix immediately,
  not repeating it a fifth time

**Post-review fix (user-reported, 2026-09-14): a `md`-size `NumberInput` was visibly taller than a
`md`-size `Input`.** The stepper's own height was a flat `2.2em`, deliberately larger than a plain
`Input`'s own single-line content height at every size step, on the reasoning that two stacked
buttons genuinely couldn't fit otherwise (see the "real CSS bug" entry above — that reasoning was
about *fitting the buttons at all*, not about whether exact height parity with `Input` was
achievable). Asked directly whether parity was possible, the honest answer was to actually compute
it rather than assume: `Input`'s own content height at each size is `font-size × line-height-tight`
(the identical formula `.clear`'s own per-size margin-block math already uses) — `sm` through `xl`
have real room to spare for two comfortably-sized buttons once each button's own horizontal-only
padding is trimmed from `.clear`'s/`.toggle`'s more generous (single-button) values; only `xs` is
genuinely tight (`~6.9px` per button against a `12px` icon). Rebuilt `.stepperXs`–`.stepperXl` to set
an explicit `height` via that same `calc(font-size × line-height-tight)` formula, composed from the
identical tokens `Input.module.css` itself uses — not a guessed pixel value — so `.wrapper` now
renders at `Input`'s own exact height at every step, confirmed by direct measurement
(`getBoundingClientRect`) showing byte-identical heights between a plain `Input` and a `NumberInput`
at every one of the five sizes (`29.80/39.32/42.40/54.41/59.31px`), not just visual inspection.
Live-checked `xs` specifically at Storybook's own 200% zoom (the tightest step, where the icon is
nominally larger than its own button box) — both carets stay visible and individually clickable,
confirmed via real click interaction, not just a screenshot. Full re-run: `tsc`, `eslint
--max-warnings 0`, Vitest `unit` (22/22) and `storybook` (10/10) — clean; zero Accessibility-panel
violations at every size, re-confirmed.

**Post-review fix (user-directed, 2026-09-14): stepper icons recolored from brand to neutral.**
Applied identically across this button, `Input`'s own `.clear`, and `PasswordInput`'s own `.toggle`
— see each component's own entry (both already Finalized, so each records this as an authorized
post-finalization change; `NumberInput` isn't Finalized yet, so it's recorded here as a plain
in-progress fix with no separate finalization-test formality needed). `.stepperButton`'s `color`
changed from `var(--dbm-icon-brand)` to `var(--dbm-icon-default)` (no explicit `tone` was ever set on
the stepper's own `Icon` calls — color always came from the button's own CSS `color` via inherited
`currentColor`, so only the CSS needed to change here, unlike `Input`/`PasswordInput` where the
`Icon`'s own `tone` prop also had to flip). `.stepperButton:hover:not(:disabled)`'s background
changed from `var(--dbm-bg-brand-subtle)` to `var(--dbm-bg-neutral-subtle)`. Verified across all 4
theme combinations (Purple/Emerald × Light/Dark) via direct CSSOM/token inspection in a running
Storybook instance — both tokens resolve identically between Purple and Emerald (neither is
brand-tinted) and correctly between Light/Dark per their own vetted contrast documentation in
`03-token-system-spec.md`. Zero Accessibility-panel violations reconfirmed post-change. Full re-run:
`tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest `unit` (1256/1256 whole package)
and `storybook` (432/432 whole package) — clean; `tsup` build and `check-component-bundle-size`
(`NumberInput` 1.82KB JS / 1.10KB CSS, still within budget) — clean.

**Scope note surfaced, not acted on (superseded):** the same `.clear:hover` pattern (still
`bg.brand-subtle`) was found to also exist on `Select.module.css` and `Textarea.module.css`,
outside this request's original named scope. Resolved the same day: the user extended the rule to
both, and it was formalized into a standing guideline (`05-component-api-conventions.md` §6 —
"icons used inside an input field use neutral colors") — see `Select.md`/`Textarea.md`'s own entries
for that follow-up change.

**Final review pass (2026-09-14, at explicit user request before finalization).** Re-read every file
fresh end to end (`NumberInput.tsx`, `NumberInput.types.ts`, `NumberInput.module.css`,
`NumberInput.stories.tsx`, `NumberInput.test.tsx`, `NumberInput.mdx`, `index.ts`) rather than assuming
the incremental build already covered everything. Found and fixed one real defect and several
documentation gaps:

1. **Real defect: `onClear` didn't actually clear the value in uncontrolled mode.** The original
   implementation passed `onClear` straight through to `Input`'s own `onClear` prop — which only ever
   fires the caller's callback and refocuses, since `Input` itself has no internal value of its own to
   clear. `NumberInput` does track its own value (`uncontrolledValue`), but nothing wired the clear
   button into that state, so clicking Clear on an uncontrolled field called the caller's callback and
   refocused, but the displayed number silently stayed put — directly contradicting this component's
   own JSDoc ("Called with the new value... whenever it changes, whether that's from typing, clicking
   the increment/decrement stepper, **or the clear button**"). Confirmed live with a throwaway test
   before touching any code (`defaultValue={5}`, click Clear, assert the field goes empty — it didn't).
   Neither the original unit test nor the original interaction story caught this, since both only
   asserted the callback fired and focus moved, never that the value itself changed — the same shape
   of gap `PasswordInput`'s own final review found for an untested Docs-page claim. Fixed by
   intercepting `onClear` inside `NumberInput` itself: a new `handleClear` calls `commit(undefined)` —
   the same path typing and the stepper already use — before calling the caller's own `onClear`, and
   only passes a handler to `Input` at all when the caller actually provided one (preserving the
   existing show/hide-via-`Boolean(onClear)` behavior). Since `commit` always calls `onValueChange`
   regardless of controlled state, this also means clearing now works correctly for controlled usage
   without the caller's own `onClear` needing to manage the value at all — simplified the `Clearable`
   story and the Docs page's own code example to match, and updated the `onClear` JSDoc (previously:
   "clearing the value... is the caller's responsibility" — no longer true) to describe it as a
   supplementary notification hook instead. Added regression coverage that would have caught the
   original bug: the existing clear-button unit test now also asserts the field goes empty, a new unit
   test covers the controlled case, and the `ClearButtonInteraction` story's own `play` function now
   asserts `toHaveValue(null)` after the click, not just that the callback fired.
2. **Missing test coverage: `size` reaching the stepper button/icon.** Same category of gap
   `PasswordInput`'s own final review found and fixed for its toggle — `stepperSizeClass`/
   `stepperIconSizeForInputSize` were wired correctly from the initial build, but nothing asserted
   either, including the `'md'` default. Added a test covering both the default and an explicit
   override, mirroring `PasswordInput.test.tsx`'s own equivalent test exactly.
3. **Stale/incomplete "Design tokens used" table.** Still cited `bg.brand-subtle`/`icon.brand` — the
   pre-recoloring tokens, missed when that change landed earlier the same day — and a `space.2` that
   isn't actually referenced anywhere in `NumberInput.module.css` (confirmed via a direct grep of every
   `--dbm-*` custom property the file uses). Fixed to `bg.neutral-subtle`/`icon.default`/`space.1`, and
   added a previously-undocumented row for the `font-size`/`line-height.tight` tokens the stepper
   container's own height-parity `calc()` uses (a real, load-bearing sizing decision with no row of its
   own before this).
4. **Same stale-token gap found and fixed in four already-Finalized components' own Docs pages** —
   `Input.mdx`, `PasswordInput.mdx`, `Textarea.mdx` (all still cited `bg.brand-subtle`/`icon.brand` for
   their own clear/toggle buttons) and `Select.mdx` (never had a dedicated row for its clear button or
   down-chevron icon color at all, pre-dating even the recoloring change). Treated as a direct,
   corrective follow-up to the already-authorized icon-recoloring change earlier the same session
   (doc-only, zero rendered-output change, matching the "stays Finalized, no new re-verification
   needed" branch of the three-question test) rather than a new change needing separate authorization
   — found only because this review's own token-table check happened to touch the same surface.
5. **Live-verification note, not a defect:** this component's own Docs page states as fact that "the
   browser's own Up/Down arrow-key stepping... appl[ies] automatically" on the underlying native
   `<input type="number">`. Attempted to confirm this live and got an inconclusive result — pressing
   the Up arrow key (via this session's browser-automation tooling) did not step the value, but the
   same result reproduced identically on a completely bare, non-component, freshly-injected native
   `<input type="number">` element with no React and no DBM code involved at all — ruling out a
   `NumberInput`-specific cause and pointing at a limitation of this session's specific automation
   environment instead (consistent with this project's own prior documented instances of
   browser-automation-tool artifacts, e.g. `Textarea`'s own final review). `NumberInput` adds no code
   on any path that could suppress or interfere with this native behavior, and `jsdom` doesn't
   implement it either, so it has no automated coverage in either direction. Not treating this as a
   confirmed defect, but flagging it plainly rather than either asserting the claim is confirmed or
   silently dropping the discrepancy.

No other gaps found — the controlled/uncontrolled value handling elsewhere, floating-point rounding,
min/max clamping, disabled/readOnly cascades, ref forwarding, every prop's passthrough to `Input`, and
every other story/example held up under a fresh read. Confirmed responsive at a 375px viewport
(`All sizes` story, all five steps full-width, no overflow/clipping). Full re-verification, whole
package: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest `unit` (1258/1258 whole
package; `NumberInput` 24/24) and `storybook` browser-mode (432/432 whole package; `NumberInput`
10/10) projects, `tsup` build, `check-component-bundle-size` (`NumberInput` 1.84KB JS / 1.10KB CSS,
still within budget), `build-storybook` + `check-storybook-bundle-size` — all clean. Live-reconfirmed
in Storybook: the clear button now actually empties the field (Purple Light, `With a clear button`
story), zero Accessibility-panel violations.

**Finalized 2026-09-14, at explicit user direction**, following the final review pass above. Per
`06-engineering-standards.md` §9's own rule, no further changes to `NumberInput` (code, stories,
docs, or tokens it alone drives) without asking first, even for something that would otherwise be an
obvious, in-scope fix. With `CheckboxGroup`, `Radio`/`RadioGroup`, `FormField`, `PasswordInput`, and
`NumberInput` (items 1–5) all Finalized, item 6 (`SearchInput`) is next.
