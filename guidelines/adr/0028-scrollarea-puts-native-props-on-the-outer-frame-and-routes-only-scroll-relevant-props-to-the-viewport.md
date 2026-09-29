# 0028 — `ScrollArea` puts native props on the outer frame and routes only scroll-relevant props to the viewport

**Status:** Accepted · **Date:** 2026-09-29

## Context
`ScrollArea` wraps Radix ScrollArea, whose real scrolling element (`Viewport`) is a different DOM
node from the one a consumer sizes (`Root`, styled with `variant`/`maxHeight`). [ADR-0019](0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md)
already answered the general shape of this question for `Table` — own the scroll frame, make it
focusable only while it overflows — but `Table` split its own two elements by *role* (a `<table>`
consumers already think of as "the table," and an incidental frame around it), which doesn't map
directly onto `ScrollArea`: here there is no second, more-real element consumers mean when they say
"the ScrollArea" — `Root` (sized, bordered, the box a consumer places and styles) *is* that element.
Two questions followed: where do `ref`/`className`/`style`/`id`/`data-testid` and ordinary native
`<div>` props (`onWheel`, `role`, `aria-hidden`, …) apply, and what happens to `onScroll` specifically,
given the element that actually fires a scroll event (`Viewport`) is never the one a consumer sizes?

## Decision
**`ref`, `id`, `className`, `style`, `data-testid`, and every native `<div>` prop not explicitly
listed below apply to `Root`** — the outer frame `variant`/`maxHeight` style, and the element a
consumer already thinks of as "the ScrollArea."

**`onScroll` is redeclared explicitly and routed to `Viewport` instead** — the actual scrolling
element, where a real `scroll` event fires; wiring it onto `Root` the ordinary way would silently
never fire, since `Root` itself never scrolls.

**`viewportRef` is a second, explicitly-named ref prop reaching `Viewport` directly** — for
imperative scrolling or measurement (`scrollTo`, `scrollTop`, `scrollHeight`) `ref` (pointed at
`Root`) can't provide.

**The keyboard-reachable-region pattern from ADR-0019 applies unchanged**, generalized to which axis
(or axes) `scrollbars` actually offers: `Viewport` gets `tabIndex={0}` and, only alongside a real name
(`aria-label`, then `aria-labelledby`), `role="region"` — but only while its content genuinely
overflows the axis (or axes) requested. Both live on `Viewport`, not `Root`, since it's the element
that's actually reachable/scrollable. Overflow is read with the same `useSyncExternalStore`-based
technique `Table`'s own `useScrollableRegion` established, generalized to per-axis (`useIsScrollable`,
colocated in `ScrollArea`'s own folder rather than touching `Table`, an already-Finalized component,
to extract a shared version without asking first — see `component-reviews/ScrollArea.md`).

## Alternatives considered
**Route everything, `ref` included, to `Viewport` (Table's own precedent, "native props go on the
real element").** Rejected: unlike `Table`'s `<table>`, `Viewport` isn't the element a consumer
already conceptually means by "the ScrollArea" — it's an internal implementation detail of how Radix
achieves the overlay-scrollbar effect. Pointing `ref`/`id`/`data-testid` there while `className`/`style`
(needed for sizing) stayed on `Root` would split the component's identity across two elements by prop,
the exact ambiguity ADR-0019 itself rejected in its own second alternative.

**Let `onScroll` fall through the ordinary `{...props}` spread onto `Root`.** Rejected outright once
traced through Radix's own source: `Root` never has `overflow` set on itself, so a `scroll` event
never fires there — a consumer's `onScroll` would silently be dead code, not an edge case worth a
caveat.

**No `viewportRef` at all — let a consumer query the DOM for `[data-radix-scroll-area-viewport]`
themselves.** Rejected: relying on Radix's own internal marker attribute is exactly the kind of
implementation detail this system's own components exist to not require a consumer to know about,
and a documented, typed prop costs nothing extra.

## Consequences
- Standing pattern for any future component wrapping a multi-element Radix (or other) primitive
  where the outermost element is genuinely what a consumer means by the component's own name:
  `ref`/native props go there; only the specific props tied to a *different* internal element's own
  behavior (an event that fires elsewhere, a ref to reach it) are called out explicitly and
  routed accordingly — not a blanket rule to route everything to whichever element is "more real"
  in an implementation sense.
- A consumer wanting a native prop on `Viewport` specifically (beyond `onScroll`) has no escape
  hatch besides `viewportRef` plus manual DOM access — accepted as an acceptable narrow gap, the
  same way `Table`'s own frame only exposes two dedicated props (`containerClassName`, `maxHeight`)
  rather than the frame's full native surface.
- Test coverage must assert `onScroll` fires on `Viewport` and not `Root` explicitly — the ordinary
  "native props pass through" test pattern doesn't cover it, since it's a deliberate exception.

## Related
[ADR-0019](0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md)
(the general "own the scroll frame, focusable only while scrollable" pattern this extends).
`05-component-api-conventions.md` §3 (standard prop patterns). `component-reviews/ScrollArea.md` for
the full build and verification record, including two real live-browser CSS findings (percentage-height
resolution against a `max-height`-only ancestor, and `flex: 1`'s zero flex-basis collapsing the region
with no explicit `height` on `Root`) that shaped `Root`/`Viewport`'s actual layout.
