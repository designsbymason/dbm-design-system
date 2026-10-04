# 0039 — A handle only asks a controlled pane to collapse; the pane follows its prop

**Status:** Accepted · **Date:** 2026-10-04

## Context
`Splitter.Pane` can be controlled with `collapsed` and `onCollapsedChange`. As first built, a handle's gesture (a drag past the snap point, Home, Enter, a double click) changed the layout immediately, reported it through `onCollapsedChange`, and an effect then re-applied the `collapsed` prop whenever the layout drifted from it. With the usual wiring (`onCollapsedChange={setCollapsed}`) the two raced: the handle opened the pane, the stale prop shut it again in the same commit, the callback fired for both, and the pane and the state undid each other until React stopped with "Maximum update depth exceeded". It showed up only in a real browser, when a story pressed Enter on the handle of a controlled pane.

## Decision
- **On a pane with `collapsed` set, a handle's gesture only asks.** The layout does not change; `onCollapsedChange(next)` is called, once per direction during a drag, and the pane follows when the parent changes the prop.
- **A change the prop itself made isn't reported back**, since the parent already knows it. A pane without `collapsed` is unchanged: the splitter looks after it and reports every change.
- **A pane that is controlled as collapsed at the start is shut from the first render**, so it doesn't animate shut on mount.
- The effect that follows the prop runs when the prop changes, not whenever the layout does.

## Alternatives considered
- **Keep applying the gesture and enforce the prop afterwards:** what raced. Making the enforcement wait for the parent's next render needs bookkeeping about which change came from where, and still leaves a pane the parent has refused fighting it.
- **Apply the gesture and report it, never enforcing the prop:** then `collapsed` is a suggestion, not control, and a parent that refuses has no way to say no.
- **Drop the controlled form and keep an imperative handle:** a larger API for what the usual controlled pair already says.

## Consequences
- A parent that ignores the request leaves the pane where it was (a drag past the snap point stops at the minimum); the handle keeps asking.
- A controlled pane collapses a render later than an uncontrolled one: the request, the parent's update, then the layout. It is invisible in practice (the pane eases either way).

## Related
[Splitter.md](../component-reviews/Splitter.md); [ADR-0037](./0037-splitter-is-hand-rolled-on-the-window-splitter-pattern-with-automatic-handles-and-a-percentage-layout.md), [ADR-0038](./0038-splitter-panes-have-an-identity-fixed-panes-are-rescaled-and-locked-panes-have-plain-dividers.md).
