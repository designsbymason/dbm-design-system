# 0030 — `TimePicker` holds `onValueChange` back with `commitOn`, and a form validates it through a hidden time input, over reporting every change and a hidden input nothing validates

**Status:** Accepted · **Date:** 2026-10-03

## Context
[ADR-0029](./0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md) shipped a field that
reported every change and submitted through `<input type="hidden">`. Using it showed two gaps a form field
shouldn't have. A first minute digit already makes a whole time (`"09:03"` before `"09:30"`) and a fast wheel
fling reports every row, so an owner doing anything but copying the value had to debounce it itself. And
`required` only set `aria-required`: a hidden input is barred from constraint validation, so a form still
submitted an empty or half-filled time. Both are questions every future composite field (`DatePicker`,
`Combobox`, a date-time field) will meet.

## Decision
**`commitOn: "change" | "complete" | "blur"` (default `"change"`) decides when `onValueChange` is called.** The
segments always show the latest edit; only the report is held. `"complete"` holds it while a digit may still get a
second one, while the picker is open, and while the field is partly emptied; `"blur"` holds it until the field is
left. Both flush when focus leaves the field, the picker closes, `Enter` is pressed, and the clear button is a
decision, never held. A flush reports the field as it stands, `""` included for a half-filled field, so what the
owner has always catches up with what is shown. A `value` set from outside wins over a held edit, and an owner
echoing back what it was told does not wipe the segments.

**The field is one thing for `onFocus` and `onBlur`**: they fire once on arriving and once on leaving, not as focus
moves between the segments, the buttons or the portaled picker (a native `focus` on the group fires for each).

**A form validates through a visually hidden `<input type="time">`** that carries `name`, `form`, `required` and
the value (it replaces the hidden input; the submitted string is the same). A half-filled field, and a time
outside `min`/`max`, off a step or ruled out by `isTimeDisabled`, set a custom validity from the `labels`
(`incomplete`, `unavailable`). The field still flags and reports what it doesn't allow, as before; the form is
what refuses it. When the browser focuses the invalid control, focus goes to the first empty segment.

## Alternatives considered
- **Debounce on the owner's side.** The status quo, and it leaves the in-between value visible to everyone who doesn't
  think of it. A prop is one line and it makes the behaviour discoverable by an agent reading the types.
- **A boolean (`reportOnBlur`).** Covers one of two real needs: validate-on-blur wants `"blur"`, an autosave wants
  `"complete"`.
- **Native `min`, `max` and `step` on the hidden time input.** The browser's messages are localised for free, but its
  `step` is measured from `min` (our grid is absolute), it can't know `isTimeDisabled`, and a field with seconds
  has no step on minutes. One path (custom validity from `labels`) is consistent; only `required` is native.
- **`required` as a `FormField` concern only** (what ADR-0029 said). Leaves every plain `<form>` unvalidated.
- **A hidden input that listens for `invalid`.** A hidden input never fires one.

## Consequences
- A composite field reports through one place (`report`) that dedupes against the latest value, so two commits in one
  event can't report a time twice, and an owner that ignores a change is still undone on the next render.
- A form that submits while a held edit is pending is safe: leaving the field (clicking submit blurs it) and `Enter`
  both flush before the submit reads the value.
- `isTimeDisabled` is called from the picker as it draws, with early exit; it must be cheap and pure, which its docs say.
- The extra input is in the DOM even for a field with no `name` (nothing is submitted, but it still validates).
- Applies to `TimeRangePicker`, which passes both through and fires `onFocus`/`onBlur` once for the pair.

## Related
`05-component-api-conventions.md` (composite fields); [TimePicker.md](../component-reviews/TimePicker.md);
[TimeRangePicker.md](../component-reviews/TimeRangePicker.md).
