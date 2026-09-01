# 0009 — Whether a component's rendered result mirrors under RTL is a separate, per-component judgment call — not automatic from using logical CSS properties

**Status:** Accepted · **Date:** 2026-08-16

## Context
Every directional CSS value in the system uses logical properties (`margin-inline-*`, `inset-inline-start`/`-end`, etc.) instead of physical ones (`-left`/`-right`) — standard, settled web-platform practice for RTL-ready styling, not itself in question. But using logical properties for the CSS doesn't by itself answer a separate question: should a given component's actual *rendered result* visually flip when the page direction is RTL, or should it stay pinned to the same physical position regardless of direction? `Switch`'s thumb and `Badge`'s `position` prop (`top-right`/`top-left`/etc.) forced this question during the 2026-08-16 RTL audit — the two needed opposite answers.

## Decision
This is a **per-component judgment call**, made explicitly before building a new component's positioning, not defaulted either way:

- **Content tied to reading-flow convention** (a toggle's on/off travel direction, text alignment) **should mirror.** `Switch`'s thumb is the textbook case logical properties exist for.
- **Content anchored to arbitrary visual position with no reading-direction relationship of its own should not mirror.** `Badge`'s `position` prop stays pinned to the literal physical corner in both directions — `top-right` means the literal top-right corner, not "the corner reading-flow would put it in."

## Alternatives considered
**Always mirror everything, automatically, once logical properties are in use** — rejected. This would have silently flipped `Badge`'s `position` prop under RTL, contradicting the literal physical semantics that prop already promises a caller (`top-right` genuinely means top-right) and contradicting `MUI`'s own `Badge anchorOrigin` precedent for the identical case (also physical, also non-mirroring, independently arrived at).

**Never mirror anything, keep every component physically fixed** — rejected. `Switch`'s on/off travel direction genuinely is a reading-flow convention in RTL-aware toggle patterns; leaving it physically fixed would read as broken/backwards to an RTL user in a way `Badge`'s fixed corner wouldn't.

## Consequences
- `Switch`'s thumb needed more than a rename to implement its "mirror" answer — its checked-position is driven by `transform: translateX()`, which has no logical-property equivalent (unlike `inset-inline-*`). Fixed with a `:dir(rtl)` override negating the same LTR travel distance, not a renamed CSS property.
- Every future component with directional positioning must have this classification made explicitly — reading-flow-tied or arbitrary-anchor — before building it, not assumed from whichever behavior a similar-looking component happened to have.

## Related
`06-engineering-standards.md` §7 — the underlying logical-properties rule this decision sits alongside (a separate, already-settled question). `Switch.module.css`, `Badge.tsx`'s `position` prop.
