# 0091 — `Navbar` collapses by a CSS breakpoint and draws its links in the bar and in the menu panel, over measuring its width or writing two lists

**Status:** Accepted · **Date:** 2026-10-17

## Context
`Navbar` is the application header: a brand, the primary links and a place for app-wide actions. On a phone the links don't fit and move into a panel behind a menu button, which is `Drawer` ([ADR-0061](./0061-drawer-is-attached-to-a-logical-side-that-can-change-with-the-screen-with-its-own-size-tokens-and-no-swipe-yet.md) names it as the intended consumer). Two questions have more than one reasonable answer:
- **When do the links leave the bar?** `Toolbar` moves what doesn't fit into a menu by measuring ([ADR-0068](./0068-toolbar-moves-what-doesnt-fit-into-a-menu-reading-its-parts-as-they-register-over-a-data-driven-item-list.md)), because its items vary and a bar of icon buttons has no natural width at which to collapse. A header's links are a short list whose collapse is a layout decision made once.
- **Where do the links come from when they are in the panel?** The same `Navbar.Link` items must be in two places, and a link may carry a router's own component (`asChild`) and state of its own.

## Decision
- **The switch is a CSS breakpoint**, `collapseBelow` (default `"md"`, or `"never"`), one class per step on the root that shows the links and hides the menu button from that width up, and the reverse below it. Nothing is measured and nothing reads `matchMedia` to draw, so a server-rendered page is right at first paint and cannot mismatch on hydration. The one use of `matchMedia` is to close an open panel when the window grows past the step, so a modal panel is never left over a bar already showing its links.
- **`Navbar.Links` is drawn in two places from one set of children**: as the bar's own `<nav>`, and, in the panel, inside the `Drawer`'s body. The panel's copy mounts only while it is open; below the step the bar's copy is `display: none`, so it is out of the tab order and the accessibility tree rather than present twice. The cost is that an `id` on a link would be on the page twice while the panel is open, which the Docs say not to give.
- **A link chosen in the panel closes it** (`closeMenuOnNavigate`, default on), whether or not the click's default was prevented: a router's link prevents it to navigate without a page load, which is the link that most needs to close the panel.
- **The menu button is drawn for you** when `Navbar.Links` is a direct child and no `Navbar.MenuButton` is, found by reading the root's children for the two types (as `DataTable` places its parts). A part wrapped in another component still draws and is not noticed.
- **The links are ordinary tab stops, not a roving group.** A navigation is not a toolbar (the disclosure-navigation pattern, not `role="toolbar"`), so there are no arrow-key shortcuts and the bar is not one tab stop.

## Alternatives considered
- **Measure the bar and collapse by what fits**, as `Toolbar` does. Rejected: it needs a DOM read and write on every commit and a first paint that differs from the measured one, for a list whose collapse width the author knows.
- **A separate `Navbar.MobileMenu` the caller writes.** Rejected: two lists to keep in step, and the author who forgets one ships a phone with no navigation.
- **Move one rendered list in and out of the panel** (as `Dialog`'s `keepMounted` does, ADR-0055). Rejected: it is machinery for a list that is cheap to draw twice, and a router link kept mounted across the move would lose its own state for no gain.
- **A single breakpoint-free layout (a wrapping row).** Rejected: a phone needs a list it can reach with a thumb, not a bar of wrapped links.
- **Roving focus with arrow keys.** Rejected: it is the pattern for a toolbar, and a keyboard user expects `Tab` through a site's links.

## Consequences
- A `Navbar` bundle holds the `Drawer` and its stylesheet (about 10KB of JS and 5.7KB of CSS), so it has its own budgets in the bundle check.
- The collapse width follows the window, not the bar's container, so a bar inside a narrow frame on a wide window does not collapse.
- A window resized across the step hides the focused link with the rest of the bar's links, as any responsive layout does; the panel's own focus handling covers the open case.

## Related
`05-component-api-conventions.md` §3, ADR-0021, ADR-0053, ADR-0055, ADR-0061, ADR-0067, ADR-0068, ADR-0085; `component-reviews/Navbar.md`.
