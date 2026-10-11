# 0065 — `Menu` draws its item parts in its own stylesheet for `ContextMenu` and `Menubar` to import, and aligns indicators with `:has()`

**Status:** Accepted · **Date:** 2026-10-11

## Context
`ContextMenu` and `Menubar` are listed as reusing `Menu`'s items, and `Navbar`, `Sidebar` and `DataTable` row actions use `Menu` itself. How the shared item parts are arranged is the question [ADR-0056](./0056-alertdialog-draws-with-dialogs-sections-and-stylesheet-and-defers-extracting-them-to-the-third-consumer.md) and [ADR-0060](./0060-the-overlay-sections-are-extracted-to-internal-overlay-with-the-panel-staying-each-components-own.md) already answered for the overlays: wait for the third consumer, then extract. Two smaller questions came up with it: how a shortcut hint is drawn, and how labels line up when only some items have an indicator.

## Decision
- **The panel, items, labels, separator and submenu styles live in `Menu`'s own stylesheet.** `ContextMenu` (the second consumer) draws with it by importing it, `05` §1's rule for two components that must look identical and change together. `Menubar`, the third, is the trigger to extract them to `internal/menu`. The class names (`item`, `indicated`, `indicator`, `heading`, `separator`, the size classes and the `--menu-*` custom properties) are a contract between them.
- **A shortcut hint is a `<kbd>` drawn as quiet text, not the `Kbd` atom.** `Kbd` is a keycap (a border, a bottom shadow, a mono face), which repeated down a column of rows reads as a column of buttons and doubles the weight of a row. The element is still `kbd`, so the markup says what it is.
- **Indicator alignment is CSS.** A check or radio item draws its indicator in leading padding, and a panel that contains any such item gives every plain item, submenu trigger and label the same padding through `:has(.indicated)`, so all labels share one left edge. `:has()` is inside the last-two-versions target (`06` §6).

## Alternatives considered
- **Extract to `internal/menu` now.** Rejected for the reason in ADR-0056: it fixes a shape before a second consumer shows what is really common, and `ContextMenu` is that consumer.
- **Reserve the indicator column for every item, always.** Rejected: a menu of plain items would carry an empty column of padding on every row.
- **Register indicators through context, and set a class on the panel from JS.** Rejected: it adds a render pass and a possible first-paint shift to compute what the stylesheet can state.
- **Use `Kbd` for the hint.** Rejected as above; a `Kbd` per key of a chord (`⌘` `K`) was the alternative within it, and is heavier still.

## Consequences
- A rename of a class in `Menu`'s stylesheet needs a check that `ContextMenu` still looks the same, and each component's Docs-token test reads both stylesheets.
- `ContextMenu`'s isolated bundle includes `Menu`'s styles (the bundle-size check says so honestly).
- The indicator rule is one selector; a menu in a browser without `:has()` would show misaligned labels and nothing else.

## Related
`05-component-api-conventions.md` §1, ADR-0056, ADR-0060, [ADR-0064](./0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md); `component-reviews/Menu.md`.
