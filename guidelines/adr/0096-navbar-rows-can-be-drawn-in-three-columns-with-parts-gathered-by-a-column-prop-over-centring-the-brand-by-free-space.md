# 0096 — `Navbar.Row` can be drawn in three columns, with parts gathered by a `column` prop, over centring the brand by the free space

**Status:** Accepted · **Date:** 2026-10-18

## Context
ADR-0095 centred the brand below a width by CSS `order` and auto margins on the row: the brand sat in the room between the controls on either side, so it was truly central only when both sides held the same number of controls. A header with one button at the start and two at the end put the logo about half a button off the middle. The same ADR rejected a slot-based row as a second layout model for one arrangement; the arrangement turned out to need equal sides, which a flex row with a content-sized centre cannot give.

## Decision
- **`Navbar.Row` takes `columns` and `columnsBelow`.** `columns` is `"balanced"` (equal side tracks, a content-sized centre) or any CSS `grid-template-columns` track list; `columnsBelow` is a breakpoint step, `"md"` by default. Below the step the row is a grid of three tracks. Above it the row flows as a row without `columns` does.
- **Parts are gathered into a group per column by the row, by a `column` prop** (`"start" | "center" | "end"`) on `Navbar.Brand`, `Navbar.Links`, `Navbar.Search`, `Navbar.Actions` and `Navbar.MenuButton`. A part with none is in its default column (the menu button and the search start, the brand and the links centre, the actions end), else the column of the part before it (the start for the first). No new parts are added.
- **The groups are `display: contents` above the step**, so the parts flow in the row as before, and flex or grid items below it.
- **The page has the groups in the order their first part is written, and the parts in each in the order written.** Write the brand first and it is first in the page, as on a wide window. The menu button is drawn first in its column wherever it is written (`order`), and the automatic menu button is the row's last part, as without columns.
- **`Navbar.Brand`'s `centerBelow` is removed**, with the six `brandCenter*` blocks. The component is unreleased, so there is no migration. ADR-0095's clause on `centerBelow` is superseded; the rest of it (the menu button's and the search button's looks, link text from the navigation, the `xs` strip, the smaller sheet) stands.

## Alternatives considered
- **`Navbar.Start`, `Navbar.Center` and `Navbar.End` wrapper parts.** Rejected: three new parts to learn, and the author writes the groups in the order they are drawn, so a wide window would meet the search before the logo in the page.
- **Centre the brand by absolute position.** Rejected: nothing stops it overlapping a crowded side, and the author gets no say over the widths.
- **Keep `centerBelow` beside `columns`.** Rejected: two ways to one layout, one of them unable to centre.
- **Per-breakpoint track lists.** Deferred: one step matches `collapseBelow` and the rest of the family, and a responsive value can be added without changing the prop.
- **Keep the page in the written order exactly, with a wrapper per run of parts.** Rejected: runs in the same column cannot share a grid cell.

## Consequences
- The logo is central however many controls are on each side; an empty column keeps its track.
- Between groups the page's order can differ from the order a column layout draws (the menu button is drawn first in the start column but written after the brand); a keyboard on a phone meets the controls in the order the groups are written. The Docs say so.
- A side with more in it than its track holds spills over its neighbour; a custom track list is the way to give it room.
- A part wrapped in the author's own component is not recognised for its default column. The row reads `column` from the element it is given, so give the wrapper a `column`, or it follows the part before it.

## Related
`05-component-api-conventions.md` §2, ADR-0094, ADR-0095; `component-reviews/Navbar.md`.
