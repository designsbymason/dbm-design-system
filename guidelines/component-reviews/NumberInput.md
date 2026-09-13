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
precedent (e.g. Mantine's own), without needing the event-synthesis trick option (B) would have
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

Not yet Finalized — awaiting explicit confirmation before marking it so, per
`06-engineering-standards.md` §9's own rule.
