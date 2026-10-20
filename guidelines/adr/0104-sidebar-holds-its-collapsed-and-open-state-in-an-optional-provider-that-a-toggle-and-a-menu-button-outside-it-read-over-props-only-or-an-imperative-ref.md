# 0104 — `Sidebar` holds its collapsed and open state in an optional provider that a toggle and a menu button outside it read, over props only or an imperative ref

**Status:** Accepted · **Date:** 2026-10-19

## Context
A sidebar has two pieces of state: whether it is a rail of icons, and whether its phone panel is open. The buttons that change them rarely sit inside it. The button that opens the phone panel is in the page's header (often a `Navbar`), and a collapse button is as likely to be in that header as in the sidebar's own footer. `Navbar` solves the same problem for its menu button by owning the button (`Navbar.MenuButton` is a `Drawer.Trigger`), which only works because the bar owns the panel. Here the panel and the button are in different parts of the page, so something has to connect them.

## Decision
- **`Sidebar.Provider` is an optional, render-nothing component that holds the state** (each of `collapsed` and `menuOpen`, controlled or uncontrolled, with `defaultCollapsed`, `defaultMenuOpen` and the change handlers) and the `collapseBelow` step and `labels`. `Sidebar.Toggle` and `Sidebar.MenuButton` read it, so they can sit anywhere under the provider, and `useSidebar()` returns the same state to a consumer's own parts.
- **A `Sidebar` with no provider around it holds its own state** from its own props, through the same hook the provider uses, and provides the same context to the parts inside it. One sidebar in a page needs no provider.
- **Inside a provider the provider's state wins**, and a sidebar that also sets `collapsed`, `menuOpen` or their defaults and handlers ignores them with a development warning, since two owners of one value would disagree.
- **`Sidebar.MenuButton` is a plain `IconButton`, not the `Drawer`'s trigger.** The panel's `Drawer` is controlled by the shared state, the button records itself on a ref the panel's `onCloseAutoFocus` returns focus to, and it carries `aria-expanded` and `aria-haspopup="dialog"` itself. It and the toggle hide by the same `collapseBelow` step as the sidebar, so the three always agree.
- **It follows the provider, hook and parts shape `Toast` set** (`05` §3, ADR-0070): state in a context, a hook that returns functions with stable identity, and nothing held at module level, so two providers or two server renders never share state.

## Alternatives considered
- **Controlled props only** (`collapsed` and `menuOpen` on `Sidebar`, held in the page's own state). It works, and is still supported, but every page that has a header button would write the same state and the same wiring, which is the work a provider exists to do.
- **A ref with `open()`, `close()` and `toggle()` methods.** Rejected: an imperative handle can't be read during rendering (a toggle's name says "Collapse" or "Expand"), and `05` §3 already prefers state in context.
- **Make `Sidebar.MenuButton` the `Drawer`'s `Trigger`, as `Navbar.MenuButton` is.** Rejected: the Radix trigger must be inside the `Drawer`'s root, which is inside the sidebar, so the button could never sit in a header outside it.
- **A provider that is required.** Rejected: a sidebar with its own toggle in its footer is the common case and needs nothing around it.

## Consequences
- A page with a header button wraps the shell in one `Sidebar.Provider`; a page without one wraps nothing.
- The buttons throw a clear error outside both a sidebar and a provider.
- `collapseBelow` can be set on the provider or the sidebar (the sidebar's wins), and `Sidebar.MenuButton` and `Sidebar.Toggle` read the provider's; a sidebar that sets its own different step inside a provider would leave the buttons on the provider's, which the Docs say.

## Related
`05-component-api-conventions.md` §3; ADR-0061, ADR-0070, ADR-0091; `component-reviews/Sidebar.md`.
