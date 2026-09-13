# CheckboxGroup — Storybook/component review findings

**Inputs & Forms:** CheckboxGroup — initial build + full `06-engineering-standards.md` §9 review
pass complete (2026-09-14), item 1 in the itemized molecule-tier build order
(`04-component-inventory.md`), built immediately after `Radio`/`RadioGroup` (skipped ahead of it
while those two were the session's priority).

**Architecture decision (asked, not guessed) — Radix has no group primitive for checkboxes at
all.** Unlike `Radio` (no standalone single-radio primitive, but a real `RadioGroup.Root` to build
around — [ADR-0014](../adr/0014-radio-self-wrapping-dual-mode-over-native-input-or-a-narrower-atom-bar.md)),
`Checkbox` is already a fully standalone Radix primitive with no group counterpart whatsoever —
confirmed by reading the installed `@radix-ui/react-checkbox` package, not assumed. Presented the
choice rather than guessing: build `CheckboxGroup`'s own array-based multi-select coordination from
scratch via context (mirroring `RadioGroup`'s composition pattern exactly, adapted for the missing
primitive), or some other shape entirely. **User chose "Context-based, mirroring RadioGroup
exactly."** Implemented as two new contexts consumed by the already-Finalized `Checkbox` (authorized
by this same choice, same authorization shape as `Radio`'s own size-cascade edit):
`CheckboxGroupContext` (carries the real coordination state — `value: string[]`,
`onItemCheckedChange`, `disabled`, `name`, `form` — unlike `RadioGroupContext`'s plain boolean
signal, since there's no Radix `Root` already doing this internally for `CheckboxGroup` to lean on)
and `CheckboxGroupSizeContext` (mirrors `RadioGroupSizeContext` exactly). Full three-question
finalization test applied to `Checkbox` (`06-engineering-standards.md` §9) — see
[Checkbox.md](Checkbox.md)'s own entry; **`Checkbox` stays Finalized**, purely additive (a real
label-disabled-via-cascade bug was caught and fixed within this same new-surface build, before any
release, so it doesn't change that classification).

**Molecule composition checkpoints (`06-engineering-standards.md` §9):**
- **Compound-component sub-part completeness** — not applicable, same reasoning as `RadioGroup`:
  plain `Checkbox` atoms as ordinary `children`, no dot-notation compound pattern.
- **Atom-reuse audit** — `CheckboxGroup` renders no checkbox-option markup of its own; every option
  is a real, consumer-supplied `Checkbox`.
- **Consumed-atom defect handling** — one real defect found and fixed (the label-disabled-via-group
  bug, see [Checkbox.md](Checkbox.md)), applying the three-question test rather than working around
  it inside `CheckboxGroup`'s own code.
- **Radix-primitive prop audit** — not applicable in `RadioGroup`'s sense (no wrapped Radix compound
  primitive here to audit props against — `CheckboxGroup` renders a plain `<div role="group">` it
  owns outright, not a Radix-rendered Root).
- **Cross-part ARIA/id wiring** — not applicable, same reasoning as `RadioGroup`: the group's own
  accessible name is left to the consumer (`aria-label`/`aria-labelledby`), no auto-rendered legend.
- **Composed tab order** — verified real, and genuinely different from `RadioGroup`'s: a checkbox
  group has no single composite widget or roving-tabindex behavior in the WAI-ARIA sense, so every
  `Checkbox` keeps its own independent `Tab` stop, exactly as if there were no group wrapper at all.
  Covered by a dedicated test and a live interaction story (`TabOrderInteraction`), not just
  reasoned about — this is also why `CheckboxGroup` has no `loop`/`dir`-driven arrow-key behavior at
  all, unlike `RadioGroup`'s `loop`/`dir` props (there's no roving focus for either to affect).

