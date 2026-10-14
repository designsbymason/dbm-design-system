# 0075 — `Form` shows its own messages, moves focus to the first invalid control and announces the count, over the browser's validation bubbles

**Status:** Accepted · **Date:** 2026-10-13

## Context
A native form refuses an invalid submit by showing one bubble beside the first invalid control, in the browser's words and styling, for a moment. It can't be styled, translated by the page, tied to a field's error slot or listed, and a screen reader hears it unevenly. The question was what `Form` does with that, and what a refused submit does for focus and for assistive technology.

## Decision
- **`noValidate` is on by default.** The form sets it on the `<form>`, runs validation itself (reading the browser's rules and messages, [ADR-0074](./0074-form-reads-the-dom-for-values-and-the-browsers-rules-and-calls-the-rules-you-write-over-a-value-store-or-a-schema-library.md)) and shows each message in the field's own error slot. `noValidate={false}` hands the checks back to the browser.
- **A refused submit focuses the first invalid control in page order** (`focusTarget="field"`, the default) and, from a live region that was already in the page, announces the count ("2 errors."). The field's own name and message are then read by focus and `aria-describedby`. `focusTarget="summary"` focuses the `Form.Summary` instead, `false` leaves focus alone.
- **The summary is not a live region.** It would announce the same list a second time; its job is to be reached and to link to each control.
- **Until a submit has been refused nothing is shown** (`validateOn="submit"`); afterwards every field is checked as it is edited, so an error clears the moment the value is right. `"blur"` and `"change"` bring the checks forward.
- **A promise from `onSubmit` holds the form busy**: `aria-busy`, every field disabled through the same context as `disabled`, `Form.Submit` loading, and a second submit ignored. Disabling drops focus in a browser, so the control that had it gets it back when the promise settles, only if nothing else has it.
- **A submitter marked `formnovalidate` skips the checks**, as it does natively.
- **Events from a form portaled inside this one are ignored** (React bubbles a portal's events to its React parent).

## Alternatives considered
- **Leave the browser's bubbles on** and add messages afterwards. Rejected: two messages for one problem, and the page's wording only on the second.
- **Disable the submit button until the form is valid.** Rejected: a person can't find out what is missing from a button that won't say; it is also a known accessibility trap.
- **Announce each message in a live region as it appears.** Rejected: the focused field's message is read already, and a region per message reads every one twice.
- **Don't disable fields while busy**, only the button. Rejected: a field edited while its value is being sent is a value that was never sent.

## Consequences
- A control the browser calls invalid but that has no `FormField` has no error slot: its message is in the summary only, and it is focused.
- The summary's links take the alert's text colour rather than the link colour (the link colour measured 4.49:1 on the danger tint); they stay underlined.

## Related
`06-engineering-standards.md` §9 (focus handed back only if still there, live regions announce a change, a press in a portaled child); [Form.md](../component-reviews/Form.md).
