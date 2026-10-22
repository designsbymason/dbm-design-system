# 0112 — An interactive control's accessible name holds its visible text as whole words, in order, over a name that only means the same

**Status:** Accepted · **Date:** 2026-10-21

## Context
WCAG 2.5.3 (Label in Name, Level A) says the accessible name of a control with visible text contains that text, so a speech-control user who says what they see reaches it. Several components passed a looser reading ("the name means the same"): a month button shown as "Jan" named "January", an avatar shown as "JD" named "Jane Doe", a day shown as "20" with a price under it named "Tuesday, October 20, 2026, $80", a filter shown as "Status 2" named "Status, 2 active". Storybook 10.6 ships axe-core 4.14, whose `label-content-name-mismatch` rule checks the strict reading, and it failed 23 stories. The rule reads both texts as lower-case words (punctuation and brackets are separators or dropped), and requires the visible words to appear in the name whole, together and in order.

## Decision
- **A control's name contains its visible words whole and in order.** A part of a word ("Fav" in "favorite", "Jan" in "January") is not in the name. The visible words may sit anywhere in the name, so the name can still lead with what a screen reader should say first.
- **The fixes, by component:** `Avatar` as a button shows initials, so its own computed name is "Jane Doe, JD" (the name first, the letters after; a name you pass is left as written, and an image shows no text); the `Calendar` month buttons are named "Jan, January" (just "May" where the two match); a `Calendar` day whose marker draws text is named "20 $80, Tuesday, October 20, 2026"; `TableToolbar.Filter` puts a space before its count and is named "Status, 2 active", or "Tags 99+, 1,284 active" past `max`, so the name holds what is shown; and `IconButton`'s development warning for a caption missing from the name now reads whole words, as the checker does, where it had matched a substring.
- **Authors of a name are told, not guessed for.** `CalendarMarker.label` says to start with the marker's visible text, and `IconButton` warns when `label` is not in `aria-label`.

## Alternatives considered
- **Hold axe-core at the older version.** Rejected: the rule is a Level A criterion, and the older version only hid the failures.
- **Hide the visible text from the check** (a CSS-drawn label, or `aria-hidden`). Rejected: `aria-hidden` text still counts for the rule and for a speech-control user, who sees it; a CSS-drawn label cannot hold content a consumer passes.
- **Show the full month name.** Rejected: the grid is sized for the short one, and the name needs only to hold it.
- **Make the name only what is visible** ("20" for a day). Rejected: the day's name must still carry the full date.

## Consequences
- A name some tests and consumer code match exactly changes: "Jane Doe" becomes "Jane Doe, JD" for an avatar button showing initials, and "October" becomes "Oct, October" for a month button. A name query with a regular expression or the words themselves is unaffected.
- A marker with `content` and a `label` that does not start with the content's text is not made to match; the Docs say to start it so.

## Related
`05-component-api-conventions.md`; ADR-0098 (`IconButton`'s caption); `component-reviews/Avatar.md`, `Calendar.md`, `IconButton.md`, `TableToolbar.md`, `AvatarGroup.md`, `DatePicker.md`.
