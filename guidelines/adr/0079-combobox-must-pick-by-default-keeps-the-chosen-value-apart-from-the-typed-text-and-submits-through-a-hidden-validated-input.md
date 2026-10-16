# 0079 — `Combobox` must be picked from by default, keeps the chosen value apart from the typed text, and submits through a hidden validated input, over submitting the text

**Status:** Accepted · **Date:** 2026-10-16

## Context
A field that suggests options can mean two things: "choose one of these" (a country, a user, a record) or "type
anything, here are suggestions". They differ in what is submitted, what `required` means and what happens to text that
matches nothing. A visible `<input>` holds only text, so submitting it would send a label where a record's id is
wanted, and `required` would be satisfied by any text at all.
[ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md) met the same
shape and answered it with a hidden control that a form can refuse.

## Decision
- **Two values, kept apart:** `value` (the chosen option's `value`, `""` for none) and `inputValue` (the text in the
  field), each controlled or uncontrolled. `onInputValueChange(text, reason)` says why the text changed
  (`"input"`, `"select"`, `"clear"`, `"reset"`), so a caller that fetches doesn't refetch because a pick wrote the label.
- **Must-pick by default.** The value is always an option's. Leaving the field with text that isn't a choice puts the
  last choice's label (or nothing) back. `allowCustomValue` makes the typed text a valid value instead.
- **A form validates through a visually hidden `<input>`** that carries `name`, `form`, `required` and the value, with a
  custom validity (`labels.pickAnOption`) while there is text that is not a choice. When the browser focuses it, focus
  is passed to the visible field. With `allowCustomValue` the visible input carries `name` and submits its own text.
- **The first match is highlighted while typing** (`autoHighlight`, on in must-pick mode, off with
  `allowCustomValue`), so Enter picks it.

## Alternatives considered
- **Submit the visible input's text.** Rejected: it submits labels, not values, and `required` means nothing.
- **A single combined value.** Rejected: an async caller must tell text from choice to know when to fetch and when to
  show a stored label.
- **Free text by default.** Rejected: the common use is choosing a record; free text is one prop away.

## Consequences
- A controlled `value` whose option isn't in `options` (a stored id whose label hasn't loaded) shows `""` until
  the option arrives; the caller can pass `inputValue` to show a label meanwhile.
- `Form` finds the hidden input through the browser's own constraint validation, like `TimePicker`'s.

## Related
[ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md),
[ADR-0074](./0074-form-reads-the-dom-for-values-and-the-browsers-rules-and-calls-the-rules-you-write-over-a-value-store-or-a-schema-library.md).
