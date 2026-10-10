# AlertDialog — review findings

Second organism, built 2026-10-10 on the `06-engineering-standards.md` §9 checklist. **Not declared Finalized**: that is the maintainer's call, and the open items below are what is left for it.

## Decisions
- A sibling of `Dialog`, with no `role` on `Dialog`: [ADR-0053](../adr/0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md).
- Drawn with `Dialog`'s sections and stylesheet, extraction deferred to the third consumer: [ADR-0056](../adr/0056-alertdialog-draws-with-dialogs-sections-and-stylesheet-and-defers-extracting-them-to-the-third-consumer.md).
- Same structure as `Dialog` (Radix overlay, `Backdrop` for the scrim, the open state held for its fade): [ADR-0052](../adr/0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md). `@radix-ui/react-alert-dialog` is pinned to `1.1.23`, the version that depends on the `react-dialog` we pin, so one copy of each layer package resolves; `1.1.24` would pull `react-dialog@1.2.0`.

## What was found while building it
- **`Button` computes `aria-disabled` itself, after the props it is given**, and for a native button only as the native `disabled` attribute, which would take the button out of the tab order. A busy alert's Cancel and Action are marked `aria-disabled` on the element instead (a small hook), so they dim and stay focusable. Setting it through props was silently lost.
- **Radix scopes.** `AlertDialog` is its own Radix scope, so Title and Description can't be Dialog's; only the plain sections are shared.
- **An alert opened from a dialog hides that dialog from assistive technology**, as it should: a test looks the outer dialog up with `hidden: true` while the alert is open. The outer dialog's accessible name there is its Title, not its `aria-label`.
- **No warning for a missing Cancel.** The plan had one; an acknowledge-only alert legitimately has one button, so focus falls back to the Action instead.

## Checks run
- 27 unit tests: role, name and description with no Radix warning, no corner close button, focus on Cancel and the Action fallback and `initialFocus`, a press on the scrim ignored, Escape as a cancel and `closeOnEscape`, the reason, `preventDefault` on the Action, controlled use, `busy`, tone icons, refs and the standard props on every part, role and state that a consumer prop can't replace, nested under a `Dialog`, `StrictMode`, jest-axe in each tone and busy.
- 8 real-browser checks: a real mouse press on the scrim ignored, focus on Cancel and the Tab loop and return to the trigger, buttons stacked on a phone with the action on top and in a row from `sm`, right-to-left, each tone's icon at least 3:1 against its disc in all four themes, a busy alert ignoring Escape and real presses with its buttons focusable, and an alert over a dialog (two scrims, the alert's on top, the dialog legible under both, a real press on the alert's scrim reaching neither). The phone-stack check fails with the stacking rule removed.
- `pnpm lint`, the build, `check-guidelines`, and the Docs-token test, which reads both stylesheets.

## Open at review
- Touch and iOS behaviour (shared with `Dialog`), and a literal server render.
- The Docs page has not been looked at on a real phone; its phone layout is asserted, not seen on a device.
