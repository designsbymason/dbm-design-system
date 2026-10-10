# 0052 — `Dialog` wraps Radix Dialog, draws its scrim with `Backdrop` inside Radix's overlay, and keeps the Radix packages on one release train

**Status:** Accepted · **Date:** 2026-10-10

## Context
`Dialog` is the first organism and the foundation `AlertDialog`, `ConfirmDialog`, `Drawer` and `CommandPalette` build on, so how it is put together constrains all of them. The inventory said it would use `FocusTrap`, `Backdrop` and `Portal`; `Popover` already shows the alternative, a Radix primitive wrapped whole.

A live spike against the real components settled three things the documents could not:
- Radix's `Dialog.Overlay` is what engages the scroll lock, and `Backdrop` can be handed to it with `asChild`. The scrim, the panel, the lock, `aria-hidden` on the rest of the page, focus return and a press on the scrim all worked with `Content` as the `Backdrop`'s child.
- `Backdrop` writes `data-state` from its own `open` prop, after the spread (deliberately: ADR-0010). Left unfed, Radix's `closed` state never reaches it and the scrim leaves with no fade.
- `@radix-ui/react-dialog@1.2.0` depends on `react-dismissable-layer@1.1.20`, while `Popover`, `Select`, `HoverCard` and `Tooltip` resolve 1.1.19. Two copies are two layer stacks: a `Popover` opened from inside the dialog had `pointer-events: none` and could not be clicked. `react-dialog@1.1.23`, from the same release train as `popover@1.1.23`, shares the one copy.

## Decision
- `Dialog` wraps `@radix-ui/react-dialog` (ADR-0004) and composes `Backdrop` as its scrim with `inPortal={false}` inside `Dialog.Overlay asChild`; `Dialog.Content` is the `Backdrop`'s child, centred by the scrim's own flex box. `FocusTrap` and the `Portal` atom are not used inside it: Radix Dialog carries the same focus scope and its own portal.
- `Dialog` holds the open state itself (`open`/`defaultOpen`/`onOpenChange`, uncontrolled when `open` is omitted) and feeds it to both Radix and `Backdrop`'s `open`, so the scrim fades out with the panel.
- A non-modal dialog (`modal={false}`) renders `Content` directly with no scrim, since Radix renders no overlay in that mode and anything nested in it would vanish.
- `@radix-ui/react-dialog` is pinned to the exact version that shares its `dismissable-layer` (and `focus-scope`, `portal`, `presence`, `primitive`) with the packages already installed, with no caret, until the others move. A refresh of the Radix packages moves them together and re-checks that one copy of each remains.

## Alternatives considered
- **Compose `FocusTrap` + `Backdrop` + `Portal` by hand, as the inventory first said.** Rejected: scroll lock, inertness of the rest of the page, nested-layer dismissal order and iOS scrolling are the subtle behaviour ADR-0004 gives to Radix, and `Popover` already pays for it.
- **A DBM-styled overlay of Dialog's own, no `Backdrop`.** Kept as the fallback had the spike failed; it would have duplicated the scrim's fade, blur and opacity handling in a second place.
- **Change `Backdrop` to honour an incoming `data-state`.** Rejected: it is Finalized, and its own ordering is a guarded rule (`05` §3); feeding it `open` needs no change to it.
- **Take the newest Radix Dialog.** Rejected for now: it silently splits the layer stack, and a nested `Popover` or `Select` stops working with no error.

## Consequences
- Every overlay built on Radix Dialog (`AlertDialog`, `Drawer`) gets the same structure and the same pin, and checks one copy of each Radix package at every refresh.
- `Dialog`'s bundle carries Radix Dialog and `ScrollArea` (about 4.4KB gzipped JS against a 10KB budget).
- The inventory's "uses `FocusTrap`" for Dialog and Drawer is no longer true, and the `FocusTrap` and `Portal` atoms stay what they are: standalone wrappers for custom overlays.

## Related
`04-component-inventory.md` (Dialog row), `02-tech-stack-and-structure.md` §3.2 (refresh pass), ADR-0004, ADR-0010, [ADR-0053](./0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md); `component-reviews/Dialog.md`.
