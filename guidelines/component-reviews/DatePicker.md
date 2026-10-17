# DatePicker — review findings

Ninth organism, built 2026-10-17 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Not yet
Finalized:** the final review pass (`/review-component DatePicker`) has not been run, and only the user declares a
component Finalized. What follows is what was decided and found while building it.

## Decisions
- A single date in three segments with a `Calendar` popover, an explicit `format`, and no range or time part: [ADR-0082](../adr/0082-datepicker-is-a-single-date-segmented-field-with-a-calendar-popover-and-an-explicit-format-over-a-masked-text-input-a-range-mode-or-a-date-time-field.md).
- The field's box is drawn exactly as `TimePicker`'s (its stylesheet's rules, with the AM/PM and wheel rules removed and a four-digit year segment added), so it matches `Input`'s height at every size and draws its focus ring on its own edge. `DatePicker` is in the field-focus-ring check list (`05` §6).
- The calendar is `Calendar` in single mode; `min`, `max`, `isDateDisabled`, `weekStartsOn`, `showTodayButton` and `today` are `DatePicker`'s own props and everything else goes through `calendarProps` (the props the field owns are left out of its type).
- Segment entry is its own module (`internal/date/dateEntry.ts`, with its own tests), not shared with `TimePicker`'s; the reasons are in ADR-0082.
- Two component tokens, `date-picker.segment-width` and `date-picker.year-width` (`03` token table). No other new token; the panel's width is `Radix`'s available width, and the rule for it is doubled (`.panel.panel`) so it beats `Popover`'s `max-width` whatever order the stylesheets load in.
- Bundle: 14.37KB JS / 4.05KB CSS gzipped, so a 16KB JS override with its reason in `check-component-bundle-size.mjs`.
- No new dependency.

## What was found while building it
- **Carrying a digit into the next segment lost it.** Typing "1" then "3" in the month finishes the month and carries the 3 into the day as a first digit; moving focus to the day fired the month's blur, which cleared the *shared* pending-digit state, so a following "1" started the day afresh instead of making 31. The blur now clears only its own segment's digits. (`TimePicker` clears pending state in the same way on blur; its carry case is exercised by a test that doesn't type a third digit, so it was not changed here.)
- **A separator key moves on whether or not a digit was typed**, as in a native date field; the "only after a digit" rule applies to pasted and inserted text, where `touched` is meaningful.
- **A programmatic `.click()` did not open the calendar in the preview, a real click did**; the real-browser checks use a real pointer through the DevTools Protocol, as `Dialog.checks.stories.tsx` does.
- **The panel measured wider than the field and was shifted by collision handling** when the field is narrow. With the button as its anchor (`Popover` has no field-wide anchor, ADR-0017/0077) the panel's right edge meets the button's, so a field narrower than the 300px panel sees it start left of the field. Left as is, and named in ADR-0082.
- **Field height is `Input`'s, not `Button`'s:** the field is 2px shorter than a `Button` of the same size (as `TimePicker`'s is). Copy and the check say `Input`.
- **Calendar day state is on the cell, not the button:** `aria-disabled` and `aria-selected` are on the `td`, so tests read the day's `closest("td")`.

## Checks run (2026-10-17)
- `pnpm lint` (ESLint, both typechecks): clean.
- Unit project: `DatePicker` 172 tests across the component, server render and hydration (11 variants each), the docs-token guard and `dateEntry` (30), all passing, plus `storySnippets.test.ts`.
- Chromium Storybook project: 28 stories for `DatePicker` and its checks, plus the two new field-focus-ring cases, all passing. The checks cover the panel's place, font and z-index, a real mouse choosing a day inside a `Dialog` and inside a `Popover`, text inserted all at once through `Input.insertText`, the field's width and segments not moving as digits are typed, 24×24px targets and Input-matching height at all five sizes, right-to-left order, a keyboard round trip, focus not pulled back after a click elsewhere, controlled round trip and forced colours. The height check was broken on purpose once to see it fail.
- Docs page opened in a running Storybook: 11 sections, 14 canvases, the Properties table with every default as written, no error display; dark mode with the Emerald brand looked at with the calendar open.
- `pnpm build` and `check-component-bundle-size`: within budget.

## Open for the final review
- Not yet run: the §9 review as a prioritized list, light/dark across both brands at every size, a phone-width look at the calendar panel, and a screen-reader pass.
- The related-card preview scales a `Calendar` to half size with a transform; check it is still representative.
- A full-width phone presentation like `Combobox`'s ([ADR-0081](../adr/0081-combobox-offers-a-full-width-presentation-measured-against-the-visual-viewport-over-a-docked-bottom-sheet.md)) is not built (planned decision 5: later and additive).
