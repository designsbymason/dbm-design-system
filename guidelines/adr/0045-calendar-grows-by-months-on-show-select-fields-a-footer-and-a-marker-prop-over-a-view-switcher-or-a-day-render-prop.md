# 0045 — `Calendar` grows by months on show, select fields for the month and year, a footer and a marker prop, over a month/year view switcher or a day render prop

**Status:** Accepted · **Date:** 2026-10-05

## Context
[ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md) named what the first `Calendar` left out: a way to jump to a far-off month or year, several months side by side, range limits, a place for actions, and any mark on a day. `DatePicker` and `DateRangePicker` need most of these, and the booking and scheduling uses of a calendar need the rest. Each had more than one shape.

## Decision
- **Months on show are a count, `numberOfMonths` (1 to 4), of the same grid**, not a second component. `month` / `defaultMonth` / `onMonthChange` mean the *first* month on show; the buttons move it by one; the months wrap onto more rows in a narrow container. Each month is its own named `grid`, all of them one tab stop; a key move onto a day in another month on show moves focus without turning the page, and the page turns only when the target is off screen. The neighbouring months' days are drawn only with one month on show, since otherwise a date would be drawn twice.
- **The month and year jump is `captionLayout="dropdown"`: two `Select` fields** (month, year) in place of the heading, the year list from `yearRange` narrowed by `min` and `max` and always including the year on show, months with no available day disabled. The grid keeps its name through a visually hidden heading. With several months, only the first gets the fields. At the `xs` step, where two fields don't fit between the buttons, they take a row of their own.
- **Actions are `showTodayButton` and `clearable`, and your own content is `footer`.** The buttons are slotted onto plain buttons and are `aria-disabled` rather than removed or natively disabled, so pressing Clear on the last chosen date leaves focus on Clear. Today shows today's month and chooses today when it can be chosen.
- **A day mark is `getMarker(date)`, returning `{ tone, label, content }`.** A tone draws a dot under the number; `content` is your own node for the slot instead (a price), purely visual; `label` is added to the day's accessible name, and without one the marker is decorative. If any marker brings content, every number moves to the top of its day so the numbers stay in line.
- **Range limits are `minRangeDays`, `maxRangeDays` (counting both ends) and `rangeSpansUnavailable`.** They apply only while the end is being chosen and only to dates from the start on (an earlier date restarts the range), by making those dates unavailable the same way any other unavailable date is: dimmed, `aria-disabled`, focusable, not chosen. With `rangeSpansUnavailable={false}` the dates after the first unavailable one are looked for up to 732 days ahead.

## Alternatives considered
- **A month and year *view* (click the heading to see a grid of months, then of years).** A familiar pattern and good on touch, but it is two more grids with their own keyboard models, and the select fields already give the keyboard, the screen reader and the pointer one tested control each.
- **A `renderDay` prop for the day's whole content.** The most general, but a consumer then owns the day's accessible name, focus ring and states, and every calendar built from it looks different. The marker prop covers a dot, a label and a small slot, and keeps the day button ours.
- **`footer` only, with no built-in buttons.** Smaller, but Today and Clear are needed by almost every date field, and doing them right (focus kept when the button empties the calendar) is the part a consumer gets wrong.
- **Range limits as `isDateDisabled` rules the consumer writes.** Possible, but the rule depends on the range's start, which `isDateDisabled(date)` is never given.
- **A separate `RangeCalendar` for months side by side.** Every other prop would be repeated.

## Consequences
- `Calendar` imports the `Select` molecule, and its bundle grows (7.66KB gzipped, inside the 10KB budget).
- The `month` prop's meaning (the first month on show) is a rule to remember with `numberOfMonths` above 1.
- `getMarker` and `isDateDisabled` are called for each of the 42 days of each month on every render, so they must be cheap.
- Named, not built: dragging across days to select a range, week numbers, presets as a built-in, a month/year view.

## Related
[ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md); `04-component-inventory.md` (`Calendar`, `DatePicker`, `DateRangePicker`); `component-reviews/Calendar.md`.
