# ConfirmDialog — review findings

Third organism, built 2026-10-11 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Not Finalized:** the dedicated review pass has not been run and the sign-off is the maintainer's.

## Decisions
- Prop-driven over `AlertDialog`, with its own `trigger` and a `requireText` field: [ADR-0057](../adr/0057-confirmdialog-is-a-prop-driven-wrapper-over-alertdialog-with-its-own-trigger-and-a-typed-confirmation-field-over-a-compound-of-its-own.md).
- `onConfirm` may return a promise that holds it busy; a rejection keeps it open: [ADR-0058](../adr/0058-confirmdialogs-onconfirm-may-return-a-promise-that-holds-it-busy-and-a-rejection-keeps-it-open-over-a-caller-managed-busy-state.md).
- No stylesheet and no sub-parts, so no per-part stories and no Docs-token test; its Docs page names the tokens that give it its look and says it adds none (`SearchInput`'s shape).

## What was found while building it
- **`AlertDialog.Action` runs a consumer's `onClick` before it looks at `busy`.** A `busy` prop on `ConfirmDialog` still called `onConfirm`; the handler now refuses on `busy`, a pending answer and a mismatch itself. A unit test fails without it.
- **`isLoading` on the action loses keyboard focus.** `Button` turns it into a native `disabled`, which drops focus from a button just pressed. The pending state is a `Spinner` in the label instead, and the busy panel's `aria-disabled` keeps the button focusable. A real-browser check fails with `isLoading` put back.
- **`onError` and `onCancel` are native `<div>` event props.** The error callback is `onConfirmError` and both native names are omitted from the inherited type, or the interface would not extend it.
- **The type-to-confirm button is natively `disabled`, not `aria-disabled`.** The planned focusable-and-dimmed treatment needs a rule in a stylesheet this component does not have, and focus never sits on the button while it is disabled (it is on the field). The confirm is reachable by Tab the moment the text matches.
- **No warning of its own for a missing description.** Radix already warns in development; a second message would only duplicate it. The one warning added is for a dialog nothing can open (no `trigger`, no `open`, no `defaultOpen`).
- **The field is `readOnly`, not `disabled`, while an answer is pending,** so focus is not dropped from where the person is typing.
- **Two Playground-only controls (`confirmLabel`, `cancelLabel`)** are fields of `labels`. Kept on the Playground story's args, since on the meta they leaked into the Properties table with empty descriptions.

## Checks run
- 43 unit tests: role, name and description with no warning, answer and cancel and Escape with the reason, the scrim ignored, a promise (pending, resolve, reject with and without a handler, retry, a second press, controlled, unmount, `StrictMode`), `busy`, focus (Cancel first, the field with `requireText`, `initialFocus`, return to the trigger), `requireText` (match, trim, case, Enter, read-only while pending, reset on reopen, none for an empty string), labels merged with `mergeDefined`, ref and standard props, a role that can't be replaced, tones and icons, controlled use, over a `Dialog`, jest-axe in each tone, pending and typed.
- 18 server-render and hydration tests (nine variants, each rendered with `window` and `document` removed and hydrated with `onRecoverableError` collected).
- 10 real-browser checks: a real press on the scrim ignored and pulsing, focus loop and return, a pending answer ignoring a real Escape, scrim press and button presses with focus staying on the confirm and closing on resolve, a rejection staying open and retrying, a rejection with no handler reaching the page as an unhandled rejection, a whole string inserted at once enabling the field and Enter confirming, the phone stack, the row from `sm`, right-to-left, and a confirmation over a dialog.
- Snippets typechecked against the real components (with a planted bad prop), `pnpm lint`, the build, `check-guidelines`, the bundle-size budget (9.30KB gzip JS against 10KB), and the Docs page looked at in a running Storybook in light and dark.

## Open
- The dedicated §9 review pass, and the maintainer's sign-off.
- JS size has 0.7KB of headroom under the 10KB budget; a later addition to `AlertDialog`, `Dialog`'s sections, `Input` or `FormField` is what would trip it.
- Touch and iOS behaviour, shared with `Dialog` and `AlertDialog`.
- An imperative `confirm()` and an `error` display prop are deferred, not decided against (ADR-0057, ADR-0058).
