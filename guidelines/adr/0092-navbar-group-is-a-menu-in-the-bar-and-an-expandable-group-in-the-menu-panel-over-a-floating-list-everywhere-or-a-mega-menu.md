# 0092 — `Navbar.Group` is a menu in the bar and an expandable group in the menu panel, over a floating list everywhere or a mega-menu

**Status:** Accepted · **Date:** 2026-10-17

## Context
[ADR-0091](./0091-navbar-collapses-by-a-css-breakpoint-and-draws-its-links-in-the-bar-and-in-the-menu-panel-over-measuring-its-width-or-writing-two-lists.md) left a gap: a header's link often opens more links. The first answer was a recipe (a `Menu` whose trigger is a `Navbar.Link`), and building the checks for it found two faults. In the menu panel, every press of a `Navbar.Link` closed the panel, so a dropdown's trigger closed it as the menu opened; and a floating list opened from inside a side panel on a phone is a small target over a dimmed page, not what a thumb wants.

## Decision
- **`Navbar.Group` takes a `label` and `Navbar.Link` children and draws two ways.** In the bar it is a button that opens a `Menu` of its links (`Menu.Trigger`, `Menu.Content`, and each link a `Menu.Item` drawn on the same `<a>`), so the arrow keys, typeahead, `Escape` and focus return are `Menu`'s. In the menu panel it is a disclosure: a button with `aria-expanded` and `aria-controls`, and its links in a nested list beneath it, indented, collapsed (`hidden`) until pressed.
- **Which one is read from where it is drawn**, by the same panel context the links use to close the panel, so the author writes one group.
- **`current` on a group tints its button and starts it expanded in the panel**; the caller says it, as for a link (`defaultOpen` overrides). A group has no `aria-current`, since a button isn't a page.
- **A press closes the panel only when it is on a link** (an `<a>` with an `href`, which an `asChild` router link is). A button drawn with the link look, a group's button included, leaves the panel open. This corrects ADR-0091's "a link chosen closes it" for the case it did not consider.
- **A group is not nested**: a group in a group is not supported, and the Docs say a wide panel of grouped links (descriptions, images, columns) is `NavigationMenu`'s job.

## Alternatives considered
- **A recipe only** (the first version). Rejected: it closed the panel on its own trigger, and every author would rediscover the phone problem.
- **The floating `Menu` in the panel too.** Rejected: a list floating over a modal side panel is a second layer on a small screen; an expandable group stays in the panel's own scroll.
- **An accordion component for the panel.** Rejected: one disclosure per group needs a button, an id and `hidden`, not `Accordion`'s one-open-at-a-time bookkeeping or its own root.
- **A `groups` data prop on `Navbar.Links`.** Rejected, as for `Toolbar` (ADR-0068): the parts are what an agent already reads.
- **Build the mega-menu now.** Rejected: it is `NavigationMenu` (🟡), a different shape with its own keyboard model.

## Consequences
- `Navbar` imports `Menu` as well as `Drawer`; its JS grows from about 10KB to 14KB gzipped, so it has its own budgets in the bundle check (set with headroom, and raised since as the bar grew).
- A `Navbar.Link` in a group's menu has none of the bar's link styling and takes `Menu`'s item look, so a group's links look like every other menu in an app.
- A disabled group is a native `disabled` button, so it leaves the tab order, unlike a disabled link, which stays focusable.

## Related
`05-component-api-conventions.md` §3, ADR-0054, ADR-0064, ADR-0066, ADR-0067, ADR-0091; `component-reviews/Navbar.md`.
