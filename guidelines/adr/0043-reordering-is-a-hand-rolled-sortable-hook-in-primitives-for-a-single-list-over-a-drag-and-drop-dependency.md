# 0043 — Reordering is a hand-rolled sortable hook in `primitives` for a single list, over a drag-and-drop dependency

**Status:** Accepted · **Date:** 2026-10-05

## Context
Several planned organisms let a person change the order of items: `EditorTabs` (a horizontal strip), `DataTable` (column reordering) and, later, `Tree`. Doing this well means pointer, touch and keyboard reordering with screen-reader support. Each component could invent its own, or the system could share one approach. The dependency budget (`CLAUDE.md`) allows only Radix and the optional Motion, and the rest of the system has hand-rolled interaction patterns where a dependency was not justified (`Splitter`, `PinInput`).

## Decision
Reordering is built once, by hand, as a hook in `packages/primitives`, with no dependency. Components wire it to their own markup; the hook has no styling and is not a visible component. It is **internal** for now (not re-exported from `@dbm-design-system/components`, like `useAnnouncement`) and can be exported once two components have proven its shape.

**Scope of the first version:**
- One list, one axis at a time (horizontal or vertical). Wrapping layouts are out.
- Pointer, touch and keyboard with equal capability. The keyboard path is: focus the item, Space or Enter picks it up, the arrow keys move it, Space or Enter drops it, Escape cancels.
- Announcements for pick up, move, drop and cancel through `useAnnouncement`, with text from a `labels` object ([ADR-0021](./0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md)).
- The whole item or a drag handle starts a drag, chosen by the component, so an item that is also clickable (a tab) can use a handle.
- The order is controlled: the hook reports the move wanted (`from`, `to`) and the consumer owns the array; a gesture asks and does not apply ([ADR-0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md)).
- Behaviour in real containers: auto-scroll near the edge of a scrolling box, `dir="rtl"` flipping the horizontal keys, reduced motion, and touch handling that does not fight scrolling.

**Out of scope, deliberately:** moving between lists, reparenting or nesting (`Tree` decides this when it is built, extending the hook then), dragging several items at once, drag-and-drop of files or external content (`FileUpload` is a separate native-drop problem), and virtualized lists (revisit with `DataTable`'s virtualization). The API must not close the door on moving between lists.

## Alternatives considered
- **A sortable library.** Less code to write, but it breaks the no-dependencies principle, its accessibility behaviour would need its own audit, and its API would leak into every component that used it and be hard to remove later.
- **Each component rolls its own.** No shared dependency, but three slightly different keyboard models and announcements to keep consistent.
- **A public hook from the start.** A larger API commitment before any component has used it; deferred, not rejected.

## Consequences
- One keyboard and announcement model for every reorderable component, written and tested once.
- We own pointer, touch and keyboard correctness, including real-browser testing (jsdom cannot evaluate drag geometry or `touch-action`).
- `Tree` may need to extend the hook for nesting, and a future Kanban for lists; the first version is shaped to allow both.

## Related
`04-component-inventory.md` (organism build order: `EditorTabs`, `DataTable`, `Tree`); `05-component-api-conventions.md` §3 (a gesture asks, it does not apply).
