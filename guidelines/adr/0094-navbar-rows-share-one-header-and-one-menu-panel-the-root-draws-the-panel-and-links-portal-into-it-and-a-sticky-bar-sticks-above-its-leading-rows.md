# 0094 — `Navbar` rows share one header and one menu panel: the bar draws the panel and each set of links portals into it, and a sticky bar sticks above its leading rows

**Status:** Accepted · **Date:** 2026-10-18

## Context
A site header is often several bands: a courtesy strip, a row with the logo, a search field and the account buttons, and a row of categories. `Navbar` was one row with one set of links. Stacking several `Navbar`s gives the page several banner landmarks, several menu buttons and panels, and several sticky bars. Three things had to be decided together: where the rows live, how several sets of links share the phone menu, and how some rows can scroll away while the rest stick.

## Decision
- **`Navbar.Row` is a band inside the one `<header>`.** A bar with no rows draws its parts as one implicit row, so every existing bar is unchanged. Each row starts from the bar's `variant`, `size` and `contained` and can set its own; `size` gains `xs`, for a thin strip, on the existing icon-button heights, so a row needs no token of its own. A bar's own surface lives on its rows. Parts are found among the bar's children and in its rows, through fragments, and loose parts beside rows warn in development (the skip link and the panel actions may sit beside them).
- **The bar draws the menu panel once, and each `Navbar.Links` puts its copy of its links into it by a portal** (the pattern `Navbar.PanelActions` already uses), in the order the sets are written. This supersedes [ADR-0091](./0091-navbar-collapses-by-a-css-breakpoint-and-draws-its-links-in-the-bar-and-in-the-menu-panel-over-measuring-its-width-or-writing-two-lists.md)'s clause that `Navbar.Links` draws the panel, which two sets could not share. A `quiet` set goes into a second container after the first, so a courtesy row's links come last in the DOM as on screen. Two sets with the same name warn, since they are separate landmarks.
- **The automatic menu button goes at the end of the first row that holds the brand**, or the first row, and a `Navbar.MenuButton` placed by hand still wins.
- **A sticky bar sticks above its leading rows that scroll away.** Rows can't stick independently: a sticky element sticks only within its parent, and the parent here is the header, which is no taller than its rows. So the header is the sticky element and its `top` is the offset minus the combined height of the leading `sticky={false}` rows, which scroll off while the rest stays. That height is measured from the rows and kept current with a `ResizeObserver`, only once mounted, so the server and first client renders agree. Only leading rows can scroll away; a later one warns and sticks.
- **Such a bar is stuck by its own measure.** `Affix` reports stuck from the first pixel, while the leading rows are still on screen, which would put the shadow and the ghost bar's surface on too early. A bar with leading rows is stuck once the page (or its scroll container) has scrolled past them (`data-navbar-stuck`). `Affix`, which is Finalized, is unchanged.
- **`Navbar.Search` is a `role="search"` landmark that gives way to a button and a top sheet below a width.** The sheet is a `Drawer side="top"`, so Escape, the focus trap and focus return are `Drawer`'s. The bar's field and the sheet's are two inputs; a controlled `value` keeps them in step. The field's width is a flex-basis (`navbar.search-min-width`) and a cap (`navbar.search-max-width`): it gives up its basis when the row is crowded, so it can't push its neighbour out.

## Alternatives considered
- **A separate `Header` shell.** Rejected: it would repeat the collapse, panel, sticky and current-link work, and an agent would have two names to choose between.
- **Stack several `Navbar`s.** Rejected, as above: several banners, buttons and panels.
- **Each row sticks on its own.** Not possible with one sticky parent; the only way would be one sticky element per row, each with its own offset, which has to know the heights above it and still breaks when a row wraps.
- **Move the search under the row on a phone by wrapping.** Rejected: the field would come after the actions on screen but before them in the DOM, so the focus order would jump.
- **Expand the field in place.** Rejected for more state than a `Drawer` already holds.
- **Register each set of links in state and draw the panel from it.** Rejected: registering children in an effect re-renders on every render; a portal into an element needs no registry.
- **Change `Affix` to report stuck at a distance.** Rejected: it is Finalized, and the bar already reads the scroll position for `hideOnScroll`.

## Consequences
- `Navbar.Links` is drawn in the bar even when the bar draws no panel (a part the bar can't find draws no panel and no menu button), which the Docs state.
- A set of links that mounts after the panel opens goes at the end of its container.
- `Navbar`'s bundle grows with the search sheet; its budgets are raised in the bundle check.
- A window resized past a row's collapse width behaves as before.

## Related
`05-component-api-conventions.md` §3 and §6, `06-engineering-standards.md` §9, ADR-0061, ADR-0067, ADR-0091, ADR-0093; `component-reviews/Navbar.md`.
