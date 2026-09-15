# 0016 — `bg.track` vs. `bg.track-strong` is scoped by whether the track itself must convey the boundary, not by whether the control is interactive

**Status:** Accepted · **Date:** 2026-09-15

## Context
`03-token-system-spec.md` had documented `bg.track` (1.14:1/1.40:1, fails WCAG 1.4.11's 3:1 non-text
floor) as an accepted exception only for a *passive, non-interactive* indicator (`ProgressBar`/
`ProgressCircle`), and `bg.track-strong` (3.25:1/6.08:1, clears the floor) as required wherever "the
boundary must read as real" — stated example: `Switch`'s own always-interactive track. `Slider`'s
own review (2026-09-14/15) applied this same reasoning to its own unfilled track, restoring
`bg.track-strong` there after an earlier, unrelated fix round had reverted it to `bg.track`.

Revisited immediately after (2026-09-15) following a direct question about whether the underlying
rule was actually correct: a check of several comparable production component libraries' own
sliders found the majority do *not* hold their own track to 3:1 either. Re-reading WCAG 1.4.11
itself, the requirement targets the parts of a component *required to identify it and its state* —
for a slider or switch, that's the thumb (position/state) and the filled/active range, not
necessarily the passive, unfilled groove behind them. The original "interactive vs. passive"
framing conflated two different things: whether a control is interactive, and whether its *track
specifically* is the element carrying the boundary information a user needs. `ProgressBar` and
`ProgressCircle` are passive, but their tracks were never contrast-exempted *because* they're
passive — they're exempted because the track's low contrast doesn't prevent understanding the
control (the filled portion still reads clearly). The same is true for `Switch` and `Slider`: the
thumb and the filled range/fill already carry the necessary contrast on their own.

## Decision
Whether a track uses `bg.track` or `bg.track-strong` is decided by **whether the track itself is
the element a user needs to perceive to understand the control's boundary/state** — not by whether
the control as a whole is interactive. In practice, for every track-having control shipped so far
(`ProgressBar`, `ProgressCircle`, `Switch`, `Slider`), the thumb/handle and the filled/active portion
already carry that information, so the empty track itself may use the plain `bg.track` exception.
`Switch`'s and `Slider`'s own unfilled/off-state tracks move from `bg.track-strong` to `bg.track`.

This does **not** retroactively re-examine every other `bg.track-strong` consumer — `Indicators`'
inactive-dot fill is a materially different case (the dot itself, not a groove behind a thumb, *is*
the boundary a user reads state from) and stays on `bg.track-strong`, unchanged and unreviewed by
this decision.

## Alternatives considered
Keeping `bg.track-strong` for `Switch`/`Slider` (the status quo this ADR replaces) — rejected: it
held these two components to a stricter internal standard than the token spec's own stated rationale
actually required once that rationale was re-examined, and stricter than common, accessible
production practice for the same control type.

Reclassifying every current and future track-having component individually via a hardcoded per-
component list — rejected in favor of the general principle above (does the track itself carry
required boundary/state information, or does something else on the same control already do that),
which future components can apply themselves without maintaining a growing list.

## Consequences
`Switch.module.css` and `Slider.module.css` both move their own track `background-color` from
`var(--dbm-bg-track-strong)` to `var(--dbm-bg-track)`. `Switch` is already Finalized — this is a
deliberate preference change to already-shipped, compliant surface (not a defect fix), so per
`06-engineering-standards.md` §9's re-finalization test it's a **partial re-finalization**: only
Theming and Design-quality/Accessibility (contrast) need re-verification for `Switch`, not the full
checklist. `03-token-system-spec.md`'s `bg.track`/`bg.track-strong` rows and "Notable exceptions"
section are updated to state the boundary-carrying-element framing directly, replacing the
interactivity-based framing this ADR supersedes.

Any future track-having component defaults to `bg.track` unless its own track specifically (not a
thumb/fill/handle riding on top of it) is the only element conveying a boundary or state a user
needs — that case should reach for `bg.track-strong` and say so explicitly in its own review file,
the way `Indicators` already does.

## Related
`03-token-system-spec.md`'s `bg.*` table and "Notable exceptions" section. `guidelines/component-
reviews/Switch.md` and `guidelines/component-reviews/Slider.md` for each component's own
re-verification. `Indicators` (unchanged, explicitly out of scope here).
