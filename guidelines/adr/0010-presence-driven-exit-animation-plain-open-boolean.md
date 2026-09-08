# 0010 — A plain `open` boolean over the full controlled/uncontrolled trio for Presence-driven exit animation

**Status:** Accepted · **Date:** 2026-09-05

## Context

`Backdrop`'s review (`06-engineering-standards.md` §9) found it had no enter/exit transition —
comparable production overlay/scrim components typically animate opacity in/out, while `Backdrop`
mounted and unmounted instantly via whatever conditional-render expression the consumer wrote
(`{isOpen && <Backdrop />}`). A real exit animation requires the scrim to stay in the DOM for the
duration of its own fade-out, which is impossible once React has already unmounted the whole
subtree — the component needs to control its own presence internally, via Radix's `Presence`.

`05-component-api-conventions.md` §3 already establishes a standard shape for a component holding
internal visibility state: the `open`/`defaultOpen`/`onOpenChange` controlled/uncontrolled trio, used
by `Collapse`, `Switch`, `Select`, etc. Backdrop doesn't fit that shape cleanly: none of those
components have a built-in trigger of their own that would ever call an `onOpenChange` — visibility
is entirely driven by whatever composes them, and there's no uncontrolled "let Backdrop remember its
own default state" use case that means anything for a scrim.

## Decision

For a component with no internal trigger of its own — visibility is always driven by whatever
composes it — expose a single, plain `open?: boolean` prop with a sensible default, not the full
`open`/`defaultOpen`/`onOpenChange` trio. Internally, render through Radix `Presence` (`present={open}`)
with a `data-state="open"|"closed"` attribute driving CSS `@keyframes` (mirroring `Collapse`'s own
`[data-state]`-keyed animation, and `Tooltip`'s `fadeIn`/`fadeOut` naming). `Backdrop`'s own `open`
defaults to `true`, preserving the original conditional-render usage pattern unchanged (mount already
open, fade in for free) while additionally supporting an always-rendered, `open`-toggled pattern for a
real fade-out.

## Alternatives considered

- **The full `open`/`defaultOpen`/`onOpenChange` trio, matching `Collapse` exactly.** Rejected:
  `onOpenChange` would be dead API surface on `Backdrop` — nothing internal ever flips the value, so
  it would never fire. Unlike `Collapse` (whose own `Trigger` toggles state and must report it
  upward), a plain `open` boolean already say everything a consumer needs.
- **Requiring the new `open`-driven pattern and dropping the old conditional-render one.** Rejected as
  a breaking change with no real benefit — the conditional-render pattern is still valid (and simpler)
  for a consumer who doesn't need the exit animation; defaulting `open` to `true` keeps both patterns
  working from the same prop.
- **A dedicated animation library (`motion`, the project's approved-but-unused optional peer
  dependency) instead of Radix `Presence`.** Rejected for this case: `@radix-ui/react-presence` was
  already a transitive dependency (pulled in by `Tooltip`/`Collapsible`/`Checkbox`), is a first-party
  Radix package (already inside the approved "Radix UI Primitives" dependency category, `CLAUDE.md`),
  and the existing `Collapse`/`Tooltip` precedent for `data-state`-keyed CSS animation meant no new
  pattern needed inventing. `motion` remains reserved for a genuinely complex sequence, not a plain
  fade.

## Consequences

Any future component with no internal trigger of its own, but that still needs an animated
show/hide (a `Toast`'s own exit, an `Alert`'s dismiss animation) should follow this same shape — a
plain `open` boolean plus Radix `Presence` plus `data-state`-keyed CSS keyframes — rather than
defaulting to the full controlled/uncontrolled trio out of habit. A component *with* its own internal
trigger (a future `Accordion` item, anything wrapping `Collapse`) still uses the full trio as before;
this ADR narrows when the trio applies, it doesn't replace it.

`@radix-ui/react-presence` is now a direct dependency of `packages/components` (previously only
transitive), added to `package.json` explicitly rather than relied on implicitly.

## Related

`05-component-api-conventions.md` §3 (controlled/uncontrolled pattern), `06-engineering-standards.md`
§9 (the review that surfaced this), `guidelines/component-reviews/Backdrop.md` (the concrete
implementation), `Collapse`/`Tooltip` (the existing `data-state`-keyed animation precedent this
follows).
