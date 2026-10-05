# 0047 — `Calendar` gets year and month grids behind its heading and a whole-week mode, over more select fields or a separate week picker

**Status:** Accepted · **Date:** 2026-10-05

## Context
[ADR-0045](./0045-calendar-grows-by-months-on-show-select-fields-a-footer-and-a-marker-prop-over-a-view-switcher-or-a-day-render-prop.md) chose two select fields for jumping to a far-off month or year and set a month-and-year *view* aside as more to build. It was asked for afterwards, along with a way to choose a whole week; the question was whether these belong to `Calendar` or to the not-yet-built `DatePicker`. Both change what the grid does, not what a field around it does.

## Decision
- **They belong to `Calendar`.** A date field built later takes them from the grid and adds nothing.
- **`captionLayout="views"` makes the heading a button that opens a grid of the year's twelve months, whose heading (the year) opens a grid of twelve years.** Choosing a year goes to its months; choosing a month returns to the days. It sits beside `"label"` and `"dropdown"`, and replaces neither. It applies with one month on show; with more it is the plain heading, with a development warning.
- **Each grid is a three-by-four grid of buttons with roving focus** (arrows by one and by three, never leaving the twelve in the months grid and turning the page in the years grid; Home and End to the ends of a row; Page Up and Page Down a year, or a page of years; Enter and Space choose; Escape closes). It is as tall as the six rows of days it replaces, computed from the same tokens, so what is below does not move. Focus goes into the grid when it opens, to the day after a month is chosen, and to the heading button after Escape.
- **`mode="week"` has the date the week starts on as its value.** Any day of a week chooses the row; a date that is not a week's first day is read as the week it is in; the first and last day are drawn as chosen days with the strip between, and the week under the pointer is drawn lightly. A week can be chosen by any available day of it.
- **Calendar's JS budget is raised to 12KB**, with the reason recorded in the bundle check beside `TimeRangePicker`'s: it holds every grid, range, multiple and week choosing, drag, the footer, markers, week numbers, the key, and the `Select` the month and year fields use, and the date pickers will be built on it. Measured 10.26KB.

## Alternatives considered
- **Only the select fields.** Already built and accessible, but a drill-down is what people look for when browsing rather than knowing a date.
- **A separate `MonthPicker` / `YearPicker` / `WeekPicker`.** Each would re-implement a roving-focus grid, the labels, the limits and the announcements.
- **A week as `[start, end]` in range mode.** Works with the range code, but a consumer would write the week's end and the "snap to the row" rule themselves, and a value that is not exactly seven days is possible.
- **The week value as the week number plus the year.** Compact, but ambiguous across week numbering systems and not a date.
- **Combining `dropdown` and `views`.** Two ways to do one thing in one heading.

## Consequences
- `Calendar` is the largest component in the library by a distance; the budget override is the honest record of that, and the next addition has to justify itself against 12KB.
- Week choosing is by the first day of the row, whichever day `weekStartsOn` names, so a week's value changes if `weekStartsOn` does.
- A scheduler (a month, week or day view with events and time slots) is a different component and is not covered; see the inventory.
- Named, not built: other week-numbering systems, a decade view, presets.

## Related
[ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md), [ADR-0045](./0045-calendar-grows-by-months-on-show-select-fields-a-footer-and-a-marker-prop-over-a-view-switcher-or-a-day-render-prop.md), [ADR-0046](./0046-calendar-multiple-is-a-list-of-dates-a-name-submits-hidden-inputs-and-pointer-gestures-are-shortcuts-over-a-sorted-set-object-or-required-gestures.md); `component-reviews/Calendar.md`.
