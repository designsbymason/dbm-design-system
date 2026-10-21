# 0110 — `Sidebar` keeps group and section state for the whole sidebar, draws a rail open over the page with its surface in a pseudo-element, and adds descriptions and an account part, over per-copy state, a wrapper element or a menu written by every consumer

**Status:** Accepted · **Date:** 2026-10-21 · supersedes the clause of [ADR-0105](./0105-sidebar-is-drawn-on-the-page-and-in-a-drawer-panel-below-a-css-step-and-the-panel-is-never-a-rail-over-measuring-its-width-or-moving-one-rendered-copy.md) on a group's state in the two copies

## Context
The second review of the sidebar named six gaps: a rail that opens over the page, a second line under an item, the open state of a group shared between the page and the phone panel, one group open at a time, an account or workspace switcher, and sections that fold. Three of them (the state, the single-open mode and the fold) are one mechanism, and two (the rail and the switcher) change what the sidebar draws.

## Decision
- **Which groups and collapsible sections are open is state of the sidebar, not of each copy.** The sidebar keeps a record of them by key, and a group reads and writes its own. The key is its `value`, or its label under the labels of the groups it is inside (so two `Archive` groups under different parents are two); a section's is its label. A group whose label is not text has no key and keeps its own state. The page's copy, the phone panel's copy and a rail that expands again all read the same record, which retires ADR-0105's consequence that a group opened on the page was shut in the panel. A group nobody has touched follows `defaultOpen`, else the current page, as it changes; a reader's choice then holds.
- **`exclusive` is that record plus a registry of the groups under each parent.** Opening a group shuts the others registered under the same parent; the page's and the panel's copies of one group count as one. It applies to every level, and to a group that started open because it holds the current page.
- **`Sidebar.Section collapsible` makes the heading a button** with `aria-expanded` and `aria-controls`, folding the list with `Collapse` and naming it as before (the list is `aria-labelledby` the heading text). The rail has no headings, so it always shows every list.
- **`peek` draws a rail open over the page without moving the page.** The sidebar's box stays the rail's width in the layout. Its surface (the fill, the line, a shadow) moves to a pseudo-element, which is as wide as the rail at rest and as wide as the sidebar while it peeks, and what is inside is drawn at the sidebar's width over it (pulled toward the start on an end-side sidebar). To what is inside it, it is then an expanded sidebar (`useSidebar().collapsed` reads `false`). A mouse over it, or keyboard focus in it, opens it after a short delay and `Escape` or leaving closes it, unless a menu opened from it is open. It is a mouse and keyboard feature: a touch screen has no hover.
- **`description` is a second line that describes the item.** It is `aria-hidden` and referenced by the link's `aria-describedby`, so it adds to what is read after the name and not to the name itself, and it is hidden, not removed, in the rail.
- **`Sidebar.Account` is the switcher, built from the pieces the sidebar already has:** an item-shaped button with an avatar, a name and a quieter line, opening a `Menu` of the items put inside it (above the button on the page, beside the rail in the rail). It is the avatar alone in the rail, the same width as an item at the `md` and `lg` steps, with the name as its tooltip and accessible name.

## Alternatives considered
- **State in each copy, with a note** (the earlier answer). Rejected once it was a visible inconsistency: open a group on the page, open the panel, and it is shut.
- **A stable id per group from `useId`.** Rejected: the page's copy and the panel's are two mounted components with two ids; a key from the label path is the same in both and survives a remount.
- **A wrapper element around the sidebar for `peek`** (an outer box at the rail's width and an inner one that grows). Rejected: it changes the markup every consumer's `className`, `ref` and tests see, to solve a drawing problem that a pseudo-element solves in the stylesheet.
- **`position: absolute` for the open sidebar with a spacer left behind.** Rejected: it needs a positioned ancestor the sidebar cannot assume.
- **A description as part of the item's name.** Rejected: names should be short, and a description read after the name is what the pattern is for.
- **No account part** (a recipe). Rejected: the rail form, the menu placement and the avatar width are the parts that are hard to get right, and every enterprise sidebar needs one.

## Consequences
- A group or section keeps its open state in the sidebar's record, so a sidebar that remounts its children (a route change that re-renders the whole sidebar) keeps it only if the sidebar itself stays mounted.
- A group that is `current` and has not been touched opens when the current page moves into it, which it did not before.
- `Sidebar.Account` suits the `md` and `lg` steps, whose rail is as wide as its avatar; at `xs` and `sm` give it a smaller `avatar`.
- A peeking rail is drawn above the page at the sticky z-index step and under overlays; a menu opened from it keeps it open.

## Related
`05-component-api-conventions.md` §3 and §6; ADR-0105, ADR-0106, ADR-0109; `component-reviews/Sidebar.md`.
