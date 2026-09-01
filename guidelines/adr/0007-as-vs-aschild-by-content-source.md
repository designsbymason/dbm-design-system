# 0007 — `as` vs. `asChild`: pick based on where the component's visual content comes from

**Status:** Accepted · **Date:** 2026-08-15 (established via Avatar)

## Context
Two different polymorphism mechanisms were both in use across the system — `asChild` (Radix `Slot`-based, already used by `Button`/`Link`) and a plain polymorphic `as` prop (already used by `Stack`/`Container`/`GridItem`). Avatar's own deep-dive review needed to add polymorphism and had to decide which mechanism fit a component that renders substantial content of its own (an image, initials, a status dot) rather than rendering `children` directly.

## Decision
**`asChild`/`Slot`** fits a component whose rendered content genuinely *is* `children` (`Button`'s label, `Link`'s text) — in `asChild` mode the consumer's child becomes the real element, and the component's own generated markup (an icon, a spinner) is skipped, which costs little since there wasn't much of it to lose.

**Plain polymorphic `as`** fits a component that generates its own substantial visual content internally from props rather than from `children` (`Avatar`'s image/initials/status dot) — the component keeps generating all of its own content exactly as usual; only the root element type changes.

## Alternatives considered
Using `asChild`/`Slot` uniformly for every polymorphic component, including `Avatar` — rejected. `Slot` only merges props onto a single consumer-supplied child; it doesn't let a component keep rendering its own generated content underneath that child. Forcing `Avatar` into `asChild` mode would require the consumer to manually reproduce the component's own image/initials/status-dot rendering themselves — defeating the point of the component. This isn't a novel judgment call, either: Radix's own `Avatar` primitive has no `asChild` for the identical reason — their own docs show wrapping a plain `<button>` around it, which the plain `as` mechanism achieves without an extra DOM node.

## Consequences
Every future polymorphic component picks one of these two mechanisms based on this same test — "does this component's own markup disappear if `children` becomes the real element, or does it need to keep rendering alongside/around it?" — rather than defaulting to whichever one was used most recently. `05-component-api-conventions.md` §3 states the rule in brief for day-to-day reference; this ADR is the full reasoning.

## Related
`05-component-api-conventions.md` §3. `Avatar.tsx` (the `as` case), `Button.tsx`/`Link.tsx` (the `asChild` case). `guidelines/adr/0001` — a related, narrower Avatar-specific decision (declining `@radix-ui/react-avatar` itself, a separate question from which polymorphism mechanism to use).
