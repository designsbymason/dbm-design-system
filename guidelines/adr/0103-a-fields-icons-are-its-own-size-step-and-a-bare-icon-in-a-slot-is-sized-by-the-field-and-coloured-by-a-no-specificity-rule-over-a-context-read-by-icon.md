# 0103 — A field's icons are its own size step, and a bare Icon in a slot is sized by the field and coloured by a no-specificity rule, over a context read by `Icon`

**Status:** Accepted · **Date:** 2026-10-19

## Context
The fields in the `Input` family drew their in-field icons one step below the field's `size`, and a consumer's `<Icon>` in `prefix` or `suffix` was drawn as written, so it did not follow the field's size (the "With prefix icon" story fixed it at `sm` and showed no change). The maintainer asked for the icons to match the field's step, and for the decorative ones to read quieter than the controls beside them. `05-component-api-conventions.md` §3 says a component that configures the atoms inside it does so through a context the atom reads, not `cloneElement`.

## Decision
- **The icons a field draws itself are its own step:** `xs` 12px, `sm` 16px, `md` 20px, `lg` 24px, `xl` 32px (the `icon-size` scale), for the clear, show/hide, caret, calendar, clock, search, pencil and loading icons of `Input`, `SearchInput`, `PasswordInput`, `Combobox`, `Textarea`, `Select`, `DatePicker`, `TimePicker`, `TagsInput` and `EditableText`. The button round an icon keeps the field's height by a compensating negative margin (and, at `lg` and `xl`, less padding), and a slot or caret takes no height of its own, so a larger icon never makes a field taller. `NumberInput`'s stacked stepper carets stay as they were: they share one line of text and cannot take a larger icon.
- **A bare `<Icon>` passed as `prefix` or `suffix` with no `size` is sized by `Input`** (`cloneElement` of its `size` only, when the child is an `Icon` with no size of its own). An icon that sets a size, wrapped content and text are drawn as written.
- **Decorative icons are `icon.secondary`; clickable ones and text in a slot stay `icon.default`.** A no-specificity rule (`:where(.affix > svg)`) colours a direct-child svg in a slot, so an `Icon`'s own `tone` still wins and an icon inside a button is untouched. Contrast, computed from the primitives: 3.25:1 on the light surface and 4.34:1 on the dark, 3.12:1 / 3.10:1 on `bg.neutral-subtle`.

## Alternatives considered
- **A size context that `Icon` reads, as `ButtonGroup`'s is read by `Button`.** The rule's own choice for a molecule configuring its atoms. Rejected here: `Icon` is a Finalized atom used everywhere, its `size` has a destructuring default of `md` (so a context could not tell an explicit `md` from none, the cost §3 describes), and the case is one atom reading its own slot, not a molecule configuring parts it owns. The `cloneElement` is narrow (one prop, one element type, nothing to override) and can be replaced by a context later without changing what a consumer writes.
- **Size the slot's svg by CSS** (`.affix svg { width }`). Rejected: it would also override an `Icon` that sets its own `size`.
- **`icon.secondary` for every in-field icon.** Rejected: 2.86:1 / 2.12:1 on `bg.neutral-subtle-hover`, and about 3.1:1 on a clear button's hover tint reads weak for a control.

## Consequences
- A consumer's unsized `<Icon>` in a slot now scales with the field; one wrapped in an element does not, and the Docs say so.
- `05` §6's rule for icons in a field names both colours and the size rule.
- A real-browser check (`Input.checks.stories.tsx`) measures the icons, the field's height and the buttons' place at every size, and the computed colours.

## Related
ADR-0025 (the context pattern); `component-reviews/Input.md`, `SearchInput.md`, `PasswordInput.md`, `NumberInput.md`, `Combobox.md`, `Textarea.md`, `Select.md`, `DatePicker.md`, `TimePicker.md`, `TagsInput.md`, `EditableText.md`.
