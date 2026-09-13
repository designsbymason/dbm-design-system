# 0015 — `FormField` computes field props and hands them back via a render-prop `children`, over `cloneElement` injection or a shared context

**Status:** Accepted · **Date:** 2026-09-14

## Context

`06-engineering-standards.md` §9's "Cross-part ARIA/id wiring" checkpoint (added 2026-09-10) was
written in anticipation of `FormField` — a component composing a label, a control, and helper/error
text as genuinely separate pieces, needing the `id`/`aria-labelledby`/`aria-describedby`
relationships between them to be automatic and correct, not left to the consumer to hand-wire. No
existing pattern in this codebase solved that problem: `cloneElement` appears exactly twice
elsewhere (`Stack` adding a `key` to an interleaved divider, `Select.Option`'s `asChild` mode
appending hidden text), neither injecting `id`/`aria-*` props into an arbitrary child; the
context-based coordination already established for `Radio`/`RadioGroup` and `Checkbox`/
`CheckboxGroup` always scoped to one atom-molecule pair the atom was built to expect, not an
open-ended set of unrelated control atoms (`Input`, `Textarea`, `Checkbox`, `RadioGroup`,
`CheckboxGroup`, `Select`, and any future one). Every relevant atom's own JSDoc already said
"Composed by `FormField`... pair its `id`" — forward-looking language describing manual pairing,
written before this component existed, but not committing to any particular wiring mechanism.

## Decision

`FormField` never renders the control itself. It computes the ids and state a control needs and
hands them back as a plain object (`FormFieldControlProps`: `id`, `aria-labelledby`,
`aria-describedby?`, `hasError`, `disabled`, `required`) via a render-prop `children` function,
which the consumer spreads directly onto whatever control they author:

```tsx
<FormField label="Email address" helperText="We'll never share this" error={errors.email}>
  {(fieldProps) => <Input {...fieldProps} type="email" />}
</FormField>
```

`FieldLabel` gets both `htmlFor` (pointing at the control's own generated id, for the native
click-label-to-focus behavior on any natively labelable control) and its own `id` (so
`aria-labelledby` can reference it). The control's `aria-labelledby` is what actually establishes
the accessible name uniformly — `htmlFor` alone can't reach a container-role control (`RadioGroup`'s
`role="radiogroup"`, `CheckboxGroup`'s `role="group"` are plain `<div>`s, not natively labelable
elements), so relying on `aria-labelledby` for every control shape, rather than branching the
association mechanism per control type, is what makes one implementation correct for all of them.

Every control atom in this system already accepted this exact prop shape before `FormField` existed
— zero atoms needed any change.

## Alternatives considered

**Clone the control child via `cloneElement`**, injecting `id`/`aria-describedby` automatically
(Ant Design's `Form.Item` approach) — the closest thing to "just wrap it, no spreading needed."
Rejected: `cloneElement`'s ref-merging is a well-documented fragility (an injected `ref` competing
with whatever ref the child already carries), and it assumes exactly one valid element child —
break that assumption (a fragment, a component that doesn't forward props/refs correctly) and the
wiring silently fails with no error, for an ergonomics win that trades away verifiable correctness.

**A shared context every control atom opts into** (Chakra UI's `FormControl` approach) — mirrors
this codebase's own dominant coordination pattern elsewhere. Rejected for this specific case: unlike
`RadioGroup`/`CheckboxGroup` (each built to expect exactly one atom's own context), `FormField` has
to work with an open-ended, growing set of unrelated control atoms — this would mean an authorized
edit to every one of them now, and a permanent coupling every future control atom would have to
remember to add, rather than a contract satisfied automatically by already-conforming props.

Both alternatives were evaluated on ergonomics ("how little must the consumer do") rather than
correctness independent of effort — asked directly, and decided the other way: the render-prop's
real cost is that a consumer can forget to spread `fieldProps`, but that failure is visible (no
`id`, so the label never associates) and already caught by this project's own `jest-axe`/
Accessibility-panel checks at review time, not a silent runtime gap the other two approaches could
produce instead.

## Consequences

- **Standing contract for every control atom, present and future:** any atom meant to be composable
  inside a `FormField` must accept `id`, `aria-labelledby`, `aria-describedby`, `hasError`,
  `disabled`, and `required` in this exact shape — already true of every existing control atom
  (`Input`, `Textarea`, `Checkbox`, `Switch`, `RadioGroup`, `CheckboxGroup`, `Select`), and worth
  checking for on any new one.
- `FormField` itself renders no control markup of its own and can't validate that a consumer
  actually spread `fieldProps` — a missing spread is a real, catchable defect (caught by
  accessibility tooling), not a silent one, but it is possible to write.
- `helperText`/`error` are mutually exclusive by construction (`error`'s mere presence computes
  `hasError` and swaps which text atom renders) — there is no independent `hasError` boolean to
  desync from whether an error message is actually shown.
- Establishes render-prop `children` as a legitimate pattern in this codebase, alongside plain
  `ReactNode` children and the context-based coordination pattern — not a replacement for either,
  but the right tool specifically for "hand back computed props for an open-ended set of possible
  children to spread," distinct from both.

## Related

`guidelines/component-reviews/FormField.md` — the review pass this decision was made during.
`06-engineering-standards.md` §9 — the "Cross-part ARIA/id wiring" checkpoint this component exists
to satisfy.
`guidelines/adr/0014-radio-self-wrapping-dual-mode-over-native-input-or-a-narrower-atom-bar.md` —
the prior first-of-its-kind architecture fork this one follows the same "present real alternatives,
decide independent of effort" discipline from.
