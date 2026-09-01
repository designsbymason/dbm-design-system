# 0004 — Radix UI Primitives for accessibility/interaction logic, not hand-rolled

**Status:** Accepted · **Date:** 2026-07-18

## Context
Every interactive component this system needs to build — menus, comboboxes, dialogs, tabs, sliders — requires keyboard navigation, focus trapping, roving tabindex, and correct ARIA wiring. Building all of that from scratch, per component, is a very large, easy-to-get-subtly-wrong undertaking, and this project's own "no/limited dependencies" principle (`CLAUDE.md`) means every dependency taken on has to earn its place rather than being a default.

## Decision
Adopt **Radix UI Primitives** (`@radix-ui/react-*`, MIT-licensed) as the foundational, unstyled dependency for interaction/accessibility logic, with DBM's own styled components built on top of it.

## Alternatives considered
Hand-rolling accessibility/interaction logic per component — rejected as the single riskiest place to go fully dependency-free: this is exactly the kind of subtle, easy-to-get-wrong behavior (focus order, ARIA state, keyboard patterns) where a widely-used, battle-tested primitive is worth the dependency, unlike most other places this project deliberately stays dependency-light. Radix specifically (over another headless UI library) because it ships zero styling, is tree-shakeable per-component, and is the de facto industry standard other systems (shadcn/ui, many enterprise design systems) already build on — a known quantity, not a novel bet.

## Consequences
Radix becomes one of exactly two approved runtime dependencies for `@dbm-design-system/components` (the other being Motion, an optional peer — see `02-tech-stack-and-structure.md` §3's own Motion row). DBM's own components wrap Radix's behavior layer and own all styling/visual identity on top of it — confirmed in practice not to be a blanket default, though: `Avatar` deliberately did *not* adopt `@radix-ui/react-avatar` for its own image-load state machine (`guidelines/adr/0001`), since Radix is adopted where it earns its keep, not reflexively for every component.

## Related
`02-tech-stack-and-structure.md` §1/§3 — the tech-stack table's own quick-reference row points here. `CLAUDE.md`'s dependency-budget principle this decision operates under.
