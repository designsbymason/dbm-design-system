# 0105 — `Sidebar` is drawn on the page and in a `Drawer` panel below a CSS step, and the panel is never a rail, over measuring its width or moving one rendered copy

**Status:** Accepted, the clause on a group's state in the two copies superseded by [0110](./0110-sidebar-keeps-group-and-section-state-for-the-whole-sidebar-draws-a-rail-open-over-the-page-with-its-surface-in-a-pseudo-element-and-adds-descriptions-and-an-account-part-over-per-copy-state-a-wrapper-or-a-menu-per-consumer.md) · **Date:** 2026-10-19

## Context
On a phone a navigation column has no room beside the page and becomes a side panel opened from a menu button. [ADR-0061](./0061-drawer-is-attached-to-a-logical-side-that-can-change-with-the-screen-with-its-own-size-tokens-and-no-swipe-yet.md) names `Sidebar` as a consumer of `Drawer` for this, and [ADR-0091](./0091-navbar-collapses-by-a-css-breakpoint-and-draws-its-links-in-the-bar-and-in-the-menu-panel-over-measuring-its-width-or-writing-two-lists.md) decided the same question for `Navbar`'s links. A sidebar differs in two ways: what it holds is large and stateful (groups that are open, an account menu, a search field of the consumer's), and it has a collapsed form (the rail) that makes no sense in a panel.

## Decision
- **The switch is a CSS step, `collapseBelow`** (default `"md"`, or `"never"`), one class per step on the root that hides the page's copy below it, as `Navbar` does. Nothing is measured and nothing reads `matchMedia` to draw, so a server-rendered page is right at first paint and cannot mismatch on hydration. The one use of `matchMedia` is to close an open panel when the window grows past the step.
- **The children are drawn twice from one set**: on the page, and inside a `Drawer` panel (`side` from the sidebar's own `side`, `size` its width) that mounts them only while it is open. The page's copy is `display: none` below the step, so it leaves the tab order and the accessibility tree rather than being present twice. The cost is that an `id` on an item would be on the page twice while the panel is open, which the Docs say not to give, and that a group's open state in one copy is not the other's.
- **The panel is never a rail.** Its copy gets a context in which `railed` is false whatever the page's sidebar is, and `useSidebar().collapsed` reads `false` there, so a consumer's header draws its full form. `Sidebar.Toggle` draws nothing in the panel.
- **An item chosen in the panel closes it** (`closeMenuOnNavigate`, default on), whether or not the click's default was prevented, since a router's link prevents it to navigate without a page load. Only an `<a href>` does it: a button item and a group's button leave the panel open, the correction ADR-0092 made for `Navbar`.
- **Focus goes back to the button that opened the panel**, which is not the `Drawer`'s own trigger (ADR-0104), through a ref the panel's `onCloseAutoFocus` reads.

## Alternatives considered
- **Measure the sidebar and move to a panel by its container's width.** Rejected, as in ADR-0091: it needs a DOM read and write on every commit and a first paint that differs from the measured one, for a step the author knows.
- **Move one rendered copy in and out of the panel** (`Dialog`'s `keepMounted`, ADR-0055). It would keep a group's state and a consumer's search field, which is the real cost of drawing twice. Rejected for now: it is machinery that changes where the element lives on resize, loses a router link's own state across the move for no gain on most pages, and cannot be server-rendered in both places. A consumer who needs the state to survive holds it in their own state, which the Docs say.
- **Make the sidebar itself the `Drawer` below the step** (a `Drawer` that is open and docked on a wide screen). Rejected: it would put a modal's scroll lock and focus trap on a page's own column.
- **A rail in the panel.** Rejected: a panel opened to find a link has room, and a column of icons in it would be a worse list.

## Consequences
- A `Sidebar`'s bundle holds the `Drawer`, `Menu`, `Tooltip` and `Collapse` it draws with, so it has its own budgets in the bundle check.
- The collapse follows the window width, not the sidebar's container, so a sidebar in a narrow frame on a wide window does not collapse.
- A window resized across the step hides the focused control with the rest of the page's copy, as any responsive layout does; the panel's own focus handling covers the open case.

## Related
`05-component-api-conventions.md` §3; ADR-0054, ADR-0055, ADR-0060, ADR-0061, ADR-0091, ADR-0092, ADR-0104; `component-reviews/Sidebar.md`.
