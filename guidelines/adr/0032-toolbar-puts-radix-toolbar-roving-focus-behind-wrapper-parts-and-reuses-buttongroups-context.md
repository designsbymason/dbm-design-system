# 0032 — `Toolbar` gets its roving focus from Radix `Toolbar` through wrapper parts (`Toolbar.Button`, `Toolbar.IconButton`, `Toolbar.Item`) and hands settings down through `ButtonGroup`'s context, over a hand-rolled key handler or a bare container

**Status:** Accepted · **Date:** 2026-10-03

## Context
A toolbar is not a styled row of buttons: it is one tab stop with arrow-key movement between its items (the ARIA toolbar pattern: a roving tab index, `Home`/`End`, direction-aware arrows, focus returning to the last-used item). Two things had to be settled.

**Where the focus behaviour comes from.** It is exactly the kind of interaction logic [ADR-0004](0004-radix-ui-primitives-for-accessibility-logic.md) says to take from Radix rather than write. It is also fiddly to get right (a tab stop that survives its item being disabled, right-to-left, a vertical bar, items that are wrapped in other components).

**How the consumer's buttons join the arrow-key order, and take the bar's settings.** Radix's items are its own elements, but the buttons here are the consumer's `Button` and `IconButton` atoms, often wrapped (a `Tooltip` trigger, a menu trigger), and a bar of ten wants `variant`, `size` and `disabled` said once. [ADR-0025](0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md) already built that channel for `ButtonGroup` and named a future `Toolbar` as a reuser.

## Decision
- **`Toolbar` wraps `@radix-ui/react-toolbar`** (a new dependency, the same family as the Radix primitives already approved). The root is `Toolbar.Root`'s `role="toolbar"`, orientation, `dir` and `loop`; `orientation` also takes a breakpoint map, resolved in JavaScript as `ButtonGroup`'s is. `role` and the orientation are set again after the spread props, as elsewhere.
- **Items are wrapper parts, not automatic.** `Toolbar.Button` and `Toolbar.IconButton` render Radix's toolbar button `asChild` onto the `Button` and `IconButton` atoms; `Toolbar.Item` does the same for any other single focusable element. A plain `Button` placed in a toolbar is just another tab stop; the docs and a test say so. `Toolbar.Group` (a named `role="group"`), `Toolbar.Separator` (Radix's, so its orientation is always across the bar's) and `Toolbar.Spacer` (the existing `Spacer` atom) complete the set.
- **Settings reach the buttons through `ButtonGroup`'s own context**, with no second context: the bar provides `variant` (named `itemVariant` on the bar, since `variant` there means how the bar itself is drawn), `size`, `rounded` and `disabled`, merged with an enclosing `ButtonGroup`'s, and an item's own prop still wins. The bar's own context carries only `disabled`, so an item can leave the arrow-key order when the bar is disabled.
- **`itemVariant` defaults to `ghost`**, because a toolbar of icon buttons is the common case and a row of `primary` buttons is not.
- **A toggle is an icon button with `pressed`**, which the atom already has. There is no `Toolbar.ToggleGroup`; a `ToggleGroup` inside a toolbar would be a second roving-focus group, and Radix has a special part for exactly that nesting. Left out of the first version, not ruled out.

## Alternatives considered
**A hand-rolled key handler** — rejected under ADR-0004: it would re-implement roving focus, direction handling and the "tab stop moves to a still-focusable item" rule, and every one of those has a bug-shaped corner.

**Every `Button` and `IconButton` inside a toolbar joins the order on its own** (the atoms read a toolbar context and register themselves) — rejected. It would make two atoms depend on a roving-focus library, change what a `Button` is outside a toolbar, and make it impossible to put a button in a toolbar that should *not* be in the order. The cost of the chosen route, one wrapper part to remember, is stated in the docs and caught in development by the component simply not responding to the arrow keys.

**`cloneElement` to give each child the roving props** — rejected for the reason in ADR-0015 and ADR-0025: it reaches only direct children, so a wrapped button silently gets nothing.

**A second context beside `ButtonGroup`'s** — rejected: the buttons would read two, and the merge rules (own wins, `disabled` OR-ed, an inner provider keeps the outer's fields) would have to be kept identical in both.

## Consequences
- `Button` and `IconButton` are unchanged. A `ButtonGroup` inside a `Toolbar` keeps the bar's settings for whatever it leaves out, and the reverse; both are tested.
- A disabled or loading item leaves the arrow-key order and a disabled bar disables every item, so a keyboard user cannot arrow *onto* a disabled control (WAI-ARIA allows keeping them focusable; the Radix behaviour was kept rather than overridden). Radix moves the tab stop to a focusable item when the one that held it is disabled; a test pins it.
- A text field inside a toolbar would lose its arrow keys; the docs say not to, and no part accepts one.
- Constrains what follows: `Table Toolbar` (item 28) builds on this rather than reinventing the movement, and an app's menu or popover trigger joins a toolbar through `Toolbar.Item`.

## Related
`04-component-inventory.md` (item 27), `component-reviews/Toolbar.md`, [ADR-0004](0004-radix-ui-primitives-for-accessibility-logic.md), [ADR-0025](0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md).
