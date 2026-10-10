# 0055 — `Dialog`'s `keepMounted` moves one rendered element in and out of the panel, over Radix's `forceMount`

**Status:** Accepted · **Date:** 2026-10-10

## Context
Radix removes a dialog's panel from the page when it closes, taking the state of everything inside it: a half-filled form is empty when it reopens, and the consumer has to lift every field into the parent to avoid it. A `keepMounted` option is the usual answer. Radix's own tool for it is `forceMount`, which leaves the panel in the page while closed and relies on an animation library to hide it.

Tried against the real primitive, `forceMount` does not fit a modal. The scroll lock lives on the overlay and the `aria-hidden` on the rest of the page lives on the content, and both are on for as long as those are mounted, so a closed, force-mounted dialog still locks the page and hides everything behind it. `Backdrop` also unmounts its own children when its `open` is false, which would take the panel with it.

## Decision
With `keepMounted`, `Dialog.Content` renders its children once, through a React portal, into a `div` it owns. Each time Radix mounts the panel, that `div` is moved into it (a DOM move, which doesn't remount what React rendered into it), and when Radix removes the panel the `div` goes with it and is kept. Nothing is rendered until the first open, and from then on the content is kept: out of the page while closed, so the page is not locked or hidden and nothing in it can be reached.

The sections always sit in one `.slot` element that is not drawn (`display: contents`), in both modes, so the stylesheet's relations between the panel and its sections are the same either way.

## Alternatives considered
- **`forceMount` on the portal, overlay and content.** Rejected, as above: it leaves the lock and the `aria-hidden` on while closed, and `Backdrop` still unmounts what is inside it.
- **Mount the content outside the dialog and portal it in.** Rejected: it is the same thing with the consumer doing the plumbing.
- **Hold form state in the dialog (a context of field values).** Rejected: it works only for fields the dialog knows about, and scroll position and any other state would still be lost.
- **Render the content in place, hidden, while closed.** Rejected: it keeps everything in the page's flow and accessibility tree while the dialog is closed, and a dialog with several heavy panels would render them all up front.

## Consequences
- Content that does work on mount (a fetch) does it once, on the first open, not on every open; the option's JSDoc says so and `keepMounted` isn't for a dialog that should reset.
- Effects keep running while the dialog is closed, and focus is not remembered (focus returns to the trigger, as for any dialog).
- A dialog built on this one (`AlertDialog`, `Drawer`) can offer the same option by the same means.

## Related
[ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md); `component-reviews/Dialog.md`.
