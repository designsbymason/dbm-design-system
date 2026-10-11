# 0064 — `Menu` wraps Radix DropdownMenu on the pinned release train, holds its own open state, is modal by default and opens on ArrowUp

**Status:** Accepted · **Date:** 2026-10-11

## Context
`Menu` is the fifth organism, and `ContextMenu`, `Menubar`, `Navbar`, `Sidebar` and `DataTable` row actions build on it, so how it sits on Radix constrains them. A spike against the real packages settled four things the documents could not:
- `@radix-ui/react-dropdown-menu@2.1.24` depends on `react-menu@2.1.24`, whose `popper`, `portal`, `presence`, `collection`, `focus-scope`, `focus-guards`, `roving-focus` and `dismissable-layer` are exactly the versions already installed (`dismissable-layer@1.1.19`, the one [ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md) protects). Installing it added two packages and no second copy of any layer package. `2.1.25` depends on `dismissable-layer@1.1.20` and `focus-scope@1.2.0`, which would split the layer stack, so a `Menu` opened from a `Dialog` or a `Popover` would stop receiving presses.
- Radix computes a trigger's `aria-haspopup` and `aria-expanded` and an item's `role` and `aria-checked` *before* spreading the props it is given, so a consumer's same-named prop replaces them (`05` §3). The wrapper has to state them again after the spread, which means it has to know the open and checked state.
- Radix's `Sub` closes itself as soon as focus is anywhere but in the submenu or on its trigger, so a submenu opened by `defaultOpen` shuts as the menu around it takes focus (reproduced with the raw primitive, `defaultOpen` and a controlled `open` alike; only the controlled one stays drawn).
- The menu-button pattern lets ArrowUp open the menu onto its last item, and Radix handles only ArrowDown, Enter and Space on the trigger. Radix gives a dropdown no hook for where focus lands as it opens (`onOpenAutoFocus` is not on its content).

## Decision
- **`Menu` wraps `@radix-ui/react-dropdown-menu`**, pinned to `2.1.24` with no caret, until the other Radix packages move. A refresh moves them together and re-checks that one copy of each remains ([ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md)).
- **The root and each `Menu.Sub` hold their open state themselves** (`open`/`defaultOpen`/`onOpenChange`, uncontrolled when `open` is omitted) and feed it to Radix, as `Dialog` does, so the trigger states `aria-haspopup` and `aria-expanded` after the spread. A checkbox item and a radio group do the same with `checked` and `value`, which also gives them `defaultChecked` and `defaultValue` that Radix has no equivalent of; each item restates its `role` and `aria-checked` after the spread.
- **`modal` defaults to `true`**, as a native menu behaves: the page behind is inert, its scroll is locked, and a press outside only closes the menu. `Popover`'s `false` is right for content that coexists with the page; a list of actions is not that.
- **ArrowUp on the trigger opens the menu onto its last item that can take focus.** The wrapper opens the menu and, once Radix has settled focus on the first item, moves it, one animation frame later.
- **`Menu.Sub` takes `open` and `onOpenChange` and no `defaultOpen`**, rather than a documented prop that closes itself ([ADR-0017](./0017-popover-omits-anchor-sub-part-pending-upstream-fix.md)'s approach). Opening one by default is not a use a menu has.
- **The panel has no arrow.** A menu hangs off its trigger's edge; `Popover`'s arrow points at what the content is about.

## Alternatives considered
- **Take the newest Radix packages (`2.1.25`).** Rejected for now: it silently splits the layer stack, and a nested `Popover`, `Select` or `Dialog` stops working with no error.
- **Build on `@radix-ui/react-menu` directly.** Rejected: it is what `DropdownMenu` wraps, and the wrapper only adds the trigger's id and `aria-controls` wiring, which we would then write ourselves for no gain.
- **Compose `Popover` with a hand-rolled roving focus and typeahead.** Rejected under [ADR-0004](./0004-radix-ui-primitives-for-accessibility-logic.md): submenu pointer-grace areas, typeahead and nested dismissal are exactly the subtle behaviour Radix is adopted for.
- **Keep `Sub`'s `defaultOpen` and ignore the primitive's close-on-focus-outside.** Rejected: the prop would exist in the types and the Properties table and do nothing, which is worse than not offering it.
- **Leave ArrowUp to the browser.** Rejected: it does nothing on a button, so a person who opens a menu at the bottom of a list by key has no way to start from its end except End.

## Consequences
- A refresh of the Radix packages re-checks the single copy of each layer package with `pnpm why`, as `Dialog`'s pin already requires.
- `Menu`'s bundle carries Radix Menu, which is larger than Popover's; its budget is its own measured size, not an override of convenience.
- `ContextMenu` and `Menubar` come from Radix's own `context-menu` and `menubar`, which share `react-menu`: the same pin applies to them, and their packages are added at the version that shares it.
- ArrowUp-to-last is the wrapper's, so a future Radix that lands focus differently is covered by the real-browser check that presses it.

## Related
`04-component-inventory.md` (Menu row), `02-tech-stack-and-structure.md` §3.2 (refresh pass), ADR-0004, ADR-0017, ADR-0052, [ADR-0054](./0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md), [ADR-0065](./0065-menu-draws-its-item-parts-in-its-own-stylesheet-for-contextmenu-and-menubar-to-import-and-aligns-indicators-with-has.md); `component-reviews/Menu.md`.
