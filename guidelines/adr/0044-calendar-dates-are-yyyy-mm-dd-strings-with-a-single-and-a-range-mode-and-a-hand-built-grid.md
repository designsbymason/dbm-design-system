# 0044 — `Calendar` dates are `"YYYY-MM-DD"` strings, one component has a single and a range mode, and the grid is hand-built, over a `Date` value, a separate range component or a date library

**Status:** Accepted · **Date:** 2026-10-05

## Context
`Calendar` is the month grid that `DatePicker` and `DateRangePicker` (organisms, not yet built) are a field and a `Popover` around, and it is useful on its own. Its first design had three forks that the pickers inherit: what a date is as a value, how a range is chosen, and where the date arithmetic and the grid come from. The dependency budget (`CLAUDE.md`) allows only Radix and the optional Motion, and Radix has no calendar.

## Decision
**A date is the string `"YYYY-MM-DD"`**, `""` for none, never a `Date`. A calendar day has no time of day and no timezone, and a `Date` carries both, so passing one across a timezone or a daylight-saving change moves the day. A string needs no import, compares and sorts correctly with `<` and `>`, submits as it is, and matches `TimePicker`'s `"HH:mm"` ([ADR-0029](./0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md)). The visible month is `"YYYY-MM"` the same way. A value that is not a real date reads as none, with a development warning.

**One `Calendar` has `mode="single"` (the default) and `mode="range"`.** In range mode the value is a `[start, end]` pair of those strings, `""` for an end not chosen yet; the first choice is the start, the second the end, a third starts again, and a choice before the start moves the start. The props are a union keyed on `mode`, so a range's `value` and `onValueChange` have the right types. `DateRangePicker` then wraps this one grid.

**The date arithmetic and the grid are hand-built, with no dependency, in `src/internal/date/`** (pure functions: parse, format, add days, months and years, weekday, a six-week month grid, key moves), shared with the pickers. It runs on UTC day numbers, so a day is always 24 hours and no local clock is read. Text is not taken from `Intl` or the locale ([ADR-0021](./0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md)): month and weekday names are a `labels` object with English defaults, the week's first day is an explicit `weekStartsOn`, and numbers go through `formatNumber`. The only clock reading is "today", taken in the browser after mount (`useSyncExternalStore` with no server snapshot), so a server render and the first client render agree; a `today` prop overrides it.

The grid is the WAI-ARIA date grid (one tab stop, arrow keys by day and week, Home and End along the week, Page Up and Page Down by month, Shift for a year), always six rows of seven so it keeps one height, with unavailable dates left focusable (`aria-disabled`) so the arrow keys never skip them.

## Alternatives considered
- **A `Date` (or a `{ year, month, day }` object) as the value.** A `Date` is the platform's type and what a developer may already hold, but it needs a timezone convention that every consumer must remember and every server must match; the object is structured but longer to write and still needs converting for a form.
- **A date library for the arithmetic.** Less code, but a runtime dependency for about two hundred lines of pure, exhaustively tested functions; the budget says every dependency is a justified exception.
- **A separate range component.** Each keeps one value type, as `TimePicker` and `TimeRangePicker` do, but a range is a different selection over the same grid, not a different grid, and two components would duplicate the grid, the keyboard model and the month state. (`TimeRangePicker` composes two fields; here there is one field to be shared.)
- **Reading the locale with `Intl` for names and the first day of the week.** Less to translate by hand, but it changes output between server and browser (a hydration mismatch) and between browsers, which ADR-0021 rules out.

## Consequences
- A consumer converts at the edges only: `Intl.DateTimeFormat` on a `Date` made from the string to show it, and `toISOString().slice(0, 10)` or its own formatter to produce one.
- `DatePicker` and `DateRangePicker` get the grid, the model and the keyboard behaviour for free, and own only the field, the popover and a typed-entry format.
- The first day of the week and the heading text are the app's decision, written once in `weekStartsOn` and `labels`.
- A year is limited to 1 to 9999.
- Not in the first version, named rather than built: a month and year picker for long jumps (the Shift keys and the month buttons are the only ways), two months side by side, week numbers, and a presets row. They can be added without changing the value.

## Related
`04-component-inventory.md` (`Calendar`, `DatePicker`, `DateRangePicker`); `05-component-api-conventions.md` §3 (`labels`, `formatNumber`, `dir`); [ADR-0029](./0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md).
