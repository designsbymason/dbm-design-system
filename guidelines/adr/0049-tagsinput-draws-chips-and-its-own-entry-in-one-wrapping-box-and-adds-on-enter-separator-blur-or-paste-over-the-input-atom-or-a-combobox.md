# 0049 — `TagsInput` draws its chips and its own entry in one wrapping box, and adds a tag on Enter, a separator, blur or paste, over the `Input` atom or a `Combobox`

**Status:** Accepted · **Date:** 2026-10-10

## Context
`TagsInput` is a list of short, typed values shown as removable chips. Three things had no precedent in the
library: whether the entry is the `Input` atom, what turns typed text into a tag, and how a person moves among the
chips. The inventory also said the component "builds on `Combobox`", which is not built and which the
component's own row (composes `Tag` and `Input`, standalone beside `MultiSelect`) contradicts.

## Decision
**The chips and the entry share one bordered, wrapping box, and the entry is a native `<input>` of the
component's own**, drawn with `Input`'s tokens step for step (font size, inline padding, border, ring). `Input`'s
box is one flex row that never wraps and has a `prefix` slot that doesn't shrink, so chips placed in it overflow
rather than wrap, and the typing area can't follow the last chip onto a new line. The chips are `Tag`s with their
own named remove buttons, in a real `<ul>`/`<li>` list that is `display: contents`, so the list is announced with
exactly as many items as there are tags and the entry sits outside the count.

**A tag is added by Enter, a typed separator (comma by default, configurable), leaving the field (`addOnBlur`,
default on), or a paste that is split at the separators, line breaks and tabs.** Enter with nothing typed does what
Enter does in any field, so a surrounding form can still submit. A refused tag (a repeat, past `maxTags`,
`validate`) stays in the entry with an announced message so it can be fixed. The value is a `string[]`, a new
array on every change, and `name` submits one hidden input per tag.

**Tab goes through each chip's remove button, then the entry**, the same arrangement as `TableToolbar`'s active
filters. Backspace on an empty entry removes the last tag. After a chip is removed focus goes to the entry if the
person was in the field, and the typed text is not made into a form member (the entry has no `name`).

**There is no suggestions list.** The value, the one swappable entry and the labels leave room for `Combobox` to
supply one later without changing the chip row.

## Alternatives considered
- **The `Input` atom as the entry.** Reuses the atom but can't wrap; the chips would sit in its `prefix` and push
  the typing area off the row. Taking the box out of `Input` would be a change to a Finalized atom for one consumer.
- **Build on `Combobox`.** Gives suggestions on day one, but blocks the last molecule on the organism tier and
  fixes a suggestions API before `Combobox` has one. A tags field with free text is a different control from a
  multi-select (a group of chips and a text input, not a `combobox` with a `listbox`), so it should not inherit
  that role.
- **A roving arrow-key model for the chips** (one tab stop). Fewer stops with many tags, but it needs the remove
  button taken out of the tab order, which `Tag` can't do without a change, and it hides the chips from a screen
  reader's browse order. Revisit with a change to `Tag` if long lists prove a problem.
- **Backspace selects the last chip first.** Safer against a slip, but a second keystroke for the common case, and
  a removed tag is trivially re-added.
- **A `role="none"` list item holding the entry, inside the list.** Broke the `list` role's required children
  (axe `aria-required-children`); a `display: contents` list with the entry outside it passed.

## Consequences
- The box is within a few pixels of an `Input`'s height at each size (the chip row is taller than `Input`'s line, so
  the block padding is the nearest token step), and an invisible, zero-width chip keeps the row at chip height so
  adding the first tag moves nothing.
- A new component token, `tags-input.entry-min-width` (the narrowest the typing area gets before it wraps).
- `display: contents` on a list relies on the browser exposing the list role through it; it did in Chromium and
  passes axe. Not run in Safari or on a device.
- A pending, unconfirmed value is added by leaving the field, so a form's submit button (which takes focus on
  press) reads it as a tag before the form is read.

## Related
`05-component-api-conventions.md` §3; [ADR-0008](./0008-closebutton-reserved-for-modal-surfaces.md) (a local
remove control); [ADR-0034](./0034-tabletoolbar-is-a-stateless-group-of-parts-with-toolbars-inside-it-not-one-toolbar.md)
(chips in a row of removable controls); [ADR-0046](./0046-calendar-multiple-is-a-list-of-dates-a-name-submits-hidden-inputs-and-pointer-gestures-are-shortcuts-over-a-sorted-set-object-or-required-gestures.md)
(hidden inputs per value); [TagsInput.md](../component-reviews/TagsInput.md).
