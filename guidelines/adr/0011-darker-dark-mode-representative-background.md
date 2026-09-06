# 0011 — Darken dark mode's representative background (`bg.surface`) one step, cascading through dependent tokens, over adjusting brand tokens in isolation

**Status:** Accepted · **Date:** 2026-09-06

## Context
Dark mode read as too light/washed out overall. The first proposal considered was narrower and more local: lighten `text.brand` and move `bg.brand-subtle-hover` from `gray.800` to `gray.700`. Checked before building anything, that proposal alone produced a real WCAG AA text-contrast failure — `text.brand` against the proposed `bg.brand-subtle-hover` value dropped to 3.63:1 (purple) / 3.16:1 (emerald), below the 4.5:1 floor for Button/Tag's hover-state label — and separately, a lighter brand tone read as washed out rather than more vivid, the opposite of the intended effect. The actual source of the "too light" read was `bg.surface`, the representative background every other token in `03-token-system-spec.md`'s Contrast verification section is checked against by default — so the real decision was whether to darken that instead.

## Decision
Move dark-mode `bg.surface` one step darker, `gray.800` → `gray.900`, and cascade the same darker step to eight more brand-agnostic dark-mode tokens that exist specifically to sit near it or track its value:

- `bg.brand-subtle` → `gray.950` (two steps, needed to keep its own dependent pairings passing once `bg.surface` moved)
- `bg.brand-subtle-hover` — held at `gray.800`, deliberately unchanged (see Alternatives)
- `bg.skeleton` → `gray.950`
- `bg.scrim` → `gray.900` (tracks `bg.surface` by design, a grounding layer should read as native to the current dark surface)
- `bg.neutral-subtle` → `gray.800`, `bg.neutral-subtle-hover` → `gray.700` (keeping their existing one-step-lighter-on-hover relationship)
- `bg.track` → `gray.800`
- `bg.code` → `gray.800`

The primitive `gray.950` hex itself changed from `#16151C` to `#24222A` in the same pass — the near-black original no longer suited how many tokens now resolve to it.

A follow-up realignment moved `border.default` (`gray.950` → `gray.800`) and `border.neutral-subtle` (`gray.900` → `gray.950`, swapping places with `border.default`) to fix two real regressions the background move surfaced (see Consequences). `border.code` moved to `gray.800` in that same follow-up to keep pace with `bg.code`'s own move, then was deliberately moved back to `gray.700` as a final decision — a visible dark-mode border on `Code`'s pill, not the flat/borderless look the two tokens briefly shared.

## Alternatives considered
- **Lighten `text.brand` and move `bg.brand-subtle-hover` to `gray.700`** (the original, narrower proposal) — rejected outright once measured: a real AA text-contrast failure on a real component (Button/Tag hover label), not a hypothetical.
- **Leave `bg.surface` unchanged and only retune individual tokens that looked wrong in isolation** — rejected as treating symptoms; `bg.surface` is the representative background this doc's own methodology checks everything else against, so leaving it fixed would have meant re-deriving a new baseline for every dependent token one at a time instead of moving the actual source once.
- **Keep `border.code` matching `bg.code`** (both `gray.800`, restoring `Code`'s original flat/borderless dark pill) — implemented as part of the follow-up realignment, then reversed at explicit direction in favor of a visibly present border.

## Consequences
- Darkening the representative background only ever improves a lighter foreground's contrast against it — every dark-mode `vs bg.surface` pairing in `03-token-system-spec.md` held or improved as a direct result; nothing that previously passed AA failed because of this pass.
- Real, knowingly-accepted trade-offs from the final state, not oversights: `bg.brand-subtle`/`bg.skeleton`/`border.neutral-subtle` (all `gray.950`) now sit at only ~1.1:1 against `bg.surface` — barely distinguishable as their own tint, given this pass's explicit darker/more-monochromatic goal. `border.default`/`bg.neutral-subtle` are now byte-identical (both `gray.800`) — accepted since a border and a fill are conceptually distinct and aren't typically drawn directly against each other in real usage.
- `border.code` no longer matches `bg.code` (`gray.700` vs `gray.800`, 1.46:1 apart, by design) — `Code`'s dark-mode pill has a real, visible border again.
- This is now the standing dark-mode baseline: any future token addition that needs to sit "near" `bg.surface` in dark mode should be checked against `gray.900`, not the prior `gray.800`.

## Related
`03-token-system-spec.md`'s `bg.*`/`border.*` tables — the current-state figures this decision produced; that section's own methodology note is why this ADR exists separately rather than the full narrative living inline there. Each affected token's own `$description` in `packages/tokens/src/semantic/*-dark.json` — the per-token rationale and history. `guidelines/component-reviews/Code.md`, `CloseButton.md`, `Indicators.md` — component-review docs whose own cited figures needed a follow-up correction after this pass.
