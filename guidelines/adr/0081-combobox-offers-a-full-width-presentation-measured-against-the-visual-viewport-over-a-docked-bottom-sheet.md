# 0081 — `Combobox` offers a full-width presentation measured against the visual viewport, over a docked bottom sheet

**Status:** Accepted · **Date:** 2026-10-16

## Context
On a phone the list under a narrow field is cramped, and an on-screen keyboard covers the bottom of the screen without
changing the layout viewport, so a layer positioned against it can open under the keyboard. The pattern that answers
both is a bottom sheet, but a sheet means the list leaves the field's side, and the architecture here keeps focus in the
field ([ADR-0077](./0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md)).

## Decision
A `presentation` prop, `"anchored"` (the default) or `"full-width"`, which takes a map like `side` does
(`{ base: "full-width", sm: "anchored" }`). `full-width` keeps the list floating from the field but spans the visible
screen with a small gap at each edge (the layer's collision shift places the edge), and opens above or below the field,
whichever has room. Room is measured from the **visual viewport**, which counts a keyboard, by a small hook
(`useViewportRoom`) that listens only while the list is open in this presentation. `side` is its first choice, kept while
that side has about five rows of room.

It is opt-in: nothing changes unless the prop is set. Making it the default below the `sm` breakpoint is left until it
has been tried on a real device.

## Alternatives considered
- **A docked bottom sheet.** Rejected for now: the layer positions its own wrapper with inline styles, so docking means
  overriding them, and it needs the keyboard's height tracked and the field scrolled into view above the sheet. The
  keyboard behaviour can't be verified without a real device, and a wrong guess leaves the field under the sheet.
- **A sheet that holds its own search field.** Rejected: that is a different component, and it breaks the field-keeps-focus
  design every other part relies on.
- **Full width by default on phones.** Deferred, for the verification reason above.

## Consequences
- Only the layout-viewport behaviour of an iOS or Android keyboard is untested in a real browser here: a test pins the
  logic with a mocked visual viewport, and real-browser checks cover the width, the edges and the side.
- `align` has no effect in `full-width`.
- A docked sheet can be added later as a third value without changing these two.

## Related
[ADR-0077](./0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md);
`component-reviews/Combobox.md`.
