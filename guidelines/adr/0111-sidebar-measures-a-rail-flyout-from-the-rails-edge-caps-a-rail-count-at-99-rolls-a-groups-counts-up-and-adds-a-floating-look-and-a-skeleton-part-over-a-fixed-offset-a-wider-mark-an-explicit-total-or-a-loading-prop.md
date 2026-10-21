# 0111 — `Sidebar` measures a rail flyout from the rail's edge, caps a rail count at 99+, rolls a group's counts up, and adds a floating look and a skeleton part, over a fixed offset, a wider mark, an explicit total or a `loading` prop

**Status:** Accepted · **Date:** 2026-10-21 · follows [ADR-0110](./0110-sidebar-keeps-group-and-section-state-for-the-whole-sidebar-draws-a-rail-open-over-the-page-with-its-surface-in-a-pseudo-element-and-adds-descriptions-and-an-account-part-over-per-copy-state-a-wrapper-or-a-menu-per-consumer.md)

## Context
The review's third tier named five smaller gaps: a rail's flyout starting beside the icon and not the rail's edge, a three-digit count in the rail, a count for a shut group, an inset "card" look, and a loading state. Two recipes from the fourth tier (remembering the collapsed state, filtering the navigation) were to be written as documentation.

## Decision
- **A rail's menu opens from the rail's edge.** The icon sits inside the rail's padding, so `Menu`'s offset from its trigger put the panel over the rail's own line. The group (and an `Account`'s menu in the rail) measures the distance from its button to the rail's outward edge when it opens, and adds `Menu`'s usual gap (4px) to it. It is measured, not written, so it holds at every `size`, on either side and in right-to-left text, and no pixel value is tied to a token. Rail tooltips are left as they were: they are small, and moving them is not worth a second rule.
- **A rail count over 99 reads `99+`, and a mark wider than a circle sits further out.** Three digits make a pill wider than the icon it sits on. A number over 99 is capped (`Badge`'s own `max`), and any mark of more than two characters (the cap, or a word) is set half a `space.1` short of the rail's edge rather than at the icon's corner, so it covers less of the icon and never crosses the rail's line. A `Badge` you pass keeps its own `max`; the expanded sidebar shows the whole number.
- **A group has a `badge`, rolled up by default.** It is shown while the group's items are out of sight: after the label while it is shut, and on the icon in the rail. Left out, it is the total of the numeric `badge`s of the items written inside it, read from the elements as `holdsPath` reads `href`s, so an item drawn by a component of your own is not counted. A total of nothing shows nothing; `badge={null}` shows nothing whatever the items hold; any other value is drawn as an item's badge is.
- **`variant="floating"` is an inset card.** It is a fourth value of `variant`, not a separate prop: the same surface with a margin of `space.2`, `radius.lg`, a line all round and `shadow.sm`. The rail allows for a line on both sides, a sticky card sticks that margin below its offset, and `peek` draws the card's border, radius and shadow on its pseudo-element as it does for the other surfaces.
- **`Sidebar.Skeleton` is a part, with a `loading` label.** It is a list item holding rows the height of an item (an icon and a line of text of varying length, the `Skeleton` atom), one polite "Loading" status and `aria-busy`, with the rows `aria-hidden`; the rail draws the icons alone. It goes where the items go and is replaced by them.
- **The two recipes are documentation, with a story each.** The sidebar stores nothing and filters nothing itself: `collapsed` is controlled state kept where the app keeps preferences (the recipe uses `localStorage` through `useSyncExternalStore`, with a note on a cookie), and a filter is a `SearchInput` over the consumer's own data, with `open={query ? true : undefined}` on the groups that still match and a status region for the count.

## Alternatives considered
- **A fixed offset** (a number in `sideOffset` or a CSS margin on the flyout). Rejected: the gap depends on `size` and on the rail's padding, which are tokens, and a copy of them in JavaScript would drift.
- **Let the rail mark grow toward the icon** (as it did). Rejected: a pill of "99+" then covers the whole icon.
- **Show a dot in the rail for any large count.** Rejected: it loses the number for no gain, and a capped number is the convention.
- **An explicit total only** (`badge` required to show one). Rejected: it is what a consumer would write by hand from the same children, and a count that disagrees with its items is a bug waiting to happen.
- **Counting from the DOM** (reading the rendered badges). Rejected: a shut group's items are hidden and a rail group's are not mounted, so only the elements as written are there.
- **`inset` as a boolean beside `variant`.** Rejected: a card is one of the ways the sidebar is drawn, and a boolean would let `ghost` and `inset` combine into something with no surface to be a card.
- **A `loading` prop on `Nav` or `Section`.** Rejected: it would have to decide what to draw in place of children it has not been given; a part the consumer puts where the items go says it plainly.

## Consequences
- A rail group's menu is positioned from a measurement taken as it opens, so it is right for the layout at that moment; if the sidebar moves while the menu is open, the menu does not follow (a menu already closes on a scroll or resize).
- A rolled-up total counts only what is written as an element with a numeric `badge`. A wrapper component that renders items hides them from it; pass `badge` on the group.
- A floating sidebar's margin is part of its box, so a layout that sets the sidebar's height from its own row gets a card that is a margin shorter than the row.

## Related
`03-token-system-spec.md` (no new tokens); ADR-0106, ADR-0107, ADR-0110; `component-reviews/Sidebar.md`.
