# 0051 — `TagsInput` collapses to the width by measuring an unseen copy of its chips, over CSS-only clipping or a fixed count

**Status:** Accepted · **Date:** 2026-10-10

## Context
`maxVisible` shows a fixed number of chips with "+N more". A field whose width changes (a column, a resizable panel,
a phone turned sideways) wants the opposite: show as many chips as fit on one line, and let the count follow the
width, so the row never wraps while it is idle. Nothing in the library measured the width of its own content to
decide what to render before this.

## Decision
**`overflow: "wrap" | "collapse"` (default `wrap`).** With `collapse`, while the field is idle (the entry and the
chips don't have focus, and it hasn't been opened with "+N more") the row is one line: as many chips as fit are
drawn, and "+N more" stands for the rest. `maxVisible` stays and becomes an upper cap. While the field is used it
shows and wraps every tag, as `maxVisible` already does.

**The count is worked out from an unseen copy.** A zero-size, clipped, `aria-hidden`, `visibility: hidden` frame
inside the box holds a copy of every chip and of the "+N more" button at its widest. A layout effect (before
paint) and a `ResizeObserver` on the box and on the copy read their natural widths, the room the row may fill (the
box's inner width less the counter and the clear-all button, which share the line) and the gap, and
`fitCount(widths, moreWidth, available, gap)` (pure arithmetic, unit-tested) returns how many fit, never fewer
than one. State is set only when the number changes.

**Idle collapse mode is `flex-wrap: nowrap` with `overflow: hidden`**, and the entry gives up its minimum width, so
a row that a late font or a narrower box leaves slightly over is cut at the border rather than wrapped.

## Alternatives considered
- **CSS only (one line, `overflow: hidden`, no count).** Needs no script, but the hidden chips are simply cut, with
  no "+N more", so a person can't tell tags are missing or reach them.
- **Measuring the visible chips only.** Cheaper, but the widths of chips that aren't drawn are unknown, so the count
  can't grow back when the box widens without a render of everything.
- **A fixed `maxVisible` per breakpoint.** Responds to the viewport rather than the field, and needs the owner to
  know the chip widths.
- **Always measuring, in `wrap` mode too.** Unneeded cost for the default.

## Consequences
- The copy doubles the chip DOM in `collapse` mode only (hidden from assistive technology, the tab order and the
  accessibility tree, with no size). A very long list pays for it.
- The first paint is correct in a browser (the effect runs before paint). A server render shows every chip, clipped
  to one line, until the client measures.
- Each render in `collapse` mode reads layout once. State changes only when the count does, so it settles.
- First use of `ResizeObserver` in a component; where it is missing the row falls back to the count measured at
  mount.

## Related
`06-engineering-standards.md` §4 (performance), §9 (a responsive collapse never removes the focused control: the
row opens, rather than hides, while a chip or the entry has focus); [ADR-0049](./0049-tagsinput-draws-chips-and-its-own-entry-in-one-wrapping-box-and-adds-on-enter-separator-blur-or-paste-over-the-input-atom-or-a-combobox.md);
[ADR-0050](./0050-tagsinput-chips-are-one-tab-stop-with-arrow-key-movement-and-tag-lets-its-remove-button-leave-the-tab-order.md);
[TagsInput.md](../component-reviews/TagsInput.md).
