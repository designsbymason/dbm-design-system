# 0093 — `Navbar` actions leave the bar by `hideBelow` and return in the panel's footer through a portal, over collapsing every action or writing the panel by hand

**Status:** Accepted · **Date:** 2026-10-17

## Context
[ADR-0091](./0091-navbar-collapses-by-a-css-breakpoint-and-draws-its-links-in-the-bar-and-in-the-menu-panel-over-measuring-its-width-or-writing-two-lists.md) collapses only the links. A bar that also holds a search field, an account menu and a button overflows a phone, and the one action a phone most needs (signing in) has to stay reachable. Two constraints: the menu panel is a `Drawer` drawn by `Navbar.Links` in a portal outside the bar, and the actions are arbitrary components, so the bar can neither measure them nor draw them twice without caring what they hold.

## Decision
- **`Navbar.Action` is an optional wrapper with `hideBelow`** (a breakpoint step): below it the action is `display: none`, by the same literal-width media queries as `collapseBelow`. A bare child of `Navbar.Actions` stays at every width, so nothing changes for a bar that fits.
- **`Navbar.PanelActions` is where an action comes back.** Its children are drawn only in the menu panel's footer, by a portal into the footer element, which the panel hands to the bar through context when it is drawn. It draws nothing in the bar or while the panel is closed. The author writes the control twice (in the bar, hidden below a width, and in the panel's footer), which is plain and lets the panel's copy be a full-width button.
- **The footer exists only when a `PanelActions` is a direct child** of the bar, found by reading its children as for the menu button, so a bar without one has no empty footer and no divider.
- **`hideOnScroll` hides a sticky bar and keeps it while it has focus.** The bar slides out with `translate` on a scroll down past its own height and returns on a scroll up or near the top; a bar that has keyboard focus inside it is never moved out (`:focus-within`), and a hidden bar a `Tab` reaches comes back. It reads the scroll position from a passive listener, one read per frame, and only once mounted, so the first server and client render agree. Without `sticky` it warns and does nothing.
- **A sticky `ghost` bar is transparent until it is stuck**, then takes a surface and a shadow (no new prop: `ghost` with `sticky` never had a coherent look as a permanent surface).

## Alternatives considered
- **Collapse every action into the menu automatically, or by measuring.** Rejected: the actions are arbitrary components with state of their own (a search field's text, a menu's open state), and a measured collapse is the mechanism ADR-0091 declined.
- **Draw each action in both places from one child** (the way `Navbar.Links` draws its links twice). Rejected: a link is a short, stateless item, and an action is not; a duplicated search field would have two inputs and two bits of state.
- **A `panelActions` prop** taking a node. Rejected: it is a second way to compose, and a part is what an agent already reads.
- **Render `Drawer.Footer` from the bar and pass it the actions by registering them in state.** Rejected: registering children in an effect re-renders on every render, and a portal into an element needs no registration.
- **Hide the bar on scroll without regard to focus.** Rejected: it takes the control that has keyboard focus off screen (`06` §9).

## Consequences
- `Navbar.PanelActions` must be a direct child of the bar, which the Docs say; wrapped in a fragment it draws no footer.
- A hidden-on-scroll bar still takes `Tab` focus, which shows it, so a keyboard user can always reach it.

## Related
`05-component-api-conventions.md` §3 and §6, `06-engineering-standards.md` §9, ADR-0060, ADR-0061, ADR-0091, ADR-0092; `component-reviews/Navbar.md`.
