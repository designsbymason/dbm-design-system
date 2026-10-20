# 0106 — `Sidebar` collapses to a rail where an icon stays put, its text is a tooltip and a group is a menu, and expanded groups open with `Collapse` to three levels, over hiding the column or a tree

**Status:** Accepted · **Date:** 2026-10-19

## Context
A sidebar that can narrow to icons keeps the navigation one press away on a wide screen while giving the page its width back. The rail has no room for text, a badge or a nested list, so each of those needs another form, and a group of links needs somewhere to open. [ADR-0092](./0092-navbar-group-is-a-menu-in-the-bar-and-an-expandable-group-in-the-menu-panel-over-a-floating-list-everywhere-or-a-mega-menu.md) decided the same question for `Navbar.Group` (a `Menu` in the bar, a disclosure in the panel).

## Decision
- **The rail is as wide as one item plus the sidebar's padding, and an item is its icon plus equal padding on every side**, so the rail's width, an item's width in it and the distance of its icon from the edge all come from the one step (`size`), derived in CSS from the icon-size and spacing tokens. An icon is therefore in the same place expanded and collapsed and never moves as the column opens and closes. The rail's width is not a token.
- **An item's text in the rail is clipped to a pixel, not removed**, so it stays the item's accessible name (with a badge's count and an external cue), and it is shown in a `Tooltip` beside the rail on hover and keyboard focus. A badge becomes a small mark on the icon's corner. An item with no icon draws its text's first letter, and warns in development when there is not even that.
- **A top-level group in the rail is an icon button that opens a floating `Menu`**, titled by the group's text, holding its items as menu items (arrow keys, typeahead, `Escape`, focus return); a group nested in it is a `Menu.Sub`. The flyout opens away from the edge the sidebar sits against. This is ADR-0092's choice for the bar, for the same reason: a list that expands in place has nowhere to go in a column one icon wide.
- **Expanded, a group is a disclosure button** (`aria-expanded`, `aria-controls`) opening its items beneath it with `Collapse`, indented so their text lines up under the group's own, and the same group nests to three levels (a development warning past that). A group that holds the current page starts open and marks its own button only while it is shut, so the page itself is the one thing marked once it is in view. A group is a button only: a parent that is also a page is its own first item.
- **The group's open state belongs to the group**, not the sidebar, so it survives a collapse to the rail and an expand again, and is controlled with `open`, `defaultOpen` and `onOpenChange`.

## Alternatives considered
- **Hide the column entirely** (no rail). Rejected: it takes the navigation away on a wide screen, where the room is free.
- **Show a tooltip with text and let the label stay visible in a wider rail.** Rejected: a wider rail is a narrow sidebar, with the cost of both.
- **One `Menu` for every group in both states.** Rejected: a floating list over a page when there is room to expand in place is a worse list, and on a phone it is a second layer over a panel (ADR-0092).
- **A tree** (`role="tree"`, arrow-key movement, selection) for the nested groups. Rejected: a navigation is a list of links and ordinary tab stops (the disclosure-navigation pattern), a tree is a different keyboard model for data, and `Tree` is its own planned component.
- **Unlimited nesting.** Rejected: a hierarchy deeper than three is a site map, and the rail's flyout of submenus does not scale to it.

## Consequences
- Every item and top-level group should carry an `icon`; the Docs and the types say so.
- A badge's count is lost visually in the rail (a mark on the icon is drawn, and the count stays in the name and is announced).
- `Tooltip`, `Menu`, `Collapse` and `Badge` are all Finalized and unchanged by this.

## Related
`05-component-api-conventions.md` §3 and §6; ADR-0064, ADR-0065, ADR-0092, ADR-0104, ADR-0105; `component-reviews/Sidebar.md`.
