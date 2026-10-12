# 0068 — `Toolbar` moves what doesn't fit into a `Menu` (`overflow="menu"`), reading its parts as they register, over a data-driven item list

**Status:** Accepted · **Date:** 2026-10-12

## Context
`Toolbar.md` named a gap: a bar that runs out of room scrolls or wraps, and neither is how a production editor's bar behaves, where the less-used commands collapse into a "more" menu. It needed `Menu`, which exists now. Three constraints shaped the answer:
- **The bar's items are components, not data.** `Toolbar.Button`, `Toolbar.IconButton`, `Toolbar.Group` and `Toolbar.ToggleGroup` are written as JSX children, may be wrapped in a caller's own components, and carry state that can be uncontrolled (a `ToggleGroup`'s value).
- **A hidden control must still act.** A menu item has to run the item's own handler, with whatever state that item keeps.
- **Keyboard focus is not to be taken from a person** (`06` §9: a measured collapse never removes the control that has focus).

## Decision
- **A new `overflow="menu"` mode.** One line that fills its container. The items that don't fit are taken from the end, hidden (`display: none`, by a `data-overflowed` attribute) and offered in a "more" `Menu` at the bar's end; the more button is itself an item in the arrow-key order, and is hidden, not removed, while everything fits. Horizontal bars only: a vertical one scrolls, with a development warning.
- **The bar lays itself out by measuring, on every commit and whenever its own width changes.** Each item is measured at its natural width, then items are hidden from the end until the rest and the more button fit. Never hidden: a `pinned` item, a `Toolbar.Item` (an arbitrary element can't be drawn as a menu item), a spacer, and whatever holds keyboard focus (it goes on a later pass, after focus moves on). A separator is hidden when nothing shown comes before or after it, or it would sit straight after another.
- **Parts register themselves with the bar** (`Toolbar.Button`, `IconButton`, `Group`, `ToggleGroup`, `ToggleItem` call `useOverflowEntry`), giving a function that reads their latest props. The menu is built when it opens, from the hidden items, so it is right for a part written by a caller's own component and for state the bar doesn't hold: a toggle's on/off is read from the DOM (`data-state`), a pressed icon button's from its prop.
- **Choosing a menu item presses the real, hidden item** (`element.click()`), so its own `onClick` and state handling run; the menu is read again after, so a toggle's check follows.
- **Mapping:** a `Toolbar.Button` is a `Menu.Item` (its `leadingIcon`, `destructive` as `danger`); a `Toolbar.IconButton` a `Menu.Item` named by its `aria-label`, or a `Menu.CheckboxItem` when it has `pressed`; a `Toolbar.Group` a labelled `Menu.Group`; a single `Toolbar.ToggleGroup` a `Menu.RadioGroup`, a multiple one `Menu.CheckboxItem`s; a separator a `Menu.Separator`.
- **`Toolbar` imports `Menu`**, a molecule using an organism. The tier names are a classification of what a component is, and `05` forbids only an atom importing from a molecule; `Menu` is a menu of actions and a bar of actions is where it is used. The cost is bundle size, which every `Toolbar` pays whether or not it uses the mode: `Toolbar` goes from about 5.7KB to 11.1KB gzipped JS and has its own 12KB budget in the bundle check.
- **`labels.overflow`** names the more button ("More actions"), per ADR-0021.

## Alternatives considered
- **A data-driven bar** (`items={[{ label, icon, onSelect }]}`). Rejected: it would be a second way to write every toolbar, and the compound parts the library is built on are the thing an agent already reads.
- **Render each item twice, once in the bar and once as a menu item, and show one.** Rejected: duplicate ids and accessible names, handlers wired twice, and state held in two places.
- **Convert overflowed children by `cloneElement` into menu items.** Rejected: it breaks on anything wrapped, and on state the part keeps.
- **A separate `OverflowToolbar` organism.** Rejected: two components for one bar, and every consumer choosing between them.
- **Load `Menu` on demand.** Rejected: an async boundary inside a bar that has to measure synchronously before paint, and a flash of the unmenued bar.
- **Collapse from the start or by priority numbers.** Rejected as scope: from the end plus `pinned` covers the cases named, and a priority prop can be added later without breaking either.

## Consequences
- A `Toolbar` bundle is about twice what it was; the 12KB budget records why.
- A part that wraps a control and is not one of the registering parts is never collapsed, which is the safe direction.
- The layout pass is a DOM read and write on each commit while `overflow="menu"` is on; it is skipped in every other mode.
- `Toolbar` is Finalized; the change is additive (a new `overflow` value, `pinned`, `labels`) and is recorded as a scoped follow-up in `Toolbar.md`.

## Related
`05-component-api-conventions.md` §3, `06-engineering-standards.md` §4 and §9, ADR-0021, ADR-0034, ADR-0051, ADR-0064, ADR-0066; `component-reviews/Toolbar.md`, `component-reviews/Menu.md`.
