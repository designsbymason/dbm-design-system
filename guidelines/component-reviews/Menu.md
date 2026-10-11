# Menu — review findings

Fifth organism, built 2026-10-11. **Not Finalized**: the §9 review pass has not been run; the build's own checks are green.

## Decisions
- Wraps Radix DropdownMenu pinned on the Radix release train, holds its own open state, is modal by default and opens on ArrowUp: [ADR-0064](../adr/0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md).
- Item styles live in `Menu`'s own stylesheet for `ContextMenu` and `Menubar` to import; indicators align with `:has()`; the shortcut hint is a `<kbd>` drawn as quiet text, not the `Kbd` atom: [ADR-0065](../adr/0065-menu-draws-its-item-parts-in-its-own-stylesheet-for-contextmenu-and-menubar-to-import-and-aligns-indicators-with-has.md).

## What was found while building it
- **Radix's `Sub` closes itself on focus outside**, so `defaultOpen` on a submenu can't work; `Menu.Sub` has `open` and `onOpenChange` only.
- **Radix lets a consumer's `role`, `aria-checked`, `aria-expanded` and `aria-haspopup` replace its own**; each part states them again after the spread, which is why the root holds the open state.
- **Radix handles only ArrowDown, Enter and Space on a trigger**; ArrowUp-to-last is the wrapper's.
- **Disabled items are skipped by the arrow keys** (not focusable), and Tab does nothing inside an open menu.
- **The highlight fill is a quiet tint** (about 1.04:1 against the panel in light mode, as a `Select` option's is), so keyboard focus also gets a 2px inside ring in `border.focus` (3.99:1 or more in every theme and mode). Radix focuses an item as the pointer passes over it, which showed the ring on hover; the panel now records its last input (`data-input`) and the ring is held back while it is `pointer`.
- **Contrast** measured for every new pairing (text, icon and focus ring on the panel and on each highlight, Purple and Emerald, light and dark): all clear their floors.

## Checks run
- 109 unit tests: opening and closing, every key, items, checkbox and radio state, groups and labels, submenus (including right-to-left), the attribute-precedence probe on every part, nesting inside a `Dialog`, `StrictMode`, axe, server render and hydration, and the Docs-token test.
- 45 real-browser tests (Chromium): 14 hidden sub-part stories for the Properties tables and 31 checks. The checks cover an item chosen with a real mouse in a menu opened from inside a `Dialog` (the top element at its point, the dialog left open), the 24px target and no overflow at every size, a 28-item list capped to the viewport and scrolling with the focused item kept in view, a flip above a trigger at the bottom edge, the panel's width between its caps with a long label wrapping, one left edge for every label beside indicators, the highlight and danger-highlight fills and the keyboard ring, the separator, ArrowUp opening on the last enabled item and Escape returning focus, a right-to-left submenu opening to the left with its caret mirrored, forced colours drawing an outline, and an `IconButton` with a tooltip and a `Toolbar` item both working as triggers.
- Full unit suite (141 files, 7517 tests), `pnpm lint` (eslint and both typechecks), the build, the component bundle-size check (Menu JS 2.84KB, CSS 1.31KB, within budget) and `check-guidelines`.

## Found by the checks
- **Axe reports `aria-hidden-focus` for any story that holds a modal menu open**, because the page behind it, trigger included, is hidden while the trigger stays focusable (focus is trapped in the panel and Tab does nothing, so it is unreachable). The checks file carries `a11y: { test: "todo" }` with that reason, and the docs-only sub-part stories use `modal={false}`. The same markup is axe-checked open, with every kind of part, in the unit tests.
- **The first failing story left the rest timing out**, so a single annotation cleared 27 failures; nothing in the component changed.

## Storybook controls
- Every visible story's controls drive its canvas; a control that a story fixes is `control: false` (`Sizes`: `size` and `defaultOpen`; `Responsive side`: `side`; `Opened from inside a Dialog`: all). `RowActions` takes `align: "end"` as its own arg instead of fixing it, and `RightToLeft` follows `dir`.
- The Playground and Properties tables follow content → visual → behavioural → advanced; a part's `asChild` goes last. Props a story can't drive show "–": handlers, `collisionBoundary`, `container`, and `asChild` on the trigger and item (a single element child is what it needs). `icon` is a select over a few real icons, on each item story's own `argTypes`, not the meta-level ones.

## Open
- The §9 review pass that decides Finalized, including looking at every story and the Docs page in light and dark and in both brands at several viewport widths (the Playground was seen open in the default theme only).
- Not verified: a real touch device, and a screen reader's announcement of the menu and its groups.
