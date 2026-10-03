# 0031 — `TimeRangePicker` keeps a pair of times of day and judges overnight and length through each end's own rules, over a date-carrying value or a range-only validity path

**Status:** Accepted · **Date:** 2026-10-03

## Context
`TimeRangePicker` ([ADR-0029](./0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md),
[ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md)) could not
express a shift that crosses midnight, a minimum or maximum length, a start held to the end, or one picker for both ends.

## Decision
**The value stays `[start, end]`, two 24-hour strings, with no date.** `allowOvernight` only changes what an end
earlier than the start *means* (the next day) and stops flagging it. Equal times are a range of no length, never 24
hours.

**Length and the start's limits are the ends' own constraints, not a second validity path.** `minDuration` and
`maxDuration` (minutes), and `constrainStart`, are turned into each end's `max` and an `isTimeDisabled` predicate and
handed to the `TimePicker`, so the existing flag-don't-refuse behaviour, the picker's disabled rows, `aria-invalid` and
the form's "unavailable" message all follow with no new machinery. Nothing is judged until the other end is whole. The
start stays unconstrained by default, because it would flag while the end is mid-typing.

**`sharedPicker` is one popover of two sets of wheels** (the start's, then the end's, each in a named group) opened from
one button after the end, replacing the two buttons. It reads each end's committed value and writes a whole time back,
through the same fill rule as the field's own picker (`pickIntoDraft`). Picks follow `commitOn`: held, and shown in the
fields, until the popover closes. The popover counts as part of the pair for `onFocus`/`onBlur`.

## Alternatives considered
- **A value carrying dates** (`Date`/ISO pairs) for overnight. Makes the range unambiguous, but turns a time field into a
  date-time one and breaks `name[]` submission as plain times; a date belongs to a `DateRangePicker`.
- **A range-level validity check** for duration. A second flagging, messaging and form-validation path to keep in step
  with the ends'; routing through the ends costs one predicate each.
- **A `TimePicker` mode that renders two sets of wheels.** Would give the single-value component range knowledge; the
  range composes the shared wheels (`TimePickerColumns`) instead.
- **Defaulting `constrainStart` on.** Flags the start while the end is half typed.

## Consequences
- Wheels in the shared popover show the committed value, not a half-typed segment in a field.
- Both limits and overnight apply to the picker's rows by scanning (`hasAllowedTime`, early exit), which is cheap unless
  a whole hour is ruled out.
- The shared popover's panel is allowed to grow to the viewport width (a popover's usual cap is narrower than two wheel
  sets) and wraps the sets only when that runs out.

## Related
[TimeRangePicker.md](../component-reviews/TimeRangePicker.md); `04-component-inventory.md`.
