# 0102 — Overlays put their content out of reach of a button group's settings, over letting them cross the portal

**Status:** Accepted · **Date:** 2026-10-19

## Context
`ButtonGroup` hands its `variant`, `tone`, `size`, `rounded` and `disabled` to the `Button`s and `IconButton`s inside it through a React context ([ADR-0025](./0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md)); `Toolbar` reuses it, and `Navbar.Actions` now gives its row's size the same way ([ADR-0100](./0100-navbar-actions-hands-its-rows-size-to-the-buttons-inside-it-through-the-buttongroup-context-over-fixed-button-sizes-or-a-size-prop-on-each.md)). A React context crosses a portal, so a dialog, popover, menu or hover card opened from inside any of them drew its own buttons in the group's settings: found in a review of `Navbar`, where a `Button` in a `Popover` opened from an `xs` bar was `xs`. Nothing about the overlay's own content is the group's.

## Decision
- **An overlay wraps what a consumer puts in it with `ButtonGroupReset`** (exported from `atoms/Button/buttonGroupContext`, beside the context it resets), which provides `null`: a `Button` or `IconButton` inside reads no group and is as it would be outside one. Applied to `Popover`, `HoverCard`, `Dialog`, `Drawer`, `AlertDialog`, `Menu` (its content and its submenus) and `Tooltip`.
- **Not applied** where the content is the component's own and sets its own button sizes (`DatePicker`'s panel, `Combobox`'s and `Select`'s lists), and not to the generic `Portal` atom, whose `asChild` mode needs its child to be an element: a consumer who portals their own buttons from a group puts a `ButtonGroupReset` round them.
- **No change for a button that is meant to be in the group:** only what is inside an overlay's content is reset, never the trigger.

## Alternatives considered
- **Make `Navbar.Actions` size only its own children** (by cloning `size` onto direct ones). Rejected: it misses buttons nested in `Navbar.Action`, a menu trigger or a tooltip wrapper, and leaves `ButtonGroup` and `Toolbar` with the same leak.
- **Reset in the `Portal` atom.** Rejected: the overlays portal through their Radix primitive's own `Portal`, not the atom, and the atom's `asChild` mode can't take a context provider as its child.
- **Have the atom check where it is in the DOM.** Rejected: it needs a ref and an effect, so the first paint would differ from the second.

## Consequences
- A defect fix: each overlay's own output is unchanged outside a group, so none of them is reopened.
- A new overlay that draws consumer content in a portal wraps it the same way; the rule is in `05-component-api-conventions.md` §3.

## Related
ADR-0025, ADR-0100; `component-reviews/Popover.md`, `HoverCard.md`, `Dialog.md`, `Drawer.md`, `AlertDialog.md`, `Menu.md`, `Tooltip.md`, `Navbar.md`.
