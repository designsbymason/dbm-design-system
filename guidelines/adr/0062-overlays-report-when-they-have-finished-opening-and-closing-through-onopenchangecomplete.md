# 0062 — Overlays report when they have finished opening and closing through `onOpenChangeComplete`

**Status:** Accepted · **Date:** 2026-10-11

## Context
`onOpenChange` fires when a change *starts*: the panel is still sliding out, and Radix removes it from the page only after the exit animation has played. A caller who wants to reset a form, clear a selection or release something heavy has had to guess the animation's length, or reset at once and watch the content change under a panel that is still leaving. `Dialog`, `AlertDialog`, `ConfirmDialog` and `Drawer` share the problem.

## Decision
- **One optional prop on each overlay's root, `onOpenChangeComplete(open: boolean)`**, called with `true` once the entrance has finished and with `false` once the panel has finished closing and is out of the page. `ConfirmDialog` passes it to the `AlertDialog` it draws.
- **It is read from the panel's own lifecycle, not from a timer.** A small shared piece rendered inside the panel (`internal/overlay/OverlayLifecycle`) waits for the entrance's animations to finish (at once where there are none), and reports the close from the cleanup of an effect that only runs while the panel is closed, since Radix unmounts the content after the exit. `StrictMode`'s simulated unmount happens while the panel is open, and is ignored by the same test.
- **It is additive.** `onOpenChange` and its reasons are unchanged; this is a second, later signal.

## Alternatives considered
- **A `setTimeout` of the exit's duration.** Rejected: it drifts from the real animation, ignores reduced motion, and is what the callback exists to avoid.
- **`onAnimationEnd` on the panel.** Rejected: the panel runs two animations (the entrance and the exit) and is removed as the exit ends, so the handler is unreliable at exactly the moment it matters.
- **A render prop or a ref to the panel's state.** Rejected as heavier than one callback for the same need.

## Consequences
- A caller who closes and reopens quickly gets `false` only if the panel really finished leaving; a reopen during the exit is not reported as a close.
- A panel removed with its parent while closed reports `false` on that unmount; calling back into an unmounted owner is the owner's to ignore.
- `Dialog`, `AlertDialog` and `ConfirmDialog` are Finalized: this is an additive prop, so each stays Finalized with a scoped mini-pass (types, JSDoc, Docs row, tests).

## Related
ADR-0052, ADR-0010 (Presence-driven exit animation); `component-reviews/Dialog.md`, `AlertDialog.md`, `ConfirmDialog.md`, `Drawer.md`.
