# 0074 — `Form` reads the DOM for its values and the browser's rules, and calls the rules you write, over owning a value store or taking a schema library

**Status:** Accepted · **Date:** 2026-10-13

## Context
The inventory said `Form` is "context provider + validation wiring" and nothing more. Two things had to be decided before anything could be built: what the form knows about a field (does it hold values, or only find out at submit), and where a rule comes from (the browser, the caller's own functions, or a schema). Every control in the system already submits through a real or hidden native input (`TimePicker`, `Calendar`'s `name`, `EditableText`, `Checkbox`), and `FormField` takes its `error` as a prop. No form or validation library is approved ([02](../02-tech-stack-and-structure.md)), and any new runtime dependency has to be justified.

## Decision
- **The form owns no values.** A control keeps its own, as it does outside a form. On submit the form reads what the browser would send (`FormData`) and hands `onSubmit` a plain record by `name`, an array where a name repeats, plus the `FormData` itself and the event.
- **The DOM is the registry of controls.** At validation time the form walks `form.elements`, so any control participates, a plain `<input>` included, with nothing to opt into. The browser's constraint validation is read first (`required`, `type`, `pattern`, `minLength`… and the hidden validity inputs several controls already carry), and its message is the message.
- **Rules are functions the caller writes.** A field's own rule is `FormField`'s `validate(value, values)`; a rule across fields is the form's `validate(values)` returning messages by field name. The first message for a field wins in the order browser, field rule, form rule. No schema library: a schema is a function from values to messages, and a caller can wrap one in `validate` in two lines.
- **Errors go down by name through an internal context, and fields register themselves up through it.** `FormField` gains an optional `name` (handed back in `fieldProps` so the control is submitted under it) and `validate`, and reads `errors[name]` when no `error` prop is given. A registration carries the field's key, control id and label, which is what the summary's links and the first-invalid focus use. The context lives in `internal/`: a molecule may not import from the organism that provides it ([ADR-0035](./0035-fieldgroup-is-a-native-fieldset-and-hands-disabled-and-size-to-formfield-through-a-context.md) is the same shape).
- **`Form` reuses `FieldGroup`'s context for `disabled` and `size`**, merged with an outer group's, so a `FormField` has one place to read them from.
- **Errors can come from outside** (`errors`, a server's answer) and win over the form's own for a field. They are controlled-only: an edit to a field that has one asks for the object to use instead through `onErrorsChange`, and the form never changes the prop itself ([ADR-0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md)).

## Alternatives considered
- **The form holds the values** (controlled fields, a store, `register`/`watch`). Rejected: every control would have to be wired to it, so plain inputs and every future control would need an adapter, and it would be a second source of truth beside each control's own `value`/`onValueChange`.
- **A schema library behind the form.** Rejected: a dependency with its own API and release train for something a function covers. `validate` accepts a schema's output through a small wrapper.
- **Fields register in a context and the form reads only registered ones** (no DOM walk). Rejected: a control without a `FormField` would be invisible to validation and its browser rules ignored, so a submit could go through with an invalid native field.
- **`cloneElement` into the children.** Rejected for the reasons in [ADR-0015](./0015-formfield-render-prop-over-cloneelement-or-shared-context.md).

## Consequences
- Values are what the browser reports: a string, an array when a name repeats (a single ticked checkbox of a group is a string, not a one-item array), a `File` for a file input. Typing them is the caller's job.
- A `FormField` whose name no control is submitted under is a development warning (the control didn't spread `{...field}`).
- `FormField` stays Finalized: `name` and `validate` are new surface, absent outside a form, and nothing that existed renders or behaves differently.
- A control that has focusable parts and a hidden validity control (`TimePicker`) is focused through its field's control id, never the hidden input.

## Related
`04-component-inventory.md` (Form, FormField rows); [ADR-0015](./0015-formfield-render-prop-over-cloneelement-or-shared-context.md), [ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md), [ADR-0035](./0035-fieldgroup-is-a-native-fieldset-and-hands-disabled-and-size-to-formfield-through-a-context.md); [Form.md](../component-reviews/Form.md).
