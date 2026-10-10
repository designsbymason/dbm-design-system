# 0048 — `EditableText` swaps a button for a field and reports only what is committed, over an always-present field or a value reported per keystroke

**Status:** Accepted · **Date:** 2026-10-10 · **Amended 2026-10-10** — a save in flight has its own prop; the decision itself is unchanged

## Context
`EditableText` is a value that reads as text and becomes a field when activated. Four things had no precedent in the
library: what the resting element is (and so what a screen reader and the tab order see), when the owner is told
about a change (an `Input` reports each keystroke; an edit that can still be abandoned is not a change yet), what
happens to an unfinished edit when focus leaves, and where `ref`, `id` and `aria-*` go when the element that
carries the role is replaced by another one.

## Decision
**The resting text is a native `<button>`, swapped for an `Input` (or a `Textarea` with `multiline`) while editing.**
The button's name is the field's name plus the visible value (so the visible text is in the name) and "Edit" is its
description. Focus is moved by hand across the swap: onto the field with the value selected, and back onto the
button after a keyboard commit or cancel, never after a press elsewhere. The text and the field are drawn as the
same box, so the swap changes nothing around it; a single-line value ends in an ellipsis rather than wrapping.

**`onValueChange` reports a commit, once.** Enter, a confirm button, or leaving the field under
`blurBehavior="commit"` (the default) commits; Escape, a cancel button, or leaving under `blurBehavior="cancel"`
abandons. An unchanged commit reports nothing. A refused value (`required`, `validate`) keeps the field open with a
message. A multi-line value commits on Ctrl or Cmd + Enter, since plain Enter adds a line.

**Editing and value are separately controllable, and a gesture only asks** ([ADR-0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md)'s
rule): with `editing` passed, Enter or Escape calls `onEditingChange(false)` and leaves the prop alone, so an owner
can keep the field open (a save that failed). With `value` passed, a commit calls `onValueChange` and the text
keeps showing the prop.

**`ref`, `className` and `style` are on the outer box in both modes; `id`, `aria-*` and `data-testid` are on whichever
element is showing.** The outer box is always there, and the carrier of the role is not stable, so the two groups
cannot share an element (`05-component-api-conventions.md` §3's split, applied to a box that is the same in both
modes). A `FormField`'s render-prop spread therefore works, and a click on its label starts editing.

**Escape is stopped at the field while editing** so a handler on a parent in the page doesn't also act on it.

## Alternatives considered
- **A field that is always there, styled to look like text.** One element, no swap, no focus management. But it is a
  text input in the tab order and the accessibility tree for every value on the page (a table of fifty cells is
  fifty fields), a screen reader says "edit text" for what is a label, and there is no moment at which a value is
  committed, so `onValueChange` would be per keystroke.
- **Report every keystroke and let the owner debounce** (what `Input` does). An edit that Escape can still discard
  would have been announced to the owner already, and the owner would have to undo it.
- **Cancel on blur by default.** Loses what the person typed whenever they click away; the opposite default makes the
  destructive outcome the explicit one.
- **A `<span role="button">` or a div that handles clicks.** Loses Enter and Space, the disabled state and the form
  semantics for free.
- **`ref` to whichever element is showing.** A ref that changes element at every activation is hard to hold.

## Consequences
- A form that submits while an edit is open is safe: leaving the field (clicking submit blurs it) commits first.
- `required` refuses an empty commit, but a value that was never edited can still be submitted empty through `name`'s
  hidden input; a hidden input cannot validate (`ADR-0030`'s reason). Documented rather than worked around.
- An overlay that listens for Escape at the document level (a Radix dialog does, in the capture phase) still sees
  the key, because a handler on the field runs after it. The Docs page says to close such an overlay only when no field
  inside it is open.
- A save that can fail is the owner's: keep `editing` controlled and open until the request answers, and set `isLoading` meanwhile so the field is set aside and shows a spinner. *(Amended 2026-10-10: this originally said only to keep `editing` controlled and open, because there was no busy state; `isLoading` was added in the round that followed.)*

## Related
`05-component-api-conventions.md` §3; [ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md)
(a composite field reports focus once, as one field); [EditableText.md](../component-reviews/EditableText.md).
