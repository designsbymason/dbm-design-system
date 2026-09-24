# 0023 — One `Alert` with `banner` and `sticky` options, and a separate `usePersistentDismiss` hook, over a separate `Banner` component or built-in persistence

**Status:** Accepted · **Date:** 2026-09-23

## Context
`04-component-inventory.md` listed one row, `Alert / Banner`, with no decision on whether those are one component or two. An inline message in the page's content (an `Alert`) and a page-level message across the top (a `Banner`) share almost everything — tones, an icon, a title, a description, actions, a dismiss button — and differ in layout (edge to edge), positioning (sticky), and lifecycle (a dismissal that outlasts the visit). Comparable systems go both ways; there is no standard. Two further constraints applied: the system is dependency-free and SSR-safe (`CLAUDE.md`), and a component with a growing list of flags should become a compound instead (`06-engineering-standards.md` §2).

## Decision
Build **one component, `Alert`**, and put the page-level treatment on it as options:

- **`banner`** — edge to edge, square corners, no side borders. Styling only.
- **`sticky`** (with `stickyOffset` and the shared `scrollContainerRef`) — composes the existing `Affix`, with `Affix`'s `asChild` on the alert's own outermost element, since anything wrapped around a `position: sticky` element becomes the box it sticks within.
- **`dismissible`** with the full `open` / `defaultOpen` / `onOpenChange` trio (the alert has its own internal trigger, so [ADR-0010](0010-presence-driven-exit-animation-plain-open-boolean.md)'s plain `open` doesn't apply) and a locally built dismiss button ([ADR-0008](0008-closebutton-reserved-for-modal-surfaces.md)).

**Persistence across visits is not in the component.** It is a separate hook, `usePersistentDismiss(key, options)`, in `packages/primitives`, that a consumer pairs with `Alert`'s controlled `open`. It is safe on the server (`ready` is `false` until the browser has been asked), syncs across tabs, falls back to memory when storage is blocked, and supports an expiry.

The name is **`Alert`**, not `Banner`: it sits with `AlertDialog` and the tone scale's own examples, and "banner" collides with the ARIA `banner` landmark (the page header).

## Alternatives considered
- **A separate `Banner` component composing `Alert`.** Cleaner if the page-level pattern keeps gaining behaviour, but it is more to build and document now, for behaviour that turned out to be one styling option and one existing atom. Kept as the fallback: an option on `Alert` can be lifted into its own component without changing `Alert`'s API, whereas merging two shipped components cannot be undone as cheaply.
- **Persistence built into `Alert`** (a `persistKey` prop). Rejected: it would put `localStorage` — SSR flashes, hydration mismatches, consent, key naming, expiry — into a presentational component, and every consumer who doesn't want storage would carry it. A hook costs nothing to those who don't use it, and works for anything else a reader can close for good, not only `Alert`.
- **A `sticky` prop that merely documents wrapping in `Affix`.** Rejected: the wrapper is exactly what breaks it (see above), so the component has to own the composition.

## Consequences
Any future page-level message pattern starts from `Alert`'s options before a new component is considered; a `Banner` is only warranted if it gains behaviour an inline alert should not have (scheduled visibility, per-user targeting, a dedicated top-of-app slot). `usePersistentDismiss` is the pattern for remembering any dismissal or acknowledgement: render nothing until `ready`. `packages/primitives` gains its third hook, and consumers who want it install `@dbm-design-system/primitives` alongside the components package.

## Related
`04-component-inventory.md` (Feedback), `05-component-api-conventions.md` §3 and §10, `06-engineering-standards.md` §9, `component-reviews/Alert.md`. `Toast` stays a separate organism: it floats over the page, auto-dismisses and is queue-managed.
