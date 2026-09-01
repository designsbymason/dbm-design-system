# 0001 — Avatar keeps its own hand-rolled image-load state machine over `@radix-ui/react-avatar`

**Status:** Accepted · **Date:** 2026-08-16

## Context
Avatar's deep-dive review (2026-08-12–2026-08-16) built several features with no Radix equivalent to build on top of — deterministic per-identity color (`name`/`colorful`), a responsive `size` prop, polymorphic `as` for an interactive trigger mode, and the component-token layer's first population (`component/avatar.json`). Whether to adopt `@radix-ui/react-avatar` for the underlying image-load/fallback state machine came up as a live question during that work, since Radix is this project's approved accessibility/interaction-primitive layer (`02-tech-stack-and-structure.md`) and is used underneath most other interactive atoms.

## Decision
Avatar keeps its existing hand-rolled image-load state machine rather than adopting `@radix-ui/react-avatar`.

## Alternatives considered
Adopting `@radix-ui/react-avatar` for the image-load/fallback logic specifically — rejected. The existing state machine is simple and already tested, and none of the features this review actually added (`colorful`, responsive `size`, the `as`-polymorphic interactive mode, the component-token population) have a Radix equivalent to build on top of regardless — adopting it would have meant rewriting working, tested logic for no net capability gain.

## Consequences
Avatar's image-load state handling stays fully DBM-owned code, consistent with this project's general stance that Radix is adopted where it earns its keep (behavior/accessibility logic with no obvious DBM-specific value-add), not as a default for every component. Revisit only if a future Avatar feature genuinely needs something Radix's own primitive provides that hand-rolled logic doesn't.

## Related
`05-component-api-conventions.md` — the `as`-vs-`asChild` decision this same review established (see the doc's §3, not broken out as its own ADR since it's already documented there with its own alternatives-considered reasoning). `Avatar.tsx`.
