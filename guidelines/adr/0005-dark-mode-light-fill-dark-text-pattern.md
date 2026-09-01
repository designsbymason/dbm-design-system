# 0005 — Dark-mode solid fills use a light tone-appropriate fill paired with dark text, not a mid-tone fill paired with white text

**Status:** Accepted · **Date:** 2026-08-20 (danger/warning/success/info consolidation), extended 2026-08-21 (neutral, brand)

## Context
The original dark-mode semantic tokens used a mid-tone solid fill (e.g. `red.500`) paired with white/near-white text — the naive inversion of the light-mode pattern. Measured directly rather than assumed, this repeatedly failed or nearly failed WCAG 1.4.11's 3:1 non-text floor for standalone graphical uses (a status dot, an indicator) even where the text-hosting case still passed: `bg.danger`'s old dark value measured 2.90:1 against dark `bg.surface` (an outright failure), `bg.warning`'s old value passed at only 3.05:1 (real but with almost no margin), and `bg.neutral`'s old value couldn't satisfy both its dot-fill and text-hosting uses with one value in dark mode at all (2.14:1 as a dot, well under 3:1).

## Decision
In dark mode, every tone's solid semantic fill (`bg.danger`, `bg.warning`, `bg.success`, `bg.info`, `bg.neutral`, `bg.brand`) moves to a **lighter, tone-appropriate step** (typically `.300`), paired with **dark, same-family text** (`text.on-danger` → `red.900`, not white) instead of a mid-tone fill paired with white text. Applied first to danger/warning/success/info (2026-08-20 consolidation), then to neutral and brand (2026-08-21).

## Alternatives considered
Keeping the mid-tone-fill-plus-white-text pattern and adding a separate, lighter `*-indicator` token specifically for standalone graphical uses (the pre-existing `bg.danger-indicator`/`bg.warning-indicator`/etc. pattern) — rejected as the fix, in favor of retiring those indicator tokens entirely: once the base fill itself moves to the lighter, compliant step, the fill and the indicator use the same value, so a second token for graphical-only use adds a lookup with no payoff. Every former `bg.*-indicator` consumer (Avatar's status dot, Badge's dot mode) now uses the base tone token directly.

## Consequences
- A real, visible change in dark mode wherever this applies — dark text instead of white on these fills, not just a number moving. Confirmed live before considering any of these phases done, not just computed.
- This is now the standing pattern for any future tone/status token added in dark mode — don't default to "mid-tone fill + white text" without checking whether the graphical (non-text) use case actually clears 3:1 first.
- `bg.brand-subtle`'s dark value went further, dropping its brand tint entirely (moving to a shared neutral `gray.900`) after two rejected brand-tinted candidates both failed real consumer pairings (`text.link`/`icon.brand`) or collided with `bg.canvas` — the general "lighter fill" principle doesn't always mean "lighter version of the same hue"; sometimes the only pairing that clears every real consumer's contrast requirement drops the tint altogether.

## Related
`03-token-system-spec.md`'s "Contrast verification" section — the current-state table for every token this pattern produced. `guidelines/adr/0002` — the AA/AAA policy this all operates under.
