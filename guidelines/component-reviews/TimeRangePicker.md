# TimeRangePicker

Molecule, Inputs & Forms category. Added to `04-component-inventory.md` on 2026-10-03 at the user's request (the
first-version scope for `TimePicker` listed "time-range / paired fields"), and built the same day. **Not yet
Finalized** — only the user declares that.

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
- **Form value:** `name` submits as `name[]`, start first (`RangeSlider`'s convention), through each end's hidden input.
- **Names:** the group takes `aria-label`/`aria-labelledby` (a `FormField` supplies them); the ends are named
  "Start time" and "End time" (`labels.start`, `labels.end`, in the same object as `TimePicker`'s labels). `id` goes
  on the start field's first segment. `onClear(end)` says which end.
- **No overnight range.** The rule is "end is not before start", so 22:00 to 02:00 reads as invalid; the Docs page
  says to use two pickers for that.

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
