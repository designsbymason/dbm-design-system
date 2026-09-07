# 0012 — A "container + item" pair's tier is decided per-component by independent function, not inherited from its partner

**Status:** Accepted · **Date:** 2026-09-07

## Context

`Grid`/`GridItem` and `List`/`ListItem` are both "container + item" pairs — a layout/semantic
parent meant to be composed with a specific child. Both pairs were inconsistently tiered:
`Grid`/`GridItem` were both filed as a single `molecule` row in `04-component-inventory.md`, while
`List`/`ListItem` were both filed as a single `atom` row — despite the two pairs being
architecturally the same shape. Neither classification actually reflects each component's own
individual complexity; both just inherited whichever tier the pair's row happened to be filed
under. Surfaced via direct questioning (is `List` really an atom if it's built from `ListItem`?
Then is `GridItem` really a molecule if it's structurally the same relationship as `ListItem`?)
rather than a review pass turning it up.

## Decision

Tier is decided **per component**, by whether it functions and renders correctly on its own,
**not** inherited from whichever other component it's typically composed with:

- **The container is molecule-tier** — `Grid` and `List` are both meaningless alone; their entire
  purpose is providing shared layout/context (CSS Grid track definitions; marker style, spacing,
  and `ListMarkerContext`) to children designed to sit inside them.
- **The item stays atom-tier** — `GridItem` and `ListItem` both render correctly standing alone
  (a styled `<div>`/`<li>` with no required ancestor to function). That one of them happens to
  read `ListMarkerContext` from an ancestor `List` (real context coupling) while the other,
  `GridItem`, has no context coupling at all to `Grid` (pure CSS custom properties, read
  independently of whether a real Grid ancestor exists) doesn't change the outcome — both still
  clear the "renders/behaves correctly with no required parent" bar that defines atom-tier here.

Result: `Grid` and `List` are now molecule-tier; `GridItem` and `ListItem` are both atom-tier.

## Alternatives considered

**Tier inherited from the pair as a unit** (the prior, inconsistent state) — rejected. It produces
exactly the contradiction that prompted this ADR: two structurally identical relationships
(`Grid`/`GridItem`, `List`/`ListItem`) classified oppositely, with no principled reason either
component was filed the way it was, only which single combined row it happened to share.

**Molecule-tier for both members of any such pair** (i.e. if the container needs the item, tier the
item as molecule too) — rejected. This conflates "typically used with" with "requires to function."
Atomic design's own definition of a molecule is a *group of atoms functioning together as a unit* —
that's a property of the container doing the grouping, not automatically inherited by everything it
groups. `GridItem`/`ListItem` are each independently renderable, typed, testable components with
zero required ancestor; grouping them under the parent's own tier would misrepresent their actual
composition complexity (each is no more complex than any other single-element atom in the
inventory) and provides no real guidance value.

## Consequences

- **Standing test for any future "container + item" pair** (a `Tabs`/`Tab`, `Menu`/`MenuItem`,
  `TreeView`/`TreeItem`, `RadioGroup`/`Radio`, etc.): tier the container as molecule (it provides
  context/layout, meaningless alone) and tier the item as atom **unless** the item itself has real
  internal composition complexity independent of its container (multiple sub-parts, its own
  required child components) — that's the actual bar for molecule-tier, not simply "has a parent."
- `GridItem` moved from `packages/components/src/molecules/GridItem/` to
  `packages/components/src/atoms/GridItem/`; `List` moved from
  `packages/components/src/atoms/List/` to `packages/components/src/molecules/List/` — file
  location follows `{tier}` per `05-component-api-conventions.md` §1. Storybook sidebar titles
  moved to match (`Atoms/Layout/GridItem`, `Molecules/Typography/List`).
- `ListItem` (atom) now imports `ListMarkerContext` from `List` (molecule) — a cross-tier import in
  the direction atomic-design composition normally runs the other way (molecules import/compose
  atoms, not the reverse). Accepted as-is: `ListMarkerContext` is a small, shared coordination
  primitive between the two, not "the `List` component" itself — no lint rule in this repo enforces
  tier-import direction, and moving the context file to a third, neutral location was considered
  and deferred as unnecessary ceremony for a single shared `createContext` call.
- No behavior, public API, or props changed on any of the four components — this is a
  classification and file-location correction only.

## Related

`04-component-inventory.md` — the corrected `Grid`/`GridItem`/`List`/`ListItem` rows.
`05-component-api-conventions.md` §1 — file structure by tier.
`07-storybook-and-documentation-standards.md` §3 — sidebar taxonomy, and the atom-review tracking
tables `GridItem`'s move now enters and `List`'s move now leaves.
`02-tech-stack-and-structure.md` — monorepo layout's own atoms/molecules "built so far" lists.
