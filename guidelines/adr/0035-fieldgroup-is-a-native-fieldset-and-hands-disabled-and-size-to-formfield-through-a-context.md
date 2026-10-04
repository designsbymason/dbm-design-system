# 0035 — `FieldGroup` is a native `<fieldset>` and hands `disabled` and `size` to `FormField` through a context

**Status:** Accepted · **Date:** 2026-10-04

## Context
`FieldGroup` names a set of related fields (an address, a date of birth) for assistive tech and lays them out. Two choices had real alternatives: what element carries the grouping, and how the group's `disabled` (and `size`) reach the `FormField`s inside it. `CheckboxGroup` and `RadioGroup` use `<div role="group">`, and `FormField` computes a field's own `disabled` from its own prop only.

## Decision
- **The element is a native `<fieldset>` with a `<legend>`.** It gives the strongest and most widely supported grouping semantics (including Safari with VoiceOver) and a native `disabled` that disables every native control inside. The legend is floated (`float: inline-start; inline-size: 100%`) so the browser treats it as an ordinary block inside the padding, not as the "rendered legend" that straddles the top border; the description and the fields `clear` it.
- **`disabled` and `size` reach `FormField` through an internal context** (`internal/fieldGroupContext.ts`, `null` outside a group), the same shape as `ButtonGroup`'s ([ADR-0025](./0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md)): a field's own `size` wins, `disabled` is OR-ed, and a nested group merges with its parent rather than replacing it. `FormField` changed additively: outside a group it behaves exactly as before.

## Alternatives considered
- **`<div role="group" aria-labelledby>`**, matching `CheckboxGroup`/`RadioGroup`: total styling freedom and no legend workarounds, but no native `disabled` propagation and weaker support. Rejected; the two sibling components are controls with their own name, where a `fieldset` would be heavier than needed.
- **Native `fieldset disabled` only, no context:** no change to `FormField`, but every native control becomes unclickable while each field's label and helper text stay full strength, so a disabled group looks only partly disabled.
- **`cloneElement` into the children:** rejected for the same reasons as in ADR-0015 and ADR-0025.

## Consequences
- A group can't take `aria-required` or `aria-invalid` (a group role supports neither); invalidity is shown by the border or accent and the announced group error.
- The legend CSS is specific to a `<fieldset>`: the floated legend, and `clear` (not a margin) on what follows it.
- `FormField` depends on the context, which lives in `internal/` and is not exported.

## Related
`05-component-api-conventions.md` §3 and §6; `04-component-inventory.md` (`FieldGroup`); [FieldGroup.md](../component-reviews/FieldGroup.md); [FormField.md](../component-reviews/FormField.md).
