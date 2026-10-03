# TimePicker

Molecule, Inputs & Forms category. Item 26 of the itemized molecule build order in `04-component-inventory.md`
— a time-of-day field with a popover picker. Built 2026-10-03. **Not yet Finalized** — only the user declares
that; this file records what was built, checked and found.

The inventory row had no notes, so the interaction model was an open fork and was put to the user (four
options, plus the value shape, the hour cycle and the first version's scope). The answers, and the alternatives
they were chosen over, are [ADR-0029](adr/0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md).

## What it is

A single (non-compound) component. A `role="group"` of separate segments — hour, minute, optional second, and
AM/PM in the 12-hour cycle — each an `<input role="spinbutton">`, then an optional clear button and a button
that opens a `Popover` of scrollable listbox columns. The value is a 24-hour string, `"HH:mm"` (or `"HH:mm:ss"`
with `showSeconds`), `""` while the field is empty or only partly filled.

- **Typing** follows a native time field: a digit that can't start a two-digit number is the whole number and
  moves on; one that can waits for a second; a digit that doesn't fit is carried into the next segment ("1" then
  "3" in the 12-hour hour is 01 and a 3 in the minutes). Digits of any script are read, `Backspace` clears a
  segment, `ArrowUp`/`ArrowDown` step (wrapping, and along the `step` grid in the minutes), `Home`/`End` go to the
  ends, `ArrowLeft`/`ArrowRight` and a colon move between segments, a letter chooses AM or PM. Text inserted all
  at once (a phone's keyboard, autofill, a paste: "9:5 pm") fills the segments in order.
- **The model is pure**, in `src/internal/time/` (`timeValue.ts`, `segmentEntry.ts`) with its own tests: parsing
  and formatting, the draft-to-value mapping through both cycles, stepping, the digit entry table, the range
  overlap used by the picker. The component keeps a *draft* of the segments beside the committed value, because a
  field is mostly partly filled; the value wins whenever it stops matching the draft (set from outside, an owner
  that ignored a change, a changed `hourCycle`), adjusted during render so no frame shows the old time.
- **The picker** is `Popover` with `align="end"` and no arrow: an hour, a minute, an optional second and an AM/PM
  `listbox` (`option`, `aria-selected`, `aria-disabled`). Choosing commits at once and fills the segments it left
  empty with their first value, so a pick is always a whole time; focus opens on the chosen hour; each column is
  one tab stop with arrow keys inside it (which *choose* as focus moves, a native listbox's behaviour) and left and
  right between columns; `Enter` closes, `Escape` closes and returns focus to the button. An option no allowed time
  can be reached through (by `min`/`max`) is disabled, computed from time-interval overlap, not per option.
- **Constraints flag, they don't refuse.** A time outside `min`/`max`, or a minute off the `step`, sets the error
  state and `aria-invalid` and is still reported; the picker only offers what is allowed. A first digit of a
  two-digit segment is already a whole time (a `0` is `00`), so `onValueChange` can report an in-between value
  before the second digit; the Docs page says so.
- **Size and chrome** are `Input`'s: the same border, radius, focus ring (on `:focus-within`) and height at every
  size, measured equal to an `Input` and a `Button` in a real browser. The segments are always left to right.
- **Everything the field says is `labels`** (merged with `mergeDefined`), digits go through `formatNumber`
  (ADR-0021), and the hour cycle is `hourCycle`, never the locale.

New component tokens, `component/time-picker.json`: `segment-width` (2.25ch), `period-character-width` (1.5ch),
`column-max-height` (14rem). The picker column's minimum width is the existing `space.16`.

## Design decisions made during the build

- **The segments are real `<input>`s, not `contenteditable` spans**, so a phone's number keyboard appears. That
  forced the `onChange` path (a mobile keyboard may send no usable key), which is the same typing code fed the
  inserted text.
- **`id` goes on the first segment** so a `FieldLabel`'s `htmlFor` focuses it; the segments keep their own
  `aria-label`s, which win over the label for their names. `aria-labelledby` and `aria-describedby` go on the group.
- **Required and invalid are on the segments, not the group.** The `jsx-a11y` lint rule found the first draft
  put `aria-invalid` and `aria-required` on `role="group"`, which doesn't take either; they are states of the
  spinbuttons, so each segment carries them.
- **`ScrollArea` is not used for the picker columns** (atom-reuse audit). It makes an overflowing region a tab stop
  of its own, right for reading content and wrong for a listbox that scrolls by its arrow keys, so each column
  is a plain scrolling `div` with a token-coloured thin scrollbar. **`IconButton` is not used** for the clear and
  picker buttons for `Input`'s reason (its boxes are as tall as a `Button`); both are local, with `Input`'s padding
  and compensating margin per size (`CloseButton` is reserved for modal surfaces, ADR-0008). **`Input` itself can't
  be wrapped**, being one `<input>`, so its box is redrawn from the same tokens. `Popover` and `Icon` are reused.
- **The Radix-primitive prop audit** (for `Popover`, the wrapped primitive): `open`/`onOpenChange` mirrored,
  `modal` left off (a picker coexists with the page), `align`, `hideArrow`, `onOpenAutoFocus` (focus goes to the
  chosen option, not the panel), `aria-label` and `className` used; the placement props are `Popover`'s own scope.
- **Segment colours:** the focused segment and the chosen option are a solid `bg.brand` fill with `text.on-brand`,
  the clearest "this one" that stays AA. No new pairing: `text.on-brand`/`bg.brand` is 6.08–8.51:1 across the four
  themes, `text.primary` on `bg.surface` 13.5–14.1, on the hover `bg.neutral-subtle` 9.7–13.5, `text.tertiary`
  (the placeholder, the colon) on `bg.surface` 4.70–8.21, `icon.default` on the hover fill 4.51–5.86 (non-text),
  measured in a live browser in all four themes.

## Findings

- **AM/PM was cut off** ("AN"): sized from the digits' width in `ch`, and an M is about 1.6 of them. Found by
  looking at a screenshot of the sizes. It has its own per-character token now, and a real-browser check that no
  segment's text overflows its box at any size, with an `a.m.`/`p.m.` label too.
- **A segment exactly two `ch` wide scrolled sideways** for "59" at xs: the font's digits aren't one width. The
  token has a quarter of a digit to spare, found by the same overflow check.
- **The clear and picker buttons were 20 × 20px at xs**, under WCAG 2.5.8's 24 (`Input`'s own clear button has the
  same arithmetic; not touched here). Held to `space-6` at xs with the margin worked from that, so the row is still
  a `Button`'s height; a check measures every button at every size.
- **Text inserted all at once was processed as its last character.** Found by typing into the field through the
  browser tool, which inserts the whole string in one `input` event: "041" gave hour 01. The typing code now takes
  a string and threads the draft, the pending digit and the current segment through it; it also handles a pasted
  "9:5 pm", and a separator only finishes a segment that has been typed into, so "9:30" isn't read as skipping the
  minutes. Covered in jsdom and by a real-browser story using the browser's own text insertion.
- **A carried digit left focus behind** ("1" then "3" moved the 3 into the minutes but left focus on the hour); found
  by a unit test.
- **React bubbles a portaled event to the portal's React parent**, so a press on a picker option reached the
  field's own press handler and was sent to a segment instead of choosing. Fixed by only acting on a press whose
  target is inside the field's own DOM; the unit test for choosing from the picker caught it. The press handler
  itself (a press on the padding or a colon focuses the nearest segment, as a native time field does) makes the
  whole box a target.
- **The picker's labels were padded twice** ("0001"): the formatter already pads.
- **Lint:** `aria-invalid`/`aria-required` on a group (above), a pointer handler on a non-interactive element
  (disabled with the reason: it is a convenience, the segments are keyboard-operable), and `autoFocus`
  (the component's own prop, as in `Slider`).

## Verified

- Unit: the pure model (about 40 cases: every minute of the day round-trips, every hour through both cycles with and
  without seconds, the digit-entry table, stepping and wrapping, range overlap), and `TimePicker.test.tsx` (about
  70): segments and ranges announced, typing and carrying, stepping and the ends, an owner that ignores a change,
  a value set from outside and an unreadable one, the hour cycle changing, a half-typed time surviving, the hidden
  form input, `formatNumber` and `labels` (with an `undefined` entry), validity, disabled and read-only, the clear
  button, the picker end to end (what it lists, the chosen option and tab stop, committing and filling defaults,
  arrow keys and `Enter`/`Escape`, disabling by range, skipping disabled options, controlled open), `FormField`
  wiring and a label click, standard props and spread order, `StrictMode`, and axe closed (four configurations)
  and with the picker open.
- Real browser (Chromium, hidden `!dev` stories): height equal to `Input` and `Button` at all five sizes, width
  unchanged as it fills, one tab stop per segment then the buttons then the next control, the chosen hour and
  minute scrolled into view, the option's focus ring inside its column, the picker staying inside a phone's width
  with four columns, right to left (digits keep their order, the buttons follow the page, `ArrowRight` still goes on
  to the minutes), forced colours (the focused segment and chosen option in `Highlight`/`HighlightText`, the box
  still bounded), the picker by keyboard, text insertion, no segment clipping its text, every button 24px, and a
  press on the padding focusing the nearest segment. **Broken on purpose, to see them fail:** the height padding,
  the segment width, the forced-colours block, and the scroll-to-chosen code each failed their check.
- Live in Storybook: both Docs pages (every template heading, Properties tables with every Default filled and no
  empty description, Playground controls, every "Show code" settled), the sizes, the open picker, a real focus and
  typed digits in dark mode, and the contrast figures above in all four themes.
- Snippets typechecked against the real components (a planted bad prop failed it).
- Whole package: `eslint`, both typechecks, `pnpm build`, the bundle-size check (TimePicker 5.90KB JS / 1.79KB CSS
  gzipped, `TimeRangePicker` 6.32 / 1.84), the Foundations token-coverage check, 4,995 unit tests, 940
  Storybook-project tests, the 8 visual tests, and `pnpm audit` (only the already-accepted `braces` advisory).

## Not checked, or open

- **A real phone keyboard, a screen reader, Safari and Firefox.** Insertion is exercised with Chromium's own text
  insertion; announcements are reasoned from the ARIA roles, not heard.
- **WCAG 2.5.8 for the segments themselves.** At 16–24px wide they are under 24 × 24; the picker's options and
  button are the equivalent control for a pointer, and a press on the box's padding is sent to a segment, but with
  `showPicker={false}` the segments are the only pointer targets. Recorded rather than fixed (a native time field
  has the same segments).
- **A picker option scroll that moves the page.** `scrollTop` is set on the column, not `scrollIntoView`, so the page
  doesn't move; not tried inside a scrolling ancestor with `hideWhenDetached`.
- **`dir` below `body`.** The picker is portaled to `body`; same as `Popover` and `HoverCard`.
