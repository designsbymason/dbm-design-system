# 0057 — `ConfirmDialog` is a prop-driven wrapper over `AlertDialog`, with its own trigger and a typed-confirmation field, over a compound of its own or a second consumer of `Dialog`

**Status:** Accepted · **Date:** 2026-10-11 · **Amended 2026-10-11** — the bundle budget (twice); the decision itself is unchanged

## Context
The inventory listed `ConfirmDialog` as a "destructive-action confirmation pattern (built on Dialog)", while the `AlertDialog` row called it "the prop-driven pattern on top" of `AlertDialog`. A confirmation is the most common use of an alert, and the compound `AlertDialog` makes every caller assemble nine parts, wire an open state, wire a busy state around a request, and (for a name that must be typed) hold the typed text and disable the action by hand. Three things had to be settled together: what it is built on, whether it is compound, and which of those hand-wired pieces it takes over.

## Decision
- **Built on `AlertDialog`**, not `Dialog`. A confirmation is `role="alertdialog"`: it must be answered, is not dismissed by a press outside, and starts focus on the safe choice. Wrapping the compound inherits all of it, the review it already passed, and its stylesheet, so `ConfirmDialog` has no stylesheet of its own (`05` §1) and is not a third consumer of `Dialog`'s (ADR-0056 keeps `Drawer` as that trigger).
- **Prop-driven, not compound**: `title`, `description`, optional `children` (a body), `tone`, `labels`, `onConfirm`. It has two answers and no sub-parts. Anything that needs a second choice with its own value, an acknowledge-only alert or different sections composes `AlertDialog` itself.
- **It takes an optional `trigger` element**, rendered through `asChild`, so the common case is one element. With none it is opened from `open`. (`05` §3 had no convention for the trigger of a prop-driven overlay; this is it, for `Drawer` and `Menu` to follow if they take the same shape.)
- **Typed confirmation is a prop (`requireText`)**, not a documented example: the field, its label, focus on open, Enter to confirm and the reset on reopen are the parts every caller got wrong or skipped when they wired them by hand. The match is exact, case-sensitive and ignores spaces at either end.
- **The words it writes itself are a `labels` object** (`confirm`, `cancel`, `requireText`) with English defaults, per ADR-0021, not `confirmLabel`/`cancelLabel` props.
- **`tone` defaults to `"neutral"`**, as `AlertDialog`'s does: a bare `ConfirmDialog` is a plain "are you sure", and `danger` is the one prop that makes the confirm destructive.

## Alternatives considered
- **Build it on `Dialog`**, as the inventory row said. Rejected: it would re-implement everything `AlertDialog` already settled (no outside dismissal, safe-choice focus, the nudge, `busy`, the stacked footer) and become `Dialog`'s third consumer, forcing the extraction ADR-0056 deferred.
- **A compound `ConfirmDialog.*`**. Rejected: it would be `AlertDialog` renamed.
- **`confirmLabel`/`cancelLabel` props.** Rejected as a deviation from ADR-0021 for the sake of a shorter call; `labels={{ confirm: "Delete" }}` is one more brace.
- **Leave typed confirmation to `children` and a `confirmDisabled` prop.** Rejected: the caller would still hold the typed text, the focus target and the reset, which is the wiring the component exists to remove.
- **An imperative `confirm()` returning a promise.** Deferred, not rejected: it needs a provider and a host element, which is its own decision and belongs with the `Toast` queue.

## Consequences
- `ConfirmDialog`'s behaviour is `AlertDialog`'s; a defect in the alert is fixed once.
- Its bundle includes `AlertDialog`, `Dialog`'s sections, `Input` and `FormField`, and is checked against the usual JS budget. *(Amended 2026-10-11: this originally said "the usual JS budget"; the typed confirmation, checkbox and announcement added after the first build took it past 10KB and it was given its own 12KB entry; extracting the overlay sections ([ADR-0060](./0060-the-overlay-sections-are-extracted-to-internal-overlay-with-the-panel-staying-each-components-own.md)) took it back under 10KB and the entry was removed.)*
- A caller who needs more than two answers has to drop to the compound, which is intended.

## Related
ADR-0021, ADR-0053, ADR-0056; `04-component-inventory.md` (Feedback, organism build order); `05-component-api-conventions.md` §1, §3; `component-reviews/ConfirmDialog.md`.
