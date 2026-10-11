# Menu — review findings

Fifth organism, built 2026-10-11. **Not Finalized**: the §9 review pass has not been run, and the real-browser checks below are not yet green.

## Decisions
- Wraps Radix DropdownMenu pinned on the Radix release train, holds its own open state, is modal by default and opens on ArrowUp: [ADR-0064](../adr/0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md).
- Item styles live in `Menu`'s own stylesheet for `ContextMenu` and `Menubar` to import; indicators align with `:has()`; the shortcut hint is a `<kbd>` drawn as quiet text, not the `Kbd` atom: [ADR-0065](../adr/0065-menu-draws-its-item-parts-in-its-own-stylesheet-for-contextmenu-and-menubar-to-import-and-aligns-indicators-with-has.md).

## What was found while building it
- **Radix's `Sub` closes itself on focus outside**, so `defaultOpen` on a submenu can't work; `Menu.Sub` has `open` and `onOpenChange` only.
- **Radix lets a consumer's `role`, `aria-checked`, `aria-expanded` and `aria-haspopup` replace its own**; each part states them again after the spread, which is why the root holds the open state.
- **Radix handles only ArrowDown, Enter and Space on a trigger**; ArrowUp-to-last is the wrapper's.
- **Disabled items are skipped by the arrow keys** (not focusable), and Tab does nothing inside an open menu.
- **The highlight fill is a quiet tint** (about 1.04:1 against the panel in light mode, as a `Select` option's is), so keyboard focus also gets a 2px inside ring in `border.focus` (3.99:1 or more in every theme and mode).
- **Contrast** measured for every new pairing (text, icon and focus ring on the panel and on each highlight, Purple and Emerald, light and dark): all clear their floors.

## Checks run
- 108 unit tests: opening and closing, every key, items, checkbox and radio state, groups and labels, submenus (including right-to-left), the attribute-precedence probe on every part, nesting inside a `Dialog`, `StrictMode`, axe, server render and hydration, and the Docs-token test. `pnpm typecheck` and `eslint` are clean.
- Component-level `check-guidelines` findings were fixed except this file's own.

## Open
- **The Storybook (Chromium) run has not passed.** The first run timed out on several real-browser checks and failed the hidden sub-part `Default` stories; the cause has not been read from a full log yet.
- Not yet done: the bundle-size check, a look at the Docs page and every story in light/dark and both brands, the full `pnpm lint`/build, and the §9 pass that decides Finalized.
