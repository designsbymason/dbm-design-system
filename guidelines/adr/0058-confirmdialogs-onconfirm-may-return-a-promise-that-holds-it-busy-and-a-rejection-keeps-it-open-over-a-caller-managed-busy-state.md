# 0058 — `ConfirmDialog`'s `onConfirm` may return a promise that holds it busy, and a rejection keeps it open, over a caller-managed busy state

**Status:** Accepted · **Date:** 2026-10-11

## Context
The usual confirmation runs a request. With `AlertDialog` the caller does four things by hand: stop the close in the action's `onClick`, set `busy` on the content, set `isLoading` on the action, and close the alert when the request is done (and keep it open and not busy when it fails). Each is easy to skip, and a skipped one is a bug a person sees: a dialog that closes before the request ends, or one that can be answered twice. Two details also had to be settled: what a failure does, and how progress is shown.

## Decision
- **`onConfirm` returns `void` or a promise.** `void`: the dialog closes at once. A promise: the dialog is `busy` and the confirm button shows a spinner until it settles; a second press, Escape, Cancel and the scrim do nothing; it closes (reason `"action"`) when the promise resolves. In controlled use `onOpenChange(false, { reason: "action" })` is called at that point and the owner closes it.
- **A rejection keeps the dialog open and stops it being busy**, so the answer can be tried again. The error goes to `onConfirmError` when given. With no handler it is **rethrown from the settling task, so it surfaces as an unhandled rejection** rather than being caught and dropped. The dialog never decides what to say about a failure: the caller shows their own message in `children`.
- **An explicit `busy` prop remains**, OR-ed with the pending state, for work the caller runs elsewhere.
- **Progress is a `Spinner` drawn in the confirm button's label, not `Button`'s `isLoading`.** `isLoading` sets the native `disabled` attribute, which takes a button the person has just pressed out of the tab order and drops its keyboard focus to the page. The busy panel already marks both buttons `aria-disabled` while keeping them focusable (`AlertDialog`'s review); the spinner is decorative beside that.
- **Nothing is set after unmount**, and a second activation in the same tick is ignored by a ref, not by the state that only updates on the next render.

## Alternatives considered
- **Only a caller-managed `busy`** (as the compound has). Rejected: it is exactly the wiring the component exists to remove.
- **Close on any settle, resolved or rejected.** Rejected: a failed delete that closes the dialog looks like success.
- **Catch the rejection and keep it to ourselves** when there is no handler. Rejected by `06` §3 (no silent `catch`): a failed answer must not vanish.
- **An `error` prop that draws the message.** Deferred: it would fix a layout and wording for every caller; `children` already holds whatever the caller wants shown, and an `error` prop can be added later without a break.
- **Use `isLoading` on the action.** Rejected for the focus loss above; a real-browser check fails if it is put back.

## Consequences
- A caller who catches inside `onConfirm` and returns normally tells the dialog it succeeded and it closes: the Docs page says to let it reject or use `onConfirmError`.
- `onConfirmError` is named for the component, not `onError`, which is a native `<div>` event the panel's props already carry.

## Related
ADR-0057, ADR-0021; `06-engineering-standards.md` §3 (no silent catch), §9 (focus handed back); `component-reviews/AlertDialog.md` (busy, `aria-disabled`); `component-reviews/ConfirmDialog.md`.
