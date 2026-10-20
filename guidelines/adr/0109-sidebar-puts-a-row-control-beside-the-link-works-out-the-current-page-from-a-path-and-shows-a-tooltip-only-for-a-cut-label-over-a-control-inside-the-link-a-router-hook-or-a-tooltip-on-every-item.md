# 0109 — `Sidebar` puts a row's control beside the link, works out the current page from a path, and shows a tooltip only for a cut label, over a control inside the link, a router hook or a tooltip on every item

**Status:** Accepted · **Date:** 2026-10-20

## Context
A first review of the sidebar named four gaps that most application navigations need: a control at the end of a row (add, more options), the current page worked out instead of written on every item, the full text of a label that is cut short, and where focus starts when the phone panel opens. Each had more than one way to be built.

## Decision
- **A row's control is an `action` prop drawn beside the link, never inside it.** An interactive control inside an `<a>` is invalid HTML and cannot be reached or named on its own, and a link wrapped around a button swallows the button's press. `action` on `Sidebar.Item`, `Sidebar.Group` and `Sidebar.Section` renders a sibling in the same `<li>` (or the heading's row), positioned over the row's end, with the link's end padding sized to make room. It is faint until the row is hovered or has focus (and while a menu it opened is open), always shown on a screen with no hover and in the phone panel, and stays focusable throughout. It is not drawn in the rail or in a rail flyout, which have no room. The buttons in it take ghost, neutral and `xs` from the same context a `ButtonGroup` hands its buttons (a button's own props win), so `IconButton`s need no props to look right.
- **The current page comes from one `currentPath` on the sidebar.** An item whose `href` is that path is current; `match="prefix"` also matches pages below it, at a segment boundary (the root only itself); a group is current when an item written inside it is; an item's or group's own `current` always wins. Paths are compared without query, hash or trailing slash, and an address on another site never matches. It is a string the app passes from its router, so the sidebar knows no router, stays correct on a server render, and `current` remains the way to say it by hand. A group reads the elements written inside it, so an item drawn by a component of the app's own is not seen, which the Docs say.
- **A tooltip shows the full text of a label only when it is cut.** An item or group with a text label opens a tooltip on hover or keyboard focus only if the label's content is wider than its box (read when it is asked to open), so a short label never gets one and the rail keeps the tooltip it already has.
- **The phone panel starts with focus on its first item** (a link or a group's button, whichever is first in the navigation), through `Drawer.Content`'s `onOpenAutoFocus`. Radix's focus scope skips links when it chooses where to begin, which put a keyboard user on a group's button or the close button below the navigation they came for.

## Alternatives considered
- **A `trailing` slot inside the link** (an icon button as a child of the `<a>`). Rejected for the reason above; an `asChild` router link would have no way to carry one at all.
- **Hide the control entirely until hover** (`display: none`, or not mounted). Rejected: a keyboard user could never reach it.
- **`currentPath` from a hook of a particular router, or a `useCurrentPath` provider.** Rejected: it would tie the library to one router and break a server render in the others; a prop is the smallest contract.
- **Match by longest prefix automatically.** Rejected: two items could both claim a page and the winner would depend on order; `exact` by default and `prefix` where asked is predictable.
- **A tooltip on every item.** Rejected: most labels fit, and a tooltip that repeats the visible text is noise (and a second description for a screen reader).

## Consequences
- `Sidebar.Item`, `Group` and `Section` gain `action`; `Item` gains `match`; the sidebar gains `currentPath`. All are optional and change nothing for a sidebar that uses none of them.
- Every item and group with a text label is wrapped in a `Tooltip` that stays closed unless the label is cut.
- A `Sidebar.Group` whose items are drawn by another component needs its own `current`.

## Related
`05-component-api-conventions.md` §3 and §6; ADR-0100, ADR-0105, ADR-0106; `component-reviews/Sidebar.md`.
