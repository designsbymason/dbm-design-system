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

## Second pass: six additions (2026-10-11)
Built before sign-off, against the gaps listed after the first build; decisions in [ADR-0059](../adr/0059-confirmdialog-announces-instead-of-drawing-progress-delays-the-confirm-over-hold-to-confirm-and-remembers-through-the-dismiss-store.md).
- **Pending and failure are announced** through a status region in the panel (`labels.working`, `labels.failed`), not drawn as text.
- **`initialFocus="confirm" | "cancel"`** beside a ref, with a fallback when the button can't take focus yet.
- **`confirmProps` / `cancelProps`**, without the props the dialog owns.
- **`dontAskAgain`**, over `usePersistentDismiss`'s store: a trigger press answers with no dialog, an `open` that asks for it is answered and reported closed, and nothing is remembered when the promise rejects.
- **`confirmDelay`** with a one-line countdown whose height doesn't change, announced once at the end; hold-to-confirm left for later.
- **`requireTextMatch`** (`"exact"`, `"ignore-case"`, a function), with accents normalised in every mode.
- **Bundle:** 10.60KB measured, over the 10KB default, so `ConfirmDialog` has its own 12KB entry with the reason beside it (`06` §4).
- **Found while building:** the `latest` ref that holds the current `answer` had to be updated after `answer` is declared (lint: used before defined); `matches` had to include the delay or Enter in the field would have confirmed early (a unit test now fails without it).
- **Known, not fixed:** the confirm button grows by its spinner when an answer starts (as `Button`'s own loading state does), moving Cancel by the spinner's width. Its label and height are held and checked; reserving the spinner's room needs a stylesheet this component doesn't have, so it is left for the review pass to weigh.

## Checks run
- 71 unit tests (43 from the first build, the rest for the second pass: announcing, `initialFocus`, `confirmProps`/`cancelProps`, `dontAskAgain` including a rejected answer, a remembered promise and a controlled `open`, `confirmDelay` including Enter and reopening, `requireTextMatch`): role, name and description with no warning, answer and cancel and Escape with the reason, the scrim ignored, a promise (pending, resolve, reject with and without a handler, retry, a second press, controlled, unmount, `StrictMode`), `busy`, focus (Cancel first, the field with `requireText`, `initialFocus`, return to the trigger), `requireText` (match, trim, case, Enter, read-only while pending, reset on reopen, none for an empty string), labels merged with `mergeDefined`, ref and standard props, a role that can't be replaced, tones and icons, controlled use, over a `Dialog`, jest-axe in each tone, pending and typed.
- 18 server-render and hydration tests (nine variants, each rendered with `window` and `document` removed and hydrated with `onRecoverableError` collected).
- 14 real-browser checks (four added in the second pass: focus on the confirm and the fallback, the status region and the button's label while working, the panel and buttons unmoved when the delay ends, and a remembered answer with no dialog): a real press on the scrim ignored and pulsing, focus loop and return, a pending answer ignoring a real Escape, scrim press and button presses with focus staying on the confirm and closing on resolve, a rejection staying open and retrying, a rejection with no handler reaching the page as an unhandled rejection, a whole string inserted at once enabling the field and Enter confirming, the phone stack, the row from `sm`, right-to-left, and a confirmation over a dialog.
- Snippets typechecked against the real components (with a planted bad prop), `pnpm lint`, the build, `check-guidelines`, the bundle-size budget (10.60KB gzip JS against its own 12KB), and the Docs page looked at in a running Storybook in light and dark.

## Open
- The dedicated §9 review pass, and the maintainer's sign-off.
- JS size has 1.4KB of headroom under its 12KB budget.
- Touch and iOS behaviour, shared with `Dialog` and `AlertDialog`.
- An imperative `confirm()`, an `error` display prop and hold-to-confirm are deferred, not decided against (ADR-0057, ADR-0058, ADR-0059).
