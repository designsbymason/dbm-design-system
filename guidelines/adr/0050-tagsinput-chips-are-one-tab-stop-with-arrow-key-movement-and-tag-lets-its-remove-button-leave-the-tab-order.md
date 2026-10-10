# 0050 — `TagsInput`'s chips are one tab stop with arrow-key movement, and `Tag` lets its remove button leave the tab order

**Status:** Accepted · **Date:** 2026-10-10

## Context
[ADR-0049](./0049-tagsinput-draws-chips-and-its-own-entry-in-one-wrapping-box-and-adds-on-enter-separator-blur-or-paste-over-the-input-atom-or-a-combobox.md)
chose "Tab goes through each chip's remove button, then the entry", the arrangement `TableToolbar`'s active filters
use, and recorded a roving model as the alternative to revisit with a change to `Tag` if long lists proved a
problem. A field that accepts pasted lists is where they do: fifty chips are fifty tab stops before the entry that
a person came to type in.

## Decision
**The chips are not tab stops. The field is one stop, at the entry, and the arrow keys move among the chips.** From
the start of the entry, the arrow key that points toward the chips (left in a left-to-right page, right in a
right-to-left one) moves onto the last chip; on a chip, the arrow keys, Home and End move along the row, past the
last chip returns to the entry, Delete or Backspace remove the chip that has focus and leave focus on the one that
took its place (the entry after the last), and Escape returns to the entry. A pointer press on a remove button
hands focus to the entry, as before. The entry's description says how to reach the chips once there are some.

**`Tag` gains `removeTabStop` (default `true`).** With `false`, its real remove button has `tabindex="-1"`: still
focusable by script and by a press, still a named button, but not in the tab order. The default changes nothing
for any existing caller, so this is an additive change to a Finalized atom.

## Alternatives considered
- **Keep tabbing through every chip's button.** Simple and precedent-backed, but the length of the tab sequence
  grows with the list; rejected for a field built for lists.
- **Take the buttons out by editing the DOM from the parent.** No change to `Tag`, but a parent setting an
  attribute on a child's node is brittle and invisible to React.
- **Make each chip an interactive `Tag` (`role="button"`, focusable) instead.** Reuses a mode `Tag` already has,
  but gives each chip a pointless activation and puts the remove glyph in the decorative branch, losing its own
  named button.
- **A `listbox`/`grid` role for the row.** Heavier semantics than a removable chip needs, and a `grid` asks a screen
  reader user to learn another model.

## Consequences
- A tab stop fewer per chip, at the cost of discoverability: the entry's description names the key, and the
  Docs page states it. The chips remain reachable in a screen reader's browse mode as named buttons.
- `TableToolbar`'s active filters keep tabbing through each chip (it passes nothing new).
- The left arrow from the very start of the entry no longer only moves the caret; it moves nowhere when there are
  no chips.

## Related
`05-component-api-conventions.md` §3; [ADR-0049](./0049-tagsinput-draws-chips-and-its-own-entry-in-one-wrapping-box-and-adds-on-enter-separator-blur-or-paste-over-the-input-atom-or-a-combobox.md);
[Tag.md](../component-reviews/Tag.md); [TagsInput.md](../component-reviews/TagsInput.md).
