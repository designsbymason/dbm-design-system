# 0066 — `Menu` items take a promise, a `closeOnSelect` setting, a reason for being disabled and a description, and the menu reports when it has closed

**Status:** Accepted · **Date:** 2026-10-11

## Context
A first review of `Menu` against what a production menu is asked to do named five gaps: an item that opens a confirmation, a checkbox or radio item that needs `preventDefault` each time to stay open, an action that takes time, a disabled item that cannot say why, and an item with more than a label. Two things the spike showed shaped the answers:
- **A dialog with no trigger of its own returns focus to nothing.** Radix Dialog gave focus back to its own `Dialog.Trigger` only, so a `ConfirmDialog` opened from state by a menu item closed with focus on `body`. Dialogs now return focus to the element that opened them ([ADR-0067](./0067-overlays-return-focus-to-the-element-that-opened-them-when-they-have-no-trigger-and-a-closing-scrim-lets-presses-through.md)), and recognise a menu item as its menu's trigger. Opening the dialog from `onSelect` works: the menu closes, the dialog takes focus, a real press confirms it and focus lands on the trigger. An `onSelectAfterClose` that deferred the open until the menu was gone was built and removed.
- **Radix skips a disabled item** (not focusable, so no tooltip and nothing for a keyboard user to reach).

## Decision
- **`closeOnSelect`** on `Item`, `CheckboxItem` and `RadioItem`: `true` for an action, `false` for a checkbox or radio item, since those are toggles the person flips several times. `onSelect`'s `event.preventDefault()` still keeps the menu open. This changes what a checkbox or radio item did (it closed), before any release.
- **`onSelect` may return a promise.** The item is `aria-busy` and `aria-disabled` and shows a `Spinner` where the trailing content and shortcut sit, further presses are ignored, the menu stays open and closes when it resolves (unless the handler prevented it or `closeOnSelect` is `false`). A rejection ends the pending state and leaves the menu open; `onSelectError` receives it, and with no handler it is left unhandled so it is not lost. This is `ConfirmDialog`'s `onConfirm`/`onConfirmError` shape ([ADR-0058](./0058-confirmdialogs-onconfirm-may-return-a-promise-that-holds-it-busy-and-a-rejection-keeps-it-open-over-a-caller-managed-busy-state.md)).
- **`disabledReason`** with `disabled`: the item is not given to Radix as disabled. It keeps `aria-disabled`, `data-disabled` and the dimmed look, takes keyboard focus, swallows a press (and a checkbox's flip), shows the reason in a `Tooltip` and points `aria-describedby` at it. Without a reason a disabled item is Radix's own: dimmed and skipped.
- **`description` and `trailing`** on the three item kinds. The description is a second line in quiet text, hidden from the item's name and referenced by `aria-describedby`, so the label stays what the item is called. `trailing` is part of the name. `asChild` items draw neither, as with `icon` and `shortcut`.
- **`onOpenChangeComplete(open)`** on the root, as for the dialogs ([ADR-0062](./0062-overlays-report-when-they-have-finished-opening-and-closing-through-onopenchangecomplete.md)): `true` once the entrance has finished, `false` once the menu is out of the page and focus is back on the trigger. The close is reported from the panel's `onCloseAutoFocus`, after focus has been placed, not from its unmount, which can come first.
- **Opening a confirmation from an item is a recipe, not an API:** keep the dialog beside the menu and open it from state in `onSelect`. The Docs page shows it and a real-browser check runs it with a real mouse and with the keyboard.

## Alternatives considered
- **`onSelectAfterClose`, to open a dialog once the menu is gone.** Built and removed: with the dialog's `onCloseAutoFocus` set, opening from `onSelect` passes the real-browser check, and without it deferring does not give focus a place to return to.
- **Leave checkbox and radio items closing by default.** Rejected: every use in the stories and the Docs wrote the same `preventDefault`, which is the sign the default is wrong for a toggle.
- **A `loading` prop on an item.** Rejected: a caller would have to keep a pending flag alongside a request that `onSelect` already starts and knows the end of.
- **`title` or a plain tooltip for a disabled reason, leaving the item skipped.** Rejected: an unfocusable item shows its reason only to a pointer.
- **Put the description in the item's name.** Rejected: it makes every row's accessible name long and puts it into a screen reader's list and into typeahead.

## Consequences
- `Menu`'s isolated bundle grows from about 2.8KB to about 4.9KB gzipped JS (it now carries `Tooltip`, `Spinner`, `VisuallyHidden` and the overlay lifecycle), inside the 10KB budget.
- `CheckboxItem` and `RadioItem` no longer close the menu unless `closeOnSelect` is set; existing `onSelect={(e) => e.preventDefault()}` keeps working and is redundant.
- A `Tooltip` is now part of `Menu`'s item path only when a reason is given.

## Related
`04-component-inventory.md` (Menu row), ADR-0058, ADR-0062, [ADR-0064](./0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md); `component-reviews/Menu.md`.
