# 0059 — `ConfirmDialog` announces progress instead of drawing it, delays the confirm over a hold-to-confirm, and remembers "don't ask again" through the dismiss store

**Status:** Accepted · **Date:** 2026-10-11

## Context
[ADR-0057](./0057-confirmdialog-is-a-prop-driven-wrapper-over-alertdialog-with-its-own-trigger-and-a-typed-confirmation-field-over-a-compound-of-its-own.md) and [ADR-0058](./0058-confirmdialogs-onconfirm-may-return-a-promise-that-holds-it-busy-and-a-rejection-keeps-it-open-over-a-caller-managed-busy-state.md) left a list of gaps: a pending answer a screen reader never heard, no way to start focus on the confirm, a confirm button the tone alone styled, no way to switch a low-stakes question off, nothing to slow a confirmation pressed by reflex, and a type-to-confirm that was exact only. Each had a real fork.

## Decision
- **Progress is announced, not written into the button.** A visually hidden `role="status"` region sits in the panel from the moment it opens, and `labels.working` (and `labels.failed` when a promise rejects, `labels.confirmReady` when a delay ends) are put into it through `useAnnouncement`. The button keeps its label, so what is drawn does not change width; its spinner stays decorative.
- **`initialFocus` is `"cancel" | "confirm" | RefObject`.** Unset keeps the smart default (the field with `requireText`, else Cancel). `"confirm"` is honoured only when the button can take focus: with `requireText` it falls to the field, and with a `confirmDelay` to Cancel, since a disabled button would leave focus nowhere.
- **`confirmProps` and `cancelProps` pass a `Button`'s props through,** minus what the dialog owns (`children`, `onClick`, `disabled`, `value`, `isLoading`, `loadingText`). A `variant` there replaces the one the tone chose.
- **`dontAskAgain={{ key, storage?, expiresAfter? }}` adds a checkbox and remembers through `usePersistentDismiss`'s store** (`dbm-dismissed:<key>`), so one key is how a settings page resets it. It is remembered only after the answer succeeds (a rejected promise is not remembered). Once remembered, the dialog is not drawn: a press on the trigger calls `onConfirm` at once and does not report an open, and an `open` that asks for it is answered and then reported closed with reason `"action"`. Docs steer it away from anything destructive.
- **`confirmDelay` (milliseconds) is a delay, not a hold-to-confirm.** The button is disabled until it passes, a line in the body counts the whole seconds down and then says it is ready (one line whose words change, so nothing moves), and the end is announced once. It restarts on every open and gates Enter in the field too.
- **`requireTextMatch` is `"exact" | "ignore-case" | function`.** Typed text is trimmed and Unicode-normalised (NFC) in every mode, since a Mac can type either form of an accent. A function is the caller's code on the person's text: what it throws counts as "no match", with a development warning.
- **The new words are in `labels`, and the seconds go through an optional `formatNumber`,** per ADR-0021: the default label function uses it, a caller's own receives the plain number.

## Alternatives considered
- **Swap the button's text while it works** (`Deleting…`). Rejected: the button changes width and moves Cancel, which the §9 stability rule forbids, and the new name need not contain the old.
- **Hold-to-confirm** (press and hold the button). Rejected for now: it is a pointer gesture that needs a keyboard equivalent, a progress fill, its own timing tokens and a story for assistive technology; a delay buys most of the "not by reflex" effect with a disabled button every user already understands. It can be added beside `confirmDelay` without a break.
- **A separate `remember`/`onRemember` callback pair** for "don't ask again", leaving storage to the caller. Rejected: persistence, expiry, other tabs and blocked storage are what `usePersistentDismiss` already solves, and a caller who wants their own store can skip the prop and put a `Checkbox` in `children`.
- **Make `initialFocus="confirm"` force focus onto a disabled button.** Rejected: it cannot be focused, and the dialog would open with focus on the page behind a modal.
- **`requireText` only as an exact string.** Rejected: case is the most common reason a person with the right name is refused, and a function covers the rest.

## Consequences
- A remembered dialog never shows, so a caller who needs the question for audit reasons does not set `dontAskAgain`.
- The confirm button grows by its spinner when an answer starts, as `Button`'s own loading state does; only its label and height are held.
- `confirmProps.variant="primary"` on a `danger` tone is allowed and is the caller's call.
- The bundle holds `Checkbox`, `Text`, `VisuallyHidden` and two hooks more than before, and has its own 12KB budget (`06` §4).

## Related
ADR-0021, ADR-0057, ADR-0058; `06-engineering-standards.md` §9 (live regions announce a change, never a first appearance; text that changes never resizes what is around it); `component-reviews/ConfirmDialog.md`.
