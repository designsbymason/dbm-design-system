# 0046 — `Calendar`'s multiple mode is a list of date strings, `name` submits through hidden inputs, and a drag and a swipe are shortcuts, over a set object, a native form field or gestures the keyboard can't do

**Status:** Accepted · **Date:** 2026-10-05

## Context
[ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md) fixed the value as `"YYYY-MM-DD"` strings and gave `Calendar` a single and a range mode. Seven more things were wanted: a third mode for separate dates, a way to submit with a `<form>`, week numbers, rows only as many as a month needs, a rounded strip and a month animation, dragging a range and swiping a month, and announcing a choice. Each had a fork.

## Decision
- **`mode="multiple"` has a list of date strings as its value** (`readonly string[]`, reported in date order as a new array), with `maxSelected` to cap it. Choosing a date adds it and choosing it again removes it; once the cap is reached the other dates are unavailable and the chosen ones stay free. Duplicates and non-dates are dropped with a development warning.
- **`name` submits through hidden `<input type="hidden">`s**, not a native field: a single date as `name` (an empty string when none is chosen), a range as two inputs `name[]` (start, then end, `""` for an open end — the convention `RangeSlider` and `TimeRangePicker` use), several dates as one `name[]` each, none when `disabled`. The calendar owns no validation.
- **Week numbers are ISO 8601 numbers taken from each row's Thursday**, in a column of their own (`showWeekNumbers`), named for assistive technology and not interactive. A row with no day in it (when the neighbouring days are left out) has no number. Other numbering systems are not offered.
- **`fixedWeeks` defaults to true (six rows always)**; `false` draws only the rows a month needs and accepts that what is below moves.
- **The strip of a range is rounded at the ends of a row**, with the month's change animated by sliding and fading only the grid and the heading (never the buttons or the fields, which are where focus is), by two alternating CSS animations so a second change restarts it without remounting anything. `animated` turns it off, and the reader's reduced-motion setting always does.
- **A drag across days (mouse) and a swipe (touch) are shortcuts for what a click, a tap and the month buttons already do.** A drag chooses the range from where the press began to where it is let go, by the same limits as choosing its end, and a press and release on one day is an ordinary click; a pen and a finger do not drag. A swipe of at least 48px that is at least twice as long as it is tall turns the month (left for the next, mirrored in right-to-left text), and `touch-action: pan-y` leaves vertical scrolling to the page. Neither is the only way to do anything.
- **A choice is announced in the status region the month change already uses**: the start of a range, the finished range, and a count of dates in multiple mode; each text is a label, and `announce` turns them all off.

## Alternatives considered
- **A `Set` (or a sorted, de-duplicated object) as the multiple value.** Easier to look up, but not JSON, not form data and not what a state hook shows; a list is, and the calendar normalises it.
- **One hidden input holding a comma-separated list.** One name, but the receiving side must split it, and no other field here does; repeated `name[]` already is the convention.
- **A native `<input type="date">` for submission.** Carries one value, a locale and a picker of its own.
- **Week numbers by the US or a locale convention.** More options and more to get wrong; ISO is unambiguous and the common ask.
- **Animating the whole month panel, buttons included.** Simpler, but a button that moves under the pointer or the keyboard focus is worse than no animation.
- **Drag and swipe as the way to do these things.** Faster for some, but unreachable by keyboard and screen reader, and a swipe fights page scrolling.

## Consequences
- The `value` types are a union of three; the types, the Properties table and the snippets say which props belong to which mode.
- A drag listens for the release on the window, so it ends wherever the pointer is let go; a cancelled drag chooses nothing.
- The year range is 1 to 9999 and the week numbers are meaningless outside it.
- Named, not built: a presets row, other week-numbering systems, a month and year view, drag-to-select for touch.

## Related
[ADR-0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md), [ADR-0045](./0045-calendar-grows-by-months-on-show-select-fields-a-footer-and-a-marker-prop-over-a-view-switcher-or-a-day-render-prop.md); `component-reviews/Calendar.md`.
