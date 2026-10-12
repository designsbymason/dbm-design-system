# 0067 — Overlays return focus to the element that opened them when they have no trigger, and a closing scrim lets presses through

**Status:** Accepted · **Date:** 2026-10-11

## Context
Radix Dialog gives focus back on close to its own `Dialog.Trigger` and to nothing else. `Dialog`, `AlertDialog`, `ConfirmDialog` and `Drawer` can all be opened from state (`open`), which is the shape of a confirmation chosen from a menu, a row action or a shortcut, and they close with focus on the page's `body`: a keyboard or screen-reader user starts again from the top of the page. The first real case was a `Menu` item opening a `ConfirmDialog`. A real-browser check also found that a press on the page within the scrim's fade-out (about 150ms after the panel has gone) lands on the fading scrim, because the overlay primitive sets `pointer-events: auto` inline on it.

## Decision
- **Each overlay remembers what had focus as it takes focus, and returns it there on close** (`internal/overlay/useReturnFocus`, used by the four panels): `remember` runs from `onOpenAutoFocus`, before the panel focuses anything, and `restore` from `onCloseAutoFocus`.
  - A caller who called `preventDefault()` in its own `onCloseAutoFocus` keeps what it chose.
  - Nothing is done when the remembered element is gone or there was none (the page's `body`), so Radix's own return to a `Dialog.Trigger` stands.
  - **Focus inside a menu counts as its trigger.** An item chosen to open a dialog is about to unmount with its menu, so the invoker is found through the menu's own `aria-labelledby` (its trigger), following a submenu chain up to the first element outside any menu.
- **`Backdrop` takes no pointer events once it is closed** (`open` is `false`), set inline after its `style`, so a press during the fade reaches the page.

## Alternatives considered
- **Leave it to each caller, through `onCloseAutoFocus` and a `ref` to the trigger.** Rejected: it is what `Menu`'s recipe had to say, and every confirmation opened from state needs it.
- **An `onSelectAfterClose` on `Menu` items to open the dialog once the menu is gone.** Rejected earlier (ADR-0066): it gives focus no place to return to either.
- **A stylesheet rule for the scrim.** Rejected: the primitive's inline `pointer-events: auto` beats it, and `!important` was the only way, which this avoids.

## Consequences
- A dialog opened from a trigger returns to the same element as before (the trigger is what had focus), unless the browser did not focus a clicked button (Safari), in which case Radix's own return stands.
- An accessibility check that runs right after a story reads the page during the exit, now without a fading scrim that takes pointer events, so it cannot tell that a modal is open and reports the focusable trigger behind it. `Dialog`'s real-browser checks wait for the exit before they end.
- The four Finalized overlays and `Backdrop` change behaviour additively; each review file records it.

## Related
`05-component-api-conventions.md` §3, ADR-0052, ADR-0062, ADR-0064, ADR-0066; `component-reviews/Dialog.md`, `AlertDialog.md`, `ConfirmDialog.md`, `Drawer.md`, `Backdrop.md`, `Menu.md`.
