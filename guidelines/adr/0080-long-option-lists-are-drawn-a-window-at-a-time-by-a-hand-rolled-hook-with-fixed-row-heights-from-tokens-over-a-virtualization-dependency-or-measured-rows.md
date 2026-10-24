# 0080 — Long option lists are drawn a window at a time by a hand-rolled hook with fixed row heights from tokens, over a virtualization dependency or measured rows

**Status:** Accepted · **Date:** 2026-10-16 · **Amended 2026-10-16** — a windowed option carries its group's name; the decision itself is unchanged · **Amended 2026-10-23** — the package it names was renamed; the decision itself is unchanged

*(Amended 2026-10-23: the `primitives` package was renamed `utils`, see [ADR-0114](./0114-the-shared-helpers-package-is-utils-not-primitives.md). Where this record says `primitives` or `packages/primitives`, read `utils` and `packages/utils`.)*

## Context
`06-engineering-standards.md` §4 makes windowing part of the definition of done for any component that can realistically
hold hundreds of rows. `Combobox` is the first: a country list is dozens, but a user, a record or a product search is
thousands, and drawing them all makes opening the list, filtering it and moving the highlight slow. `DataTable` will need
the same later. The project is dependency-light (`CLAUDE.md`), and no guideline said how windowing is done.

## Decision
A hook, `useWindowedList`, in `packages/primitives` (internal: it isn't re-exported by the components package), given the
item count and a function for each item's height. It returns the range of items to draw and the pixels of space to leave
before and after them; the caller puts that space as padding on an inner box, inside the box that scrolls. `Combobox`
turns it on above a fixed number of rows (100) and reads each row height from tokens
(`combobox.option-height.*`, and `combobox.option-height-described.*` for a row with a description).

Rows therefore have a fixed height by size: a one-line row and a row with a description are the two heights, and a custom
row (`renderOption`) must fit its row. A long label is cut with an ellipsis. The keyboard scrolls the highlighted row into
view through the hook, so the option the field points at with `aria-activedescendant` is always drawn.

## Alternatives considered
- **A virtualization library.** Rejected: a dependency for a few dozen lines, and it brings its own scroll container and
  positioning that would have to be fitted to a popper-positioned panel.
- **Measuring each row after it is drawn.** Rejected: it needs the rows to be drawn first, which is the cost being
  avoided, and it makes the scrollbar jump as estimates are corrected.
- **Drawing everything and relying on `content-visibility`.** Rejected: the rows still exist, so the highlight, counts and
  filtering still pay for every one, and the accessibility tree still holds them all.
- **Always windowing, however short the list.** Rejected: below the threshold the bookkeeping costs more than it saves,
  and a short list keeps real group elements.

## Consequences
- The padding that holds the space can't be on the scrolling box: a box can't shrink below its own padding, so a capped
  box with padding was as tall as the whole list. The spacers are on an inner box.
- In a windowed list, group headings are plain rows rather than grouped regions, and each option carries its group's
  name as hidden text after its own, so a screen reader reads "Item 1, Alpha".
  *(Amended 2026-10-16: this originally said a screen reader read every option but not the group name, because the
  group's own element isn't drawn. Giving each option the name was a small, additive fix.)*
- `DataTable` can reuse the hook, with its own row heights.
- A row's height must be a token: a size that changes with the root font size is read from the page when the list opens.

## Related
`06-engineering-standards.md` §4; [ADR-0078](./0078-combobox-takes-its-options-as-data-over-option-parts-mounted-as-children.md);
`component-reviews/Combobox.md`.
