# 0037 — `Splitter` is hand-rolled on the window-splitter pattern, with automatic handles and a percentage layout

**Status:** Accepted · **Date:** 2026-10-04 · **Amended 2026-10-04** — a pane's limits may also be written in `rem`; the decision itself is unchanged

## Context
`Splitter` (resizable panes) has no Radix primitive to build on, and four choices had real alternatives: whether to take a dependency or build it, how handles are declared, what unit sizes are held in, and how a pane's own settings (limits, collapse) reach the code that does the resizing.

## Decision
- **Hand-rolled, on the WAI-ARIA window-splitter pattern, with no new dependency.** Each handle is a focusable `role="separator"` with `aria-valuenow`/`min`/`max`, `aria-controls` and arrow, Page, Home, End and Enter keys. The arithmetic (resizing a pair, snapping a collapsible pane shut, normalising a layout) is a pure module (`splitterModel.ts`) tested without React.
- **Handles are inserted automatically between `Splitter.Pane`s**, not declared. There is no way to put one at an end, put two together, or forget one; the cost is that panes must be direct children, which `Splitter` warns about.
- **A layout is an array of percentages of the space the panes share** (the container less its handles), summing to 100. A pane's limits may be percentages or pixels (`"240px"`); pixels are converted against the measured container and re-read when it is resized, so a collapsed strip stays 48px wide. *(Amended 2026-10-04: limits may also be written in `rem` (`"15rem"`), measured against the root font size when the container is measured, so a limit about the text inside keeps up with the text size a person has chosen; added at the same time as the decisions in [ADR-0038](./0038-splitter-panes-have-an-identity-fixed-panes-are-rescaled-and-locked-panes-have-plain-dividers.md).)*
- **`Splitter` reads each pane's limits and collapse props from the child elements** (`child.props`), and hands size and state back through a context. No `cloneElement`, and no registration effect that would render the panes once without sizes.
- **The component keeps no storage.** `layout`/`defaultLayout`/`onLayoutChange` and `onLayoutCommit` let an app save it anywhere (the `usePersistentDismiss` stance: no storage baked into a component).

## Alternatives considered
- **A resizable-panels dependency:** against the dependency budget (`CLAUDE.md`), and every one examined carries its own layout model and styling.
- **Explicit `Splitter.Handle` parts:** more flexible (a per-handle `disabled`, a custom grip) but easy to misuse, and an agent has more to get wrong; the `variant` and `disabled` props cover what the handles need.
- **Pixel or mixed sizes:** a fixed-pixel sidebar next to a flexible pane is the common IDE layout, but it needs a second layout model (and breaks when the container is narrower than the fixed panes). Pixel *limits* cover most of the need.
- **Pane registration through an effect:** panes would first render without sizes and flash.
- **Built-in `autoSaveId` in `localStorage`:** convenient, but storage in the component and a server/client mismatch to manage.

## Consequences
- Panes must be direct children of `Splitter`; a wrapper or fragment is ignored with a development warning.
- The first render has no pixel measurements, so a pixel limit applies after mount (a layout that breaks one is corrected then).
- Pointer drags listen on `window` (and capture the pointer where the browser lets them), so they end however the pointer does and work with synthetic events.

## Related
`04-component-inventory.md` (`Splitter`); [Splitter.md](../component-reviews/Splitter.md); [ADR-0013](./0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md) (the pane's Properties table).
