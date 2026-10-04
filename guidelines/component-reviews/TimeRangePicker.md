# TimeRangePicker

Molecule, Inputs & Forms category. Added to `04-component-inventory.md` on 2026-10-03 at the user's request (the
first-version scope for `TimePicker` listed "time-range / paired fields"), and built the same day. **Finalized
2026-10-03** (declared by the user, after the second round and a final §9 pass, both below); per the finalization rule, no
further change to its code, stories, docs or tokens without asking first. Known limit left open on purpose: the shared popover
shows each end's committed value, not a half-typed segment. Its own JS budget is 12KB (below).

## What it is

A start time and an end time: two `TimePicker`s in a `role="group"`, joined by a dash, whose values are one
`[start, end]` pair of 24-hour strings (`""` for an end not yet complete). It is composition, not a copy: every
setting (`hourCycle`, `showSeconds`, `step`, `min`, `max`, `size`, `hasError`, `disabled`, `readOnly`, `required`,
`showPicker`, `labels`, `formatNumber`) is passed to both ends. The shared time model lives in `src/internal/time/`,
which both import.

- **The end can't be before the start.** The end's `min` is the later of the shared `min` and the start, so its
  picker disables what is earlier and an end earlier than the start is flagged (and still reported). The start is
  *not* limited by the end: constraining both flagged the start whenever the end was momentarily earlier mid-typing
  (found by a unit test, which expected only the end flagged), so only the end is held. An end equal to the start is
  allowed.
- **Form value:** `name` submits as `name[]`, start first (`RangeSlider`'s convention), through each end's hidden time input,
  which also validates it (`required`, a half-filled or unavailable end): see
  [ADR-0030](../adr/0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md).
- **Second round (2026-10-03), [ADR-0031](../adr/0031-timerangepicker-keeps-a-pair-of-times-of-day-and-judges-length-through-the-ends-own-rules.md):**
  `allowOvernight`, `minDuration`/`maxDuration` (minutes), `constrainStart` and `sharedPicker`.
  - Overnight drops the end's "not before the start" minimum; durations wrap across midnight and equal times are zero.
  - Duration limits and `constrainStart` become each end's `max` and an `isTimeDisabled` predicate (composed with the
    owner's own), so flags, disabled rows and the form message come for free. With `allowOvernight` the start has no latest.
  - `sharedPicker` renders `TimePickerColumns` twice in one popover (an `IconButton` trigger, `showPicker` still gates it);
    picks go through `pickIntoDraft`, held in `held` state under `commitOn` and reported when the popover closes. Focus events
    treat the popover and the trigger as part of the pair; `openOnFocus` opens it when focus arrives on a segment.
  - Found: the popover's usual width cap stacked the two wheel sets, so the panel may grow to Radix's available width
    (looked at in the browser); the duplicate group names in the popover made test helpers ambiguous (fields come first).
  - Verified: 18 new unit tests, each behaviour broken on purpose and failing a test (overnight, both duration paths, the
    wrap, `constrainStart`'s max and limits, the hold, the close flush, the popover's containment); 2 new real-browser stories
    (side by side inside the viewport; picks reach their own end, focus starts at the start's hours); snippets typechecked;
    lint, both typechecks, 5,123 unit and 963 Storybook-project tests (one `TimePicker` segment-clipping check failed once
    under load and passed on three reruns; not investigated).
  - Open: the shared popover shows committed values, not a half-typed field.
- **Final review before Finalizing (2026-10-03):** the same §9 re-run. Closed: held picks were not dropped when the owner set a
  new range while the popover was open (now they are, with a test); the shared popover had no axe scan or `aria-haspopup`/
  `aria-expanded` check, nor a `StrictMode` run (all added, clean). Looked at live: both Docs pages (headings, no inert controls,
  defaults), and the shared popover at 375px in dark mode (fits the viewport, the two sets stack, no horizontal overflow; the
  trigger button drops to its own line when the row wraps). **Bundle size, decided 2026-10-03:** `TimeRangePicker` is 10.58KB gzipped JS against the 10KB
  per-component budget (it was 7.49KB before the second round; the number includes the `TimePicker` it composes, the wheels,
  `Popover` and `IconButton` the shared picker added). It gets its own 12KB JS budget (`JS_BUDGET_OVERRIDES_KB` in
  `scripts/check-component-bundle-size.mjs`, reason beside it); every other component keeps 10KB, and 12 still trips if it grows
  by another ~1.4KB.
- **Passed through to both ends (2026-10-03):** `commitOn`, `secondStep`, `isTimeDisabled`, `periodPosition`, `openOnFocus`.
  `onFocus`/`onBlur` fire once for the pair: each end reports its own arrivals and departures, and the range ignores a
  departure whose `relatedTarget` is inside the group and an arrival while it already holds focus (a start end's picker is
  portaled, so containment alone would call a move from it to the end field an arrival).
- **Names:** the group takes `aria-label`/`aria-labelledby` (a `FormField` supplies them); the ends are named
  "Start time" and "End time" (`labels.start`, `labels.end`, in the same object as `TimePicker`'s labels). `id` goes
  on the start field's first segment. `onClear(end)` says which end.
- **No overnight range.** The rule is "end is not before start", so 22:00 to 02:00 reads as invalid; the Docs page
  says to use two pickers for that.

## Follow-up round, 2026-10-03

`clearable` (and `onClear(end)` as the optional notification, as on `TimePicker`), the Playground args made real for
`min` and `max` (no more "Set string" placeholders), and the prop order aligned with `TimePicker`'s and the other input
molecules, in the types, stories and Docs page; each end also takes `TimePicker`'s empty AM/PM default. See
[TimePicker.md](TimePicker.md)'s follow-up for the reasoning.

## Findings

- **A read of the pair is defensive:** a value that isn't a two-element array of strings reads as empty, tested.
- **Invalid is on the segments.** A group can't carry `aria-invalid` (the rule `TimePicker`'s review records), so
  the tests ask an end's first spinbutton.

## Verified

- Unit (22): the group and its two named fields, each end's value, the pair reported on every change with `""` for an
  incomplete end, controlled with an owner that ignores a change, a value set from outside, an unreadable value, the
  end flagged earlier than the start (and equal allowed, and the start left alone), the shared `min`/`max`, the end's
  picker disabling earlier times, the shared settings reaching both ends, `name[]` and `form`, `onClear` and which
  end, translated labels, the `id`, `autoFocus`, the no-name warning, a `FormField`'s label and error, ref and
  standard props and the role not replaced, `StrictMode`, and axe closed and with an end's picker open.
- Stories: Playground, 12/24-hour, the end-before-start case, controlled, clear buttons, in a `FormField`; the
  Docs page checked live (headings, Properties defaults, no empty description, every "Show code").
- Everything `TimePicker`'s real-browser checks cover applies to each end; none are repeated here.

## Not checked, or open

- **A narrow screen.** The row wraps (the end drops under the start); not measured in a real browser at a phone's width.
- **A range across midnight**, by design (above).
