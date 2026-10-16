# 0077 — `Combobox` floats its list with a Radix Popover that has an anchor and no trigger, over `Popover` itself, Popper with a dismissable layer, or a bare portal

**Status:** Accepted · **Date:** 2026-10-16

## Context
A combobox's list is attached to a text field and must never take focus from it: the person keeps typing while the
list is open. `Popover` can't do this. Its trigger is a button that toggles the panel, and
[ADR-0017](./0017-popover-omits-anchor-sub-part-pending-upstream-fix.md) removed its `Anchor` because, next to a
`Trigger`, the trigger's implicit self-anchoring wins and the panel lands in the viewport's corner. The list also has
to be usable from inside a `Dialog` ([ADR-0054](./0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md)):
a modal Radix layer turns off pointer events on everything outside it and counts a press on a foreign portal as an
outside press, so a list that is just a portal is dimmed, unclickable and closes the dialog.

## Decision
`Combobox` uses `@radix-ui/react-popover` directly, as `Root` (open state held by `Combobox`), `Anchor` (around the
field) and `Content` in a `Portal`, with **no `Trigger`**. Without a trigger there is no competing implicit anchor, so
ADR-0017's timing problem does not arise, and `Content` is a Radix dismissable layer, so it joins the layer stack a
`Dialog` or `Popover` host maintains. Focus never moves: `onOpenAutoFocus` and `onCloseAutoFocus` are prevented, and
`onFocusOutside` is prevented so a press on the list doesn't read as the field losing focus. The panel takes the
anchor's width from `--radix-popover-trigger-width`. Its `role="dialog"` is replaced with `role="presentation"`
(the listbox inside carries the semantics).

This was checked in a real browser before building: the panel sat at the anchor's left edge, 4px under it and the
anchor's width wide, and a real mouse (Chrome DevTools Protocol) chose an option from inside an open `Dialog`
without closing it.

## Alternatives considered
- **The `Popover` molecule.** Rejected: no anchor part (ADR-0017), a trigger that owns open state, and a dialog role.
- **`@radix-ui/react-popper` with `@radix-ui/react-dismissable-layer` directly.** The fallback if the chosen route had
  failed. It means two more direct dependencies, and `Popover` already wraps both.
- **A bare `Portal` with our own positioning and outside-press handling.** Rejected: the failure inside a `Dialog`
  above is the one `Select` hit, and fixing it means reimplementing Radix's layer stack
  ([ADR-0004](./0004-radix-ui-primitives-for-accessibility-logic.md)).

## Consequences
- No new dependency: `@radix-ui/react-popover` is already installed and pinned to the Radix release train.
- Positioning props (`side`, `align`, collision handling) are Radix's, as `Popover`'s and `Select`'s are.
- If a newer Radix release changes how a trigger-less `Anchor` behaves, `Combobox`'s real-browser checks (placement,
  and choosing inside a `Dialog` and a `Popover`) are the tripwire.

## Related
[ADR-0017](./0017-popover-omits-anchor-sub-part-pending-upstream-fix.md),
[ADR-0054](./0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md); `Combobox` component review.
