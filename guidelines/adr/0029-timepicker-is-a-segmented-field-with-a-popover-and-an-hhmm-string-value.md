# 0029 — `TimePicker` is a custom segmented field with a popover, whose value is an `"HH:mm"` string, over a native time input or a slot list

**Status:** Accepted · **Date:** 2026-10-03

## Context
`TimePicker` (molecule item 26) had no design notes in `04-component-inventory.md`, so the shape of
the interaction was an open fork, and one that `DatePicker` and `DateRangePicker` (organisms, not yet
built) will inherit. Four real options existed, and three smaller questions came with them: what the
value is, how the 12- or 24-hour display is chosen, and which features the first version carries.

## Decision
**A custom field of separate segments** — hour, minute, optional second, and AM/PM in the 12-hour
cycle — each an `<input role="spinbutton">` (type digits, `ArrowUp`/`ArrowDown`, `Backspace` to clear,
`ArrowLeft`/`ArrowRight` to move), **plus a `Popover` of scrollable columns** (hour, minute, second,
period) to pick with a pointer. Every part is styled from tokens and named for assistive technology.

**The value is a 24-hour string**, `"HH:mm"`, or `"HH:mm:ss"` when seconds are shown; `""` for no value,
and also while the field is partly filled. What the segments show is a separate draft; the string is only
produced when every shown segment is filled.

**The hour cycle is an explicit `hourCycle: "12" | "24"` prop, defaulting to `"12"`.** The field never
reads the browser's locale ([ADR-0021](0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md)),
so server and client agree; the AM and PM text is in the `labels` object. The value is the 24-hour string
either way.

**The first version carries** seconds (`showSeconds`), a minute `step`, a clear button (`onClear`), `min`
and `max`, and a paired `TimeRangePicker` built by composing two `TimePicker`s.

## Alternatives considered
- **A segmented field with no popover.** Smaller, and still fully styled, but nothing to click through on
  a mouse or a phone, where typing into a segment is the awkward way to choose a time.
- **A text `Input` plus a popover list of slots (every 15 minutes).** Good for scheduling, weak for
  typing an exact time, and no seconds. Its slot list is a feature a segmented field can offer through
  `step` anyway.
- **Wrapping a native `<input type="time">`.** The smallest build, and the browser supplies keyboard
  handling, locale and a mobile picker. But its segments, its picker and its sizing are drawn by the
  browser and differ between them; none of it takes a token, and the picker can't be restyled. That is
  the opposite of this system's premise (tokens are the single source of truth, premium and consistent).
- **A `{ hours, minutes, seconds }` object or a `Date` as the value.** Structured, but longer for an
  agent to write, needs converting for a form, and a `Date` carries a day and a timezone a time of day
  doesn't have. A string needs no import, submits as it is, and matches the native input's own format.
- **Defaulting `hourCycle` to 24, or to the locale.** The locale is ruled out by ADR-0021. 24 was
  offered; 12 was chosen as the default people more often expect, and either is one prop away.

## Consequences
- The component is large: a segment state machine (typing, stepping, carrying a digit to the next
  segment), a popover with four listbox columns, and the range wrapper. The pure parts live in
  `src/internal/time/` (`timeValue.ts`, `segmentEntry.ts`), shared with `TimeRangePicker`, so the odd cases are tables of input and output.
- A mobile virtual keyboard may not send usable key events, so the segments are real `<input>`s (with
  `inputMode="numeric"`) that also read `onChange`, rather than `contenteditable` spans.
- A time outside `min`/`max`, or a minute off the `step`, is *flagged* (`aria-invalid`, error styling)
  and still reported, not refused: refusing a half-typed time mid-entry would make the field fight the
  person. The popover only offers allowed values.
- `DatePicker` should reuse this field and popover pattern for its time part, not build another.

## Related
`04-component-inventory.md` (items 26, and the new `TimeRangePicker` row), `05-component-api-conventions.md`
§3 (labels and `formatNumber`), [ADR-0021](0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md),
[ADR-0008](0008-closebutton-reserved-for-modal-surfaces.md) (the clear control is local),
`guidelines/component-reviews/TimePicker.md`.
