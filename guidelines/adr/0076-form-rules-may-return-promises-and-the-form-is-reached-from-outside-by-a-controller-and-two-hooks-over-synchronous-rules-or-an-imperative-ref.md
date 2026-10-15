# 0076 — `Form` rules may return promises, a form-level error has its own part, and the form is reached from outside by a controller and two hooks, over synchronous rules and a bare form ref

**Status:** Accepted · **Date:** 2026-10-14

## Context
[ADR-0074](./0074-form-reads-the-dom-for-values-and-the-browsers-rules-and-calls-the-rules-you-write-over-a-value-store-or-a-schema-library.md) and [ADR-0075](./0075-form-shows-its-own-messages-and-moves-focus-to-the-first-invalid-control-and-announces-the-count-over-the-browsers-bubbles.md) made the form read the browser's rules and call the caller's. Using it showed four gaps: the browser's messages came out in the browser's language, not the page's (the reason for `noValidate`); a rule that has to ask the server had no place to be asynchronous; a failure that belongs to no field (a rejected `onSubmit`) had nowhere to appear; and nothing outside the form, nor a custom part inside it, could submit it, check it or read its state.

## Decision
- **The browser's rules are written in the page's words.** `labels` gains a message for each way a value can be wrong (`valueMissing`, `typeMismatch(type)`, `patternMismatch`, `tooShort(n)`, `tooLong(n)`, `rangeUnderflow(min)`, `rangeOverflow(max)`, `stepMismatch`, `badInput`), with English defaults, written through `formatNumber` like every other count ([ADR-0021](./0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md)). A message a control wrote itself through a custom validity (a `TimePicker`'s "incomplete") is kept as the control wrote it, and the browser's own message is used only for a state the labels don't name.
- **A field's rule, and the form's, may return a promise.** On submit the form waits for every answer, without disabling anything (`aria-busy`, `Form.Submit` loading, a second submit ignored), so focus never leaves the control being typed in; then it refuses on the first wrong field in page order or carries on. A valid form with no `onSubmit` is re-sent to the browser once the answers are in. As a field is edited its rule runs again and the latest check wins: an answer to an earlier check is dropped, and the field is `aria-busy` while one is out. A rule that throws or rejects shows `labels.validationFailed` for its field and warns in development, and the form never treats an unanswered rule as valid.
- **`Form.Error` is the slot for what no field owns.** It shows the form's `error` prop, or `labels.submitFailed` after an `onSubmit` promise rejects, as an announced danger alert. A rejection is handled by `onSubmitError` or by a `Form.Error` being in the form; with neither it is left for the page to report, as before.
- **The form is reached from outside by one stable `FormController`** (`submit`, `reset`, `validate`, `focusField`, `setErrors`, `clearErrors`, and the `form` element), handed to a `controllerRef` prop and returned by `useFormController()` inside; and `useFormState()` reads `pending`, `validating`, `disabled`, `errors` and `submitFailed`. `ref` stays the `<form>` element ([05](../05-component-api-conventions.md) §3).
- **`setErrors` is not a way around `errors`.** It adds to the form's own errors, which the next check of a field replaces; the caller's `errors` prop stays the controlled, outside channel ([ADR-0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md)).

## Alternatives considered
- **Keep rules synchronous and let the caller do the asking in `onSubmit`, returning errors.** Rejected: it moves a field's rule away from the field, and a submit would need a second round trip to show it.
- **Disable the fields while a rule is out.** Rejected: it drops focus from the control being typed in, the same reason [ADR-0075](./0075-form-shows-its-own-messages-and-moves-focus-to-the-first-invalid-control-and-announces-the-count-over-the-browsers-bubbles.md) restores it after a submit.
- **Make `ref` the controller.** Rejected: every component's `ref` is its DOM element, and a consumer who needs `form.elements` or `requestSubmit` would lose it. `controllerRef` is a second, explicit door.
- **A render-prop on `Form` for state.** Rejected: a hook reads what a nested part needs without threading it down.
- **Show a form-level failure as a toast.** Rejected: a toast goes away by itself and a failed submit is not something to lose; `Toast` stays available through `onSubmitError`.

## Consequences
- The form-level `validate` runs on every field check as well as on submit (only the checked field's message is taken), so it should be cheap; an asynchronous rule that is expensive should debounce itself.
- `FormField` gained one attribute: its wrapper is `aria-busy` while its rule is out. Nothing that existed behaves differently outside a form.
- `useFormController` and `useFormState` are public exports of the components package, with inert results and a development warning outside a form.

## Related
`04-component-inventory.md` (Form row); [ADR-0074](./0074-form-reads-the-dom-for-values-and-the-browsers-rules-and-calls-the-rules-you-write-over-a-value-store-or-a-schema-library.md), [ADR-0075](./0075-form-shows-its-own-messages-and-moves-focus-to-the-first-invalid-control-and-announces-the-count-over-the-browsers-bubbles.md); [Form.md](../component-reviews/Form.md).
