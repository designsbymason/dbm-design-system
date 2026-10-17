# 0084 — `DatePicker` chooses a month with a `granularity` prop that reuses `Calendar`'s months grid, over a separate `MonthPicker`

**Status:** Accepted · **Date:** 2026-10-17

## Context
A card's expiry or a billing month is a date field with no day: two segments, a grid of months, and a value that is a month,
not a day. It could be its own component, or a mode of this one.

## Decision
**`granularity="month"`** (default `"day"`). The field drops the day segment (month and year, in the `format`'s order), the value is
`"YYYY-MM"`, the form input is a `type="month"` one, and the panel holds the grid of months that `Calendar` already draws behind
its heading (`captionLayout="views"`, [ADR-0047](./0047-calendar-gets-year-and-month-grids-behind-its-heading-and-a-whole-week-mode-over-more-select-fields-or-a-separate-week-picker.md)):
`CalendarPicker`, imported from `Calendar`'s folder, drawn inside a wrapper that takes `Calendar`'s own size classes. Its heading
turns to a grid of years, its keys are the grid's, and it is held to `min` and `max` as months. Every date prop is then a month:
`min` and `max` read a `"YYYY-MM-DD"` as its month, `"today"` is this month, `presets` give months, and the form message says
the bound as a month. The shared typed-entry code takes the granularity as an argument.

## Alternatives considered
- **A separate `MonthPicker`.** Cleaner types, but it would copy the segments, `commitOn`, the form validation, the panel and
  every test of this field for one segment fewer.
- **A `Calendar` mode that chooses a month.** The grid exists, but `Calendar` is a grid of days with a view switcher behind its
  heading; a month-only mode is a different value and a different keyboard model, and it would not give the field.
- **Value `"YYYY-MM-01"`.** A real date, so no new shape, but it submits a day nobody chose and invites comparing it as a day.

## Consequences
- The grid can only disable what `min` and `max` rule out. `isDateDisabled` and `unavailableReason` still flag a month that
  has been typed or chosen, and are asked about `"YYYY-MM"`, but do not grey the grid out; the Docs page says so. A Today button has no place by month (a
  development warning), and a preset is the way.
- `DatePicker` imports `CalendarPicker`, the month and year grids, and `Calendar`'s stylesheet, from `Calendar`'s folder. They
  are not part of `Calendar`'s public API; if they change, this field is the second place to look.
- The two `Calendar` bundles share the picker's code, so `DatePicker`'s budget is measured with them.

## Related
[ADR-0082](./0082-datepicker-is-a-single-date-segmented-field-with-a-calendar-popover-and-an-explicit-format-over-a-masked-text-input-a-range-mode-or-a-date-time-field.md),
[ADR-0047](./0047-calendar-gets-year-and-month-grids-behind-its-heading-and-a-whole-week-mode-over-more-select-fields-or-a-separate-week-picker.md); `component-reviews/DatePicker.md`.
