# 0033 — `Toolbar.ToggleGroup` is the `ToggleGroup` molecule with its own roving focus switched off (a public `rovingFocus` prop), over a second implementation or a group that detects a toolbar

**Status:** Accepted · **Date:** 2026-10-03

## Context
[ADR-0032](0032-toolbar-puts-radix-toolbar-roving-focus-behind-wrapper-parts-and-reuses-buttongroups-context.md) left the toggle group out of the first `Toolbar`, noting that a `ToggleGroup` inside a toolbar is a second roving-focus group. That is a real gap: choosing one option from several (text alignment, a view mode) is a staple of a toolbar. Put in directly, a `ToggleGroup` makes its own container a tab stop, so the toolbar stops being one tab stop and the arrow keys stop at the group's edges.

Radix solves it for its own primitives with a toolbar-specific toggle group: the toggle group's own roving focus is turned off (`rovingFocus={false}`) and its items are put into the toolbar's roving group instead.

## Decision
- **`ToggleGroup` gains a public `rovingFocus` prop** (default `true`, passed to Radix). Off, the group manages no focus of its own: its items are plain buttons that whatever contains them can put in a roving order, `loop` has no effect, and a `type="multiple"` group is announced as a plain `role="group"` instead of Radix's `toolbar` (a toolbar inside a toolbar is not a valid structure). A single group stays a `radiogroup`, and an arrow key still chooses the item it lands on.
- **`Toolbar.ToggleGroup` is a thin wrapper**: `ToggleGroup` with `rovingFocus={false}` and the toolbar's `size`, `rounded`, `orientation`, `dir` and `disabled` as defaults (an explicit prop wins; a disabled bar can't be undone by the group). **`Toolbar.ToggleItem`** puts each `ToggleGroup.Item` into the toolbar's order through Radix's toolbar button, the way `Toolbar.Button` does for `Button`. A group-level `disabled` reaches its items through a small context so a disabled item leaves the order.
- **The prop is public, not internal.** It is Radix's own prop and a correct building block for any future container that owns roving focus (a menu bar, a segmented editor); keeping it undocumented would only hide it from an agent who then reaches for a wrapper that needs it.

## Alternatives considered
**A second toggle-group implementation inside `Toolbar`** — rejected: two copies of the variants, sizes, attached/spaced layouts, single-choice semantics and the arrow-chooses behaviour to keep in step, for the sake of one prop.

**`ToggleGroup` detecting an enclosing toolbar through a context** — rejected: it makes a Finalized molecule depend on another molecule's context (an atom may not import a molecule; a molecule importing a sibling for this is the same smell), and hides a behaviour change behind placement. An explicit prop says what happens and works for containers that don't exist yet.

**Leaving it out** — rejected: toolbars without a single-choice control force an app to put a plain `ToggleGroup` in the bar, which silently breaks the one-tab-stop promise.

## Consequences
- `ToggleGroup`'s change is additive (a prop whose default is today's behaviour), so it stays Finalized; it got its own tests, a Properties-table row and a Docs sentence.
- A toggle group in a toolbar is one tab stop with the bar, and Radix's own `radiogroup`/`group` roles are used rather than invented ones.
- A group nested in a toolbar *without* this wrapper keeps working as before, as its own tab stop; the Toolbar docs say to use `Toolbar.ToggleGroup`.

## Related
`component-reviews/Toolbar.md`, `component-reviews/ToggleGroup.md`, [ADR-0032](0032-toolbar-puts-radix-toolbar-roving-focus-behind-wrapper-parts-and-reuses-buttongroups-context.md), [ADR-0004](0004-radix-ui-primitives-for-accessibility-logic.md).
