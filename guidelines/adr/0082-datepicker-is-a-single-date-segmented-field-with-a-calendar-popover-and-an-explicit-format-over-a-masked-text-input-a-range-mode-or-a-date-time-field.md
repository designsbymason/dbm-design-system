# 0082 — `DatePicker` is a single-date field of day, month and year segments with a `Calendar` popover and an explicit `format`, over a masked text input, a range mode or a date-time field

**Status:** Accepted · **Date:** 2026-10-17 · the calendar's anchoring (to its button, through the `Popover` molecule) is superseded by [ADR-0083](./0083-datepicker-anchors-its-panel-to-the-whole-field-with-a-trigger-less-radix-anchor-and-offers-side-align-and-a-full-width-presentation-over-the-popover-molecule-and-its-button.md); the rest stands

## Context
[ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md) left
`DatePicker` "the field, the popover and a typed-entry format", and [ADR-0029](./0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md)
asked it to reuse `TimePicker`'s field-and-popover pattern. Three forks were open: what the typed field is, whether
one component also chooses a range or a time, and how the order of the parts is decided. The inventory row said
"Calendar popover, range mode" while `DateRangePicker` is a separate row.

## Decision
**One date, three segments.** The field is a day, a month and a year segment, each an `<input role="spinbutton">`
with `TimePicker`'s keyboard model (digits that finish a segment move on, `ArrowUp`/`ArrowDown` step it, `Backspace`
clears it), plus a button that opens a `Popover` holding a `Calendar` in `mode="single"`. The value is `"YYYY-MM-DD"`
([ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md)), `""`
while the three numbers are not a real date.

**The order is an explicit `format`** (`"mdy"` by default, `"dmy"`, `"ymd"`) and the text between segments a `separator`,
never read from the browser's locale ([ADR-0021](./0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md)).
The segments are always drawn left to right, since a date's numbers read in the order its format gives; `dir` moves
the buttons and the calendar.

**Not a range and not a date-time field.** A range is `DateRangePicker` (organism 16), which composes this field or
shares its segments. `DatePicker` takes no `mode`. A time of day is `TimePicker`, put beside it by the app; a
combined field is not built until there is a concrete need.

**Flagged, not refused, as `TimePicker` is** ([ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md)):
a date outside `min`/`max`, one `isDateDisabled` rules out, and three numbers that are not a real date are
`aria-invalid` and (for a real date) still reported; a hidden, visually hidden `<input type="date">` carries `name`,
`form` and `required` and the three form messages. `commitOn` and one report for focus and blur are ADR-0030's.

**The calendar is anchored to its button** through the `Popover` molecule (trigger, `align="end"`), not a trigger-less
anchor over the whole field ([ADR-0077](./0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md)).
It is on the `popover` z-index step ([ADR-0054](./0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md)).
The other `Calendar` options pass through `calendarProps`, except the props the field owns.

## Alternatives considered
- **One masked text input with a format string.** Smaller, and a paste is one string. But a mask needs a parser for
  each format and fights the caret, a half-typed date has no per-part meaning for `aria-valuenow` or the arrow keys,
  and a segment per part is what `TimePicker` already is. Pasted text is still read, part by part.
- **A `mode="range"` on this component** (what the inventory first said). One component, but a range has two ends,
  two fields and a different report; `TimeRangePicker` composed two fields rather than adding a range mode to one.
- **A date-time value** (`"YYYY-MM-DDTHH:mm"`). It would carry a timezone question ADR-0044 removed on purpose.
- **A `format` read from the locale.** Less to pass, and a hydration mismatch.
- **Anchoring the calendar to the whole field** with a trigger-less anchor: the panel would align with the field's
  start. Not done: it needs the field to give up `Popover`'s trigger and open without a button, and `align="end"` on the
  button matches `TimePicker`. Revisit if the offset from a wide field proves awkward.

## Consequences
- The segment-entry rules are their own module, `internal/date/dateEntry.ts`, beside `internal/time/segmentEntry.ts`
  rather than shared with it: the digit rules differ (a four-digit year, a day that depends on the month), and
  `TimePicker`, which is Finalized, is left as it is. Extract to one if a third segmented field arrives.
- `DatePicker`'s bundle holds `Calendar` (10.55KB), so it has a 16KB JS budget override.
- Two component tokens: `date-picker.segment-width` and `date-picker.year-width`.
- A year typed one digit at a time passes through real dates (`"0002-…"`), so the default `commitOn="change"` reports
  each; `"complete"` waits for the fourth digit.
- `DateRangePicker` inherits the segments, the validation and the format.

## Related
`04-component-inventory.md` (`DatePicker`, `DateRangePicker`); `05-component-api-conventions.md` §3 and §6;
[ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md),
[ADR-0029](./0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md),
[ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md);
`component-reviews/DatePicker.md`.
