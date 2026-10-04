# 0036 — A `FormField` hands its size to its control only inside a `FieldGroup` that sets one

**Status:** Accepted · **Date:** 2026-10-04

## Context
`FormField`'s `size` sizes its label only, deliberately: the render-prop API has the consumer author the control, so sizing it is one more explicit prop on that line ([ADR-0015](./0015-formfield-render-prop-over-cloneelement-or-shared-context.md)). `FieldGroup` has a `size` meant to size a whole set of fields, and with the label-only behaviour a consumer still had to repeat `size` on every control.

## Decision
`FormFieldControlProps` gains an optional `size`. It is present only when the field sits inside a `FieldGroup` that sets a `size` (the field's own `size` wins), and absent otherwise, so a field on its own, or in a group with no size, hands exactly what it did before. Spreading `{...fieldProps}` onto a design-system control then sizes it.

## Alternatives considered
- **Always hand `size`:** changes what `FormField size="lg"` does to every existing field, silently resizing controls, and puts a `size` attribute on native elements that spread the props (an `<input>` reads it as its own, numeric `size`). Rejected: it reopens a decision recorded as deliberate.
- **Controls read the group's size from a context** (as `Button` reads `ButtonGroup`'s, [ADR-0025](./0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md)): no change to the props `FormField` hands back, but every field-control atom would change, and many are Finalized.
- **Leave it to the consumer:** the status quo; `size` on the group would size only labels and the legend.

## Consequences
- Behaviour inside a group differs from outside it, which has to be said where the prop is documented (it is, on both components).
- A native element spread with `fieldProps` inside a group with a size reads `size` as its own attribute; the prop's JSDoc says to spread onto design-system controls.
- `FormField` stays Finalized: nothing that existed renders or behaves differently.

## Related
[ADR-0035](./0035-fieldgroup-is-a-native-fieldset-and-hands-disabled-and-size-to-formfield-through-a-context.md); `05-component-api-conventions.md` §3; [FieldGroup.md](../component-reviews/FieldGroup.md); [FormField.md](../component-reviews/FormField.md).
