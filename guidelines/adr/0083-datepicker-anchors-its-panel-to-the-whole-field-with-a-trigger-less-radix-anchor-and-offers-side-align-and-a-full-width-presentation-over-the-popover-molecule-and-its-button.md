# 0083 — `DatePicker` anchors its panel to the whole field with a trigger-less Radix anchor, and offers `side`, `align` and a full-width presentation, over the `Popover` molecule and its button

**Status:** Accepted · **Date:** 2026-10-17 · **Amended 2026-10-17** — where the shared hook lives; the decision itself is unchanged

## Context
[ADR-0082](./0082-datepicker-is-a-single-date-segmented-field-with-a-calendar-popover-and-an-explicit-format-over-a-masked-text-input-a-range-mode-or-a-date-time-field.md)
anchored the calendar to its button through the `Popover` molecule, and named the cost: a panel wider than a narrow field started to
the left of it, collision-shifted, and `Popover` has no part for anchoring to anything but its trigger
([ADR-0017](./0017-popover-omits-anchor-sub-part-pending-upstream-fix.md)). `Combobox` had since shown that a Radix
`Popover` with an anchor and no trigger places a panel correctly and works inside a `Dialog`
([ADR-0077](./0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md)),
and a phone needs a presentation that spans the screen
([ADR-0081](./0081-combobox-offers-a-full-width-presentation-measured-against-the-visual-viewport-over-a-docked-bottom-sheet.md)).

## Decision
`DatePicker` uses `@radix-ui/react-popover` directly: `Root` (open state held by the field), an `Anchor` around the whole field,
and `Content` in a `Portal`, with **no `Trigger`**. The calendar button is a plain button that toggles the state and carries
`aria-haspopup="dialog"`, `aria-expanded` and, while open, `aria-controls`. Because Radix has no trigger to give focus back to,
the field does it: to the button on close, except after a press somewhere else, where focus is left where the person put it. A press on the
button is not an outside press, so it toggles rather than closing and reopening.

The panel is the field's own: the same surface, font, shadow and `popover` z-index step as `Popover`'s and `Combobox`'s, in the
field's stylesheet, so it is not the `Popover` molecule's panel.

**`side` (`"bottom"`, `"top"`) and `align` (`"start"` by default, `"center"`, `"end"`)** place it against the field.
**`presentation`** is `"anchored"` (default) or `"full-width"`, and takes a breakpoint map like `Combobox`'s: the panel spans the
visible screen with a small gap at each edge, the calendar centred in it, and opens on whichever side has room for a calendar's
height once an on-screen keyboard is counted. The room is measured by `useViewportRoom`, shared with `Combobox` from `internal/`. *(Amended 2026-10-17: this first said it was imported from `Combobox`'s folder for now, since moving it touched a Finalized component; the maintainer approved the move to `internal/`.)* It is opt-in; making it the default
below `sm` waits for a real device, as ADR-0081 says.

## Alternatives considered
- **Keep the `Popover` molecule and shift the panel by the button's offset** (`alignOffset` worked out at open). Rejected: it
  re-measures on every resize and is wrong in a right-to-left page without a second branch.
- **Add an `Anchor` part to the `Popover` molecule.** Rejected: ADR-0017's bug is the trigger's implicit anchor racing a real
  one, and the molecule keeps a trigger.
- **A docked bottom sheet for phones.** Rejected for the reasons in ADR-0081.

## Consequences
- `DatePicker` is not built on the `Popover` molecule any more; its panel chrome is its own.
- No new dependency.
- Real-browser checks cover the start edge lining up with the field, `align`/`side`, a real mouse on the button toggling, a real
  mouse choosing inside a `Dialog` and a `Popover`, and the full-width panel's width and edges. The behaviour of an on-screen keyboard on a
  real phone is untested here.

## Related
[ADR-0017](./0017-popover-omits-anchor-sub-part-pending-upstream-fix.md), [ADR-0054](./0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md),
[ADR-0077](./0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md),
[ADR-0081](./0081-combobox-offers-a-full-width-presentation-measured-against-the-visual-viewport-over-a-docked-bottom-sheet.md);
`component-reviews/DatePicker.md`.
