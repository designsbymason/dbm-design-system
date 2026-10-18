# 0095 — `Navbar.Brand` can centre below a width with the start controls drawn before it, and link text comes from their navigation

**Status:** Accepted · **Date:** 2026-10-18

## Context
A shop's phone header is usually the menu and search buttons at the start, the logo in the centre and the other buttons at the end, while a wide window has the logo first and the search field after it. Authoring that needed the brand centred at one width and not another, and the controls on its two sides in a different visual order from the one a wide window reads. A header also wants its primary links in a smaller, semibold, capitalised style, and a courtesy strip thinner than the smallest row.

## Decision
- **`Navbar.Brand` takes `centerBelow`** (a breakpoint step, or `"never"`, the default). Below the step the brand sits centred in the room between the controls on either side, and the menu button and the search field (as a button) are drawn before it and the actions after, by CSS `order` and auto margins on the row (`.inner:has(> .brandCenter…)`), with the gap between controls the actions' own so the two sides match.
- **Only the drawing order changes; the brand stays first in the page**, in the order the bar is written (the brand, then the search, then the actions), as on a wide window. A keyboard on a phone meets the brand before the search button, which is drawn before it; this one-step difference is accepted for the layout, and the menu button, placed first by the author, is first in both.
- **`Navbar.MenuButton` takes `variant` and `size`, and `Navbar.Search` a `buttonVariant`**, so the bar's own icon buttons can match the buttons the author puts beside them; the defaults (quiet, the row's size) are unchanged.
- **A link's text size and weight come from its navigation** (`font-size` and `font-weight` are `inherit` on the link and set on `Navbar.Links`), so one `style` or `className` on `Navbar.Links` sets the text of every link in the bar (capitals, a heavier weight, a smaller size). The menu panel's copy keeps the panel's own text, which is larger and plain, since it is a list to tap.
- **The `xs` row is a thin strip**: the smallest target (24px) plus room (32px), where it had been an `xs` `IconButton` plus room (38px). The height is a minimum, so a strip that holds an `xs` icon button grows to fit it.
- **The search sheet's heading and field are smaller** (a `lg` heading and an `md` field, not `lg` and `xl`-sized).

## Alternatives considered
- **A slot-based row (`Navbar.Start`, `Navbar.Center`, `Navbar.End`).** Rejected: a second layout model beside the one the parts already use, for one common arrangement.
- **Reorder in the DOM at a breakpoint.** Rejected: it needs script, and a server render could not know the width.
- **Put the search before the brand in the page.** Rejected: a wide window would then meet the search before the logo, which is the more common case.
- **A new size below `xs`.** Rejected: the shared scale has nothing below `xs`, and the thin strip is `xs`'s own minimum rather than a new step.
- **Props for case and weight on `Navbar.Links`.** Rejected for the `style` escape hatch the library already offers, which a text style fits.

## Consequences
- The centred brand is truly central only when there are as many controls on each side; the Docs say so.
- A bar's primary text style is the author's, in tokens, which the Docs and snippets show.
- `xs` rows are thinner than before, which is a change to an unreleased component's default.

## Related
`05-component-api-conventions.md` §2 and §6, ADR-0091, ADR-0093, ADR-0094; `component-reviews/Navbar.md`.
