# 0100 — `Navbar.Actions` hands its row's size to the buttons inside it through `ButtonGroup`'s context, over fixed button sizes or a size on each

**Status:** Accepted · **Date:** 2026-10-18

## Context
The bar's `size` set its height, its links and its own menu and search buttons, but a `Button` or `IconButton` placed in `Navbar.Actions` kept whatever size the author gave it (or the default `md`), so changing the bar's `size` left the actions as they were: a `sm` bar held `md` buttons and an `lg` one small ones, and every bar's author sized each button by hand.

## Decision
- **`Navbar.Actions` provides `ButtonGroup`'s settings context with `size` set to its row's `size` (else the bar's).** A `Button` or `IconButton` inside with no `size` of its own takes it; its own `size` always wins. Whatever an enclosing group already set (variant, tone, `rounded`, `disabled`) is kept, and the provider is `null`-safe outside. This is the pattern `05-component-api-conventions.md` §3 gives for a molecule configuring the atoms inside it, and `Toolbar` already reuses it ([ADR-0025](./0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md)).
- **What it does not cover:** a `SearchInput` or any other field in the actions, which keeps the size it is given, and `Navbar.PanelActions` (the menu panel's footer), which is not in the bar.
- Buttons inside carry `data-variant` (and `data-tone` when neutral), as buttons in any group do; it has no styling effect outside a `ButtonGroup`.

## Alternatives considered
- **A `size` prop on `Navbar.Actions`.** Rejected: the row already says its size, and a second place to set it would drift.
- **A new context for the bar.** Rejected: the existing one already reaches every `Button` and `IconButton`, and a second mechanism would have to be read by both atoms.
- **Leave sizes to the author.** Rejected: the bar's `size` would not size its own right-hand side.

## Consequences
- A bar of any `size` other than `md` that holds unsized buttons now has buttons of that step; `md` bars are as they were.
- An author who wants an action smaller or larger than the bar sets its `size`.

## Related
`05-component-api-conventions.md` §3, ADR-0025, ADR-0099; `component-reviews/Navbar.md`.
