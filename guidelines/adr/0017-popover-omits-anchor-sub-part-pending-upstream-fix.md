# 0017 — `Popover` omits Radix's own `Anchor` sub-part, over shipping it with a broken-feature warning

**Status:** Accepted · **Date:** 2026-09-16

## Context
`Popover.Anchor` — Radix's own sub-part for anchoring the floating content to an element other than
the trigger — was built, typed, and documented as part of `Popover`'s initial implementation, mirroring
the same compound-sub-part pattern already established for `Trigger`/`Content`/`Close`. Live
verification (reproduced with raw `@radix-ui/react-popover` primitives, no code of this component's
own involved, both with and without `asChild` on the anchor element) found it doesn't work in the
installed version combination (`@radix-ui/react-popover@1.1.23` + `@radix-ui/react-popper@1.3.7`): a
custom anchor is silently ignored and the content positions itself at the viewport's own top-left
corner instead.

Root cause, traced through Radix's own source: `PopoverTrigger` checks `context.hasCustomAnchor`
*during render* to decide whether to wrap itself in its own implicit anchor; `PopoverAnchor` only
flips that flag via a `useEffect` that fires *after* the first commit. On the very first render,
`Trigger` still wraps itself in a competing anchor regardless of a real `Popover.Anchor` being
present. Once the corrective re-render happens and that implicit wrapper unmounts,
`PopperAnchor`'s own ref callback only calls `onAnchorChange` on *attach*, never on *detach* — so
positioning silently keeps referencing the removed node, computing a 0×0 rect. Confirmed via
`getComputedStyle`/`getBoundingClientRect()` inspection, not just visually: the real anchor element
itself measured correctly and had Popper's own placement data attributes properly injected (proving
`Slot`/`asChild` forwarding worked), yet the content wrapper's own `--radix-popper-anchor-width`/
`-height` custom properties stayed stuck at `0px`. A genuine upstream timing bug, not an
`asChild`/`Slot` issue on either side of this component's own code.

## Decision
Omit `Popover.Anchor` from the shipped API entirely — no sub-part, no prop, nothing referencing it in
`Popover.types.ts`/`Popover.tsx`/the barrel export — rather than ship a documented-but-broken feature.

## Alternatives considered
- **Ship it with a "known broken, avoid this" warning.** Rejected: a sub-part that exists in the type
  surface and Properties table but silently produces broken positioning if actually used is worse than
  not offering it at all — an agent or developer skimming the API surface, not the fine print, could
  easily reach for it and ship a real, hard-to-diagnose UI bug (content pinned to the top-left corner)
  with no error or warning at runtime to point at the cause.
- **Work around the timing bug internally** (e.g. force an extra re-render cycle, or manage the anchor
  relationship through a different, undocumented Radix internal). Rejected: this would mean
  reimplementing or monkey-patching Radix's own internal `Trigger`/`Anchor` coordination, contradicting
  [ADR-0004](0004-radix-ui-primitives-for-accessibility-logic.md)'s own stance that Radix is the
  approved behavior/accessibility foundation precisely so this system doesn't hand-roll that class of
  logic itself.

## Consequences
`Popover` cannot anchor its content to an element other than its own trigger until a newer
`@radix-ui/react-popover`/`@radix-ui/react-popper` release fixes the upstream timing bug — a real,
if narrow, feature gap relative to comparable production popover implementations, accepted as
temporary rather than worked around. Documented prominently in `Popover.tsx`'s own top-level JSDoc
(not only here) so a future session doesn't have to rediscover this from scratch before reaching for
`Popover.Anchor`. Any future component wrapping a Radix compound primitive with a similar
secondary-anchor-style sub-part should verify the anchor/trigger timing relationship live before
shipping it, rather than assuming a Radix primitive is bug-free just because it's the approved
foundation. Revisit once a newer Radix release is adopted for this package: re-add `Popover.Anchor`,
its own hidden sub-part stories file, and its own Properties subsection on the Docs page, following
the exact pattern the other three sub-parts already establish.

## Related
`05-component-api-conventions.md` §4 (compound components) and
[ADR-0013](0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md) (how a
sub-part's own props get documented) — both describe the pattern this decision is a deliberate
exception to. `06-engineering-standards.md` §9's Radix-primitive prop audit checklist item. Full
live-verification detail and re-check history: `component-reviews/Popover.md`.