**Real ARIA finding, caught by the project's own linter, not assumed:** the group was first built
with `<div role="group" aria-invalid={hasError || undefined}>`, mirroring `RadioGroup`'s
`role="radiogroup"` pattern directly. `eslint-plugin-jsx-a11y`'s `role-supports-aria-props` rule
flagged it immediately: unlike `role="radiogroup"` (which the ARIA spec does list as supporting
`aria-invalid`), plain `role="group"` does not support it at all. Removed `aria-invalid` from the
rendered output rather than suppressing the lint rule — `hasError`'s left-border accent is now a
genuinely visual-only signal for this component, documented as such in `CheckboxGroup.types.ts`'s
own JSDoc, the stories file's `argTypes.description`, and the Docs page's Accessibility callout and
Usage guidelines ("Don't" list), rather than silently diverging from `RadioGroup`'s documented
behavior without saying so.

**Layout: `CheckboxGroup` owns the gap between options**, same values and reasoning as
`RadioGroup` (`space.2` vertical default, `space.2`/`space.4` row/column-gap horizontal with
`flex-wrap`) — deliberately identical, not reinvented, since there's no reason the two sibling
components should visually disagree.

**No `useControllableState`-style dependency added.** With no Radix `Root` to defer controlled/
uncontrolled resolution to, `CheckboxGroup` manages `value`/`defaultValue` itself — mirroring the
manual `isControlled = value !== undefined` / internal `useState` fallback / `effectiveValue`
pattern this codebase already established in `Select.tsx` (not Radix's own
`@radix-ui/react-use-controllable-state`, confirmed present only as a transitive dependency, not a
direct one — adding it as a direct dependency for a ~10-line pattern already written twice in this
codebase would violate the "every dependency must be justified" principle for no real benefit).

**Post-review fix (self-caught during the build, before first live-verification): `defaultValue`'s
Playground control silently sent the wrong type.** First-drafted `argTypes.defaultValue` used
`control: "check"` (Storybook's own multi-select array control type) — but this repo's own custom
`PlaygroundControls` block (`.storybook/blocks/PlaygroundControls.tsx`) only implements
`boolean`/`select`/`radio`/`number` widgets, falling back to a plain text `Input` for anything else,
including `"check"`. That fallback's `onChange` sends the raw string the user typed, not a
`string[]` — a real type mismatch that would have shipped a broken control, only caught by manually
opening the Docs page and clicking into the field (confirmed via live browser check, not just
reasoning about the code) rather than by `tsc` (Storybook args are loosely typed) or any automated
test. Fixed by setting `control: false` on `defaultValue` (same treatment `RadioGroup` already gives
`value`, for the same "no working widget for this shape" reason) — still driven per-story via
hardcoded values (`Playground`, `States`, `SizeCascade`, etc.), just not from the live panel.
Extending `PlaygroundControls` with a real multi-select widget was considered and deferred: it's
shared Storybook tooling every component's Docs page depends on, out of scope for a single
molecule's build, and no other component has needed it yet.

**Self-verification, both components, all real runs:**
- `tsc --noEmit` (package + `.storybook`): clean
- `eslint --max-warnings 0`: clean
- Vitest `unit` project: 1205/1205 whole package (`Checkbox` 36/36, `CheckboxGroup` 22/22)
- Vitest `storybook` (browser-mode play-function/a11y) project: 408/408 whole package
- `tsup` build: clean, all four output targets
- `check-component-bundle-size`: `CheckboxGroup` 0.72KB JS / 0.15KB CSS gzipped (in line with
  `RadioGroup`'s 0.67KB JS / 0.16KB CSS), `Checkbox` 1.63KB JS / 0.82KB CSS — both within budget
- `build-storybook` + `check-storybook-bundle-size`: clean, within budget
- Live-verified in a running Storybook instance: Docs page (all sections, Playground live —
  including the `defaultValue` fix above, confirmed no longer shown as a broken text field;
  Properties table), `Vertical vs. horizontal`/`States`/`Controlled, with a live selection summary`
  variant galleries, the toggle-independence and tab-order interaction stories both replayed and
  confirmed `PASS`, zero Accessibility-panel violations across every story checked (States: 16
  passes / 0 violations), all 4 themes (Purple/Emerald × Light/Dark) — checked-state colors, the
  error left-border accent, and both orientations all read correctly in every combination
- Confirmed sidebar placement: **Molecules → Inputs → CheckboxGroup**, per the taxonomy in
  `07-storybook-and-documentation-standards.md` §3

Not yet Finalized — awaiting explicit confirmation before marking it so, per
`06-engineering-standards.md` §9's own rule.
