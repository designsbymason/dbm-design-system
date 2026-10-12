# 0069 — `Toast` wraps Radix Toast pinned at 1.2.23, on the shared layer stack, over a hand-rolled toast or the newest release

**Status:** Accepted · **Date:** 2026-10-12

## Context
`Toast` has to announce a message without taking focus, pause its own time while the pointer is over it or focus is inside it, close on a swipe, give keyboard users a way into it, and keep working above an open modal dialog. Radix Toast does all of that, and the project's own rule is that this kind of behaviour is where a primitive earns its place ([ADR-0004](./0004-radix-ui-primitives-for-accessibility-logic.md)). Hand-rolling it is realistic (`Splitter` and `PinInput` were), but the parts that are easy to get subtly wrong are the ones Radix already solved: a live region that exists before its text changes, a pause that survives focus moving between toasts, a swipe threshold, and a skip-to-region key.

The registry showed what a new Radix package costs this repository. `@radix-ui/react-toast` 1.3.0 depends on `dismissable-layer` 1.2.0, while every Radix package already installed resolves 1.1.19. Two copies are two layer stacks, which is exactly what [ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md) recorded for Dialog 1.2.0: a toast above a dialog would not be recognised as part of its layer stack. 1.2.23 depends on `dismissable-layer` 1.1.19, `presence` 1.1.10 and `portal` 1.1.17, the same copies as `react-dialog` 1.1.23.

## Decision
- **`Toast` wraps `@radix-ui/react-toast`**, with its provider, viewport, root, action and close parts behind DBM's own `Toast.Provider`, `Toast`, `Toast.Title`, `Toast.Description` and `Toast.Action`.
- **It is pinned to exactly 1.2.23**, no caret, until the other Radix packages move. A refresh of the Radix packages moves them together and re-checks that `pnpm why @radix-ui/react-dismissable-layer` and `…/react-presence` still report one version.
- **Radix's own rules that a DBM component would otherwise break are kept, not worked around:** the region is a `DismissableLayer.Branch`, so a press in it is not "outside" a dialog; each toast is a layer, so `Escape` closes the newest one first; and an action carries a required `altText`.
- **Two Radix defaults are overridden because they were wrong for DBM:** the `pointer-events` Radix writes on a toast that was already showing when a modal dialog opened (it is drawn above the scrim and would otherwise look active and do nothing), and the attributes Radix writes before it spreads a caller's props (`data-state`, `data-swipe-direction`, `tabindex`), which are written again after the spread (`05` §3).

## Alternatives considered
- **A hand-rolled toast on `Presence` and a live region.** Rejected: it is the less defensible place to go dependency-free, for the reason ADR-0004 gives, and the layer-stack integration with `Dialog` would have had to be rebuilt by hand.
- **The latest Radix Toast (1.3.0).** Rejected for now: it silently splits the layer stack, and a toast raised above a dialog stops being treated as inside it, with no error.
- **A caret range, `^1.2.23`.** Rejected: a range would let a refresh resolve 1.3.0 without anyone looking, which is the failure above.

## Consequences
- `Toast` carries about 4.8KB gzipped JS and 2.7KB CSS against the 10KB budget.
- A toast closes on `Escape` when focus is anywhere in a page whose newest layer is a toast, including inside a dialog, which is Radix's behaviour and is documented rather than changed: the newest toast closes first and the dialog on the next press.
- A modal dialog hides the rest of the page from assistive technology, the toasts' region included, so a toast's action cannot be reached with a screen reader or the keyboard while a modal is open; its `altText` (required) is the other way, and the announcement is made separately and is unaffected.

## Related
`04-component-inventory.md` (Toast row), `02-tech-stack-and-structure.md` §3.2 (refresh pass), ADR-0004, ADR-0008, ADR-0010, ADR-0052, ADR-0054, [ADR-0070](./0070-toast-is-raised-from-code-through-a-provider-and-a-hook-with-a-declarative-toast-beside-it-over-a-module-level-function-or-component-only-use.md); `component-reviews/Toast.md` once the review pass is done.
