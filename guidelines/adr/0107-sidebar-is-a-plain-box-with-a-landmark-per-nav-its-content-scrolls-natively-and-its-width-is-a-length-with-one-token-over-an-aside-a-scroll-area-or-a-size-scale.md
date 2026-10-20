# 0107 — `Sidebar` is a plain box with a landmark per `Sidebar.Nav`, its content scrolls natively, and its width is a length with one token, over an `<aside>`, a scroll area or a size scale

**Status:** Accepted · **Date:** 2026-10-19

## Context
Three small choices shape what a consumer writes and what a screen reader finds. The WAI-ARIA landmark for a column beside the page's main content is `complementary` (`<aside>`), which is wrong for the page's primary navigation; the middle of the column must scroll while the header and footer stay put; and the width of an expanded sidebar is a page decision, not a step on a shared scale.

## Decision
- **The root is a `<div>` and each `Sidebar.Nav` is a named `<nav>`** (name from `aria-label`, `aria-labelledby` or `labels.navigation`) holding a `role="list"` list (Safari with VoiceOver drops list semantics under `list-style: none`, `05` §6). A sidebar with a main navigation and a settings one is two navigations, told apart by name, and there is no landmark nested inside another.
- **`Sidebar.Content` scrolls with the browser's own scrolling** (`overflow-y: auto`, a thin scrollbar in the quiet border colour, `overscroll-behavior: contain`), not a `ScrollArea`. `ScrollArea` makes its viewport a tab stop whenever it overflows, which puts an unnamed focus stop in front of every item of a navigation whose items are the focusable things; and Radix wraps the viewport's content in a `display: table` box that sizes to the widest label, which stops a label from being cut with an ellipsis unless overridden with `!important`. Native scrolling has neither.
- **Width is the `width` prop** (a number of pixels or any CSS length) defaulting to one component token, `sidebar.width`. It is not the `size` scale: `size` is the height of an item and its icon and text (and so the rail's width), the same steps `Navbar`'s links use, while the expanded width is how much room a page gives its navigation. The phone panel's `Drawer` takes the same length as its `size` (a length is allowed, ADR-0063).
- **`variant` is the sidebar's own look** (`outlined`, `filled`, `ghost`), as `Navbar`'s and `Card`'s are: the container, not a group of controls (`05` §2). The `outlined` line is on the edge the sidebar does not sit against (`border-inline-end` for the `start` side), so it follows `side` and `dir`.
- **Items are compound parts, not a data prop**, as `Navbar`'s links are: an item may be a router's own link (`asChild`), carry a `Badge` and state of its own, and an agent already reads parts.

## Alternatives considered
- **`<aside>` as the root.** Rejected: it announces the primary navigation as a complementary region, and a sidebar often holds content (an account switcher) that is not navigation either.
- **`ScrollArea` for `Content`.** Rejected, for the two reasons above.
- **A `width` step scale (`sm`, `md`, `lg`).** Rejected: it would invent a component-specific scale `05` §2 forbids, and a layout wants an exact measure.
- **An `items` array** (as `DataTable` takes `columns`). Rejected: `DataTable` must know what a row is to sort and page it; a navigation need not.

## Consequences
- The scrollbar is the browser's, so it looks like the platform's rather than `ScrollArea`'s overlay.
- A new component-layer token, `sidebar.width`, is listed in `03-token-system-spec.md`.

## Related
`05-component-api-conventions.md` §2 and §6; ADR-0019, ADR-0028, ADR-0063, ADR-0091, ADR-0104; `component-reviews/Sidebar.md`.
