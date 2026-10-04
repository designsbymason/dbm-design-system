# 0038 — `Splitter` panes have an identity, fixed panes are rescaled, and locked panes get plain dividers

**Status:** Accepted · **Date:** 2026-10-04

## Context
[ADR-0037](./0037-splitter-is-hand-rolled-on-the-window-splitter-pattern-with-automatic-handles-and-a-percentage-layout.md) fixed the layout as percentages and the handles as automatic. Four needs then came up that it didn't answer: a layout that survives a pane coming or going (a details panel toggled on and off), a pane that keeps its pixel width as the window changes, a pane that must never be dragged (a header), and handle names that say which pane they resize.

## Decision
- **A pane's identity is its `id`, else its React `key`.** When the set of panes changes, panes still present keep their sizes, a new pane takes its `defaultSize` (or the share nobody claimed), a removed pane's space is shared out in proportion, and a collapsed pane stays collapsed. Without an `id` or `key` panes are told apart by position, which is documented.
- **`fixed` keeps a pane's length; the layout stays percentages.** When the container changes size, a fixed pane's percentage is rescaled by the ratio of the old shared space to the new (clamped to its own limits), and the other panes share the rest in proportion to what they had. A fixed pane the person has dragged keeps its new length. When fixed panes alone fill the container, every pane scales proportionally instead.
- **`resizable={false}` makes the handles beside the pane plain dividers**: a `role="separator"` with no tab stop, no value, no target and no hover, excluded from the handle count. They are not disabled-but-focusable handles.
- **A handle is named from a pane `label` prop** ("Resize Sidebar", from the pane before the handle), not from the pane's `aria-label`. `labels.handle` receives the label as a third argument.

## Alternatives considered
- **Require an `id` on every pane:** unambiguous, but one more required prop for the common case of two static panes.
- **Hold fixed panes in pixels in the layout:** then `layout` stops being percentages summing to 100, and `onLayoutChange` and a saved layout mean two things.
- **A locked pane's handle focusable and `aria-disabled`:** a permanent dead tab stop for every locked pane, announced as a control that does nothing.
- **Name handles from the pane's `aria-label`:** an `aria-label` on a `div` with no role is invalid, so it would force a role on every pane just to name a handle.

## Consequences
- A layout saved in percentages still restores correctly with fixed panes, since only the next container resize converts it.
- Locking a pane also stops the keyboard and double click from collapsing it; `collapsed` still collapses it from outside.
- Pane order or count changing in a controlled `layout` is the app's to handle; the identity rule applies to a layout `Splitter` holds itself.

## Related
`04-component-inventory.md` (`Splitter`); [Splitter.md](../component-reviews/Splitter.md).
