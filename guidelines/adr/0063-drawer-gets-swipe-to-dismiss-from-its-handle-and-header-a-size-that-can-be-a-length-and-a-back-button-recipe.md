# 0063 — `Drawer` gets swipe-to-dismiss from its handle and header, a `size` that can be a length, and a Back-button recipe

**Status:** Accepted · **Date:** 2026-10-11

## Context
[ADR-0061](./0061-drawer-is-attached-to-a-logical-side-that-can-change-with-the-screen-with-its-own-size-tokens-and-no-swipe-yet.md) left swipe-to-dismiss for a second pass and gave `size` five steps only. Both were named gaps, along with the phone's Back button closing an open drawer.

## Decision
- **Swipe-to-dismiss, on by default (`swipeToDismiss`).** A touch or a pen drags the panel toward its edge from its handle or its header. The panel follows the finger through two custom properties its stylesheet turns into a transform (no state, no re-render), a short drag settles back, and a drag of 40% of the panel's extent, or a flick faster than 0.5px/ms over at least 24px, closes it with the reason `"swipe"`.
  - The direction is read from the panel's own computed `--drawer-from`, so a responsive `side` and right-to-left text need no second source of truth in script.
  - **A mouse is given it from the handle only.** A drag from the header would select the title, and a mouse has the close button; the handle is a text-free pill that invites dragging, shows a `grab` cursor, and exists only on a `top` or `bottom` drawer. A touch and a pen take hold of either. Moving away from the edge, interactive elements inside the header, a non-primary button and a `busy` drawer are all ignored.
  - **Only the handle and the header take hold**, never the body: the body scrolls, and a drag in a scrolling region is the browser's. The touch action on those two is the drawer's own axis, so the other axis still pans.
  - The exit animation starts from the offset the finger left (`--drawer-drag-*`), so a swiped drawer doesn't jump back before it leaves.
- **A grab handle (`showHandle`, default true)** on a `top` or `bottom` drawer: a decorative pill in a 24px hit area on its inner edge. A `start` or `end` drawer draws none.
- **`size` also takes a CSS length or a number of pixels** (`"min(90vw, 40rem)"`, `360`), set through the panel's own `--drawer-size` property, with the same sliver of page left showing on a smaller viewport. A step is still a class and a token; a value `CSS.supports` rejects warns in development and falls back to the default.
- **The Back button is a documented recipe, not a prop.** Closing on Back is the app's router's to decide, and a hand-made `pushState` fights routers that own the history; the Docs give a controlled-`open` example with one history entry, and say to use the router's own API where there is one.

## Alternatives considered
- **A gesture anywhere on the panel.** Rejected: it competes with the body's scroll and with controls inside it, and cannot tell a scroll from a dismissal without a heuristic that is wrong half the time.
- **Mouse drag from anywhere, as touch has.** Rejected: it selects text, and it has a visible close button. From the handle alone it has neither problem, so that is allowed.
- **A `closeOnBack` prop.** Rejected for now for the router reason above; a recipe leaves the decision with the app.
- **A new set of size tokens for arbitrary widths.** Rejected: the escape hatch is for the one-off, not a second scale.

## Consequences
- The swipe cannot be exercised by a real finger here: the real-browser checks dispatch the pointer events a touch produces, and on-device behaviour (including the interplay with a scrolling body and the browser's own edge gestures) stays unverified, as for the other touch behaviour.
- A drawer's panel always has a transform (the zero drag offset), which makes it the containing block of fixed descendants, as it already was through `will-change`.
- Supersedes only ADR-0061's "swipe waits"; the rest of that record stands.

## Related
ADR-0061, ADR-0062; WCAG 2.5.1 (the gesture is never the only way: the close button, Escape and the scrim remain); `component-reviews/Drawer.md`.
