# 0114 — The shared-helpers package is `utils`, over keeping the name `primitives`

**Status:** Accepted · **Date:** 2026-10-23

## Context
The package holding the shared hooks and helpers (`cx`, `mergeRefs`, `mergeDefined`, `responsiveStyle`, `useAnnouncement`, `usePersistentDismiss` and the scroll and list hooks) was called `primitives`. In this repository that word already means two other things: the primitive token layer (raw values such as `color.purple.600`, which `@dbm-system/tokens` exports as `primitives`) and Radix UI Primitives, the accessibility layer. The package's own documentation had to say "not a Radix wrapper", and a reader or an agent searching for "primitives" found three unrelated meanings. Nothing is published yet, so the name costs only a mechanical rename.

## Decision
- **The package is `@dbm-system/utils`, in `packages/utils`.** Its contents and public surface are unchanged; the components package still re-exports only `usePersistentDismiss` and the `Breakpoint`, `Responsive` and `SpaceValue` types.
- **Only the package changed.** The tokens package's own `primitives` export, the `primitives.css` stylesheet and the Style Dictionary parser keep their names: they are the token layer, and the word is right there.

## Alternatives considered
- **Keep `primitives`.** Rejected: the clash is permanent, and the cost of changing only goes up after the first publish.
- **`shared`.** Rejected: it says "used by several packages" but invites everything to be dropped in it.
- **`core`.** Rejected: it suggests the central library, which is the components package.
- **`hooks`.** Rejected: four of the ten exports are not hooks.
- **Split into a hooks package and a helpers package.** Rejected: two packages for ten small exports, with no consumer asking for either.

## Consequences
- The dated component-review logs keep describing work as it was ("extracted to `primitives`"); their path and package strings were updated to `utils`, and this record says the package was named `primitives` until 2026-10-23.
- ADRs 0023, 0043, 0080 and 0113 name the old package and are amended with a note; their titles and filenames stay, since a record's number and filename are permanent.
- `packages/utils` keeps `react` and `react-dom` as peers and has no runtime dependencies.

## Related
`02-tech-stack-and-structure.md` §2 ("What `utils` holds"); `06-engineering-standards.md` §1; ADR-0113 (the scope); ADR-0023, ADR-0043, ADR-0080.
