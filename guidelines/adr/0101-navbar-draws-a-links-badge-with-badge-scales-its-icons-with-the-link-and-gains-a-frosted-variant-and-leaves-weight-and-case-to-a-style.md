# 0101 — `Navbar` draws a link's badge with `Badge`, scales its icons with the link and gains a `frosted` variant, and leaves weight and case to a `style`

**Status:** Accepted · **Date:** 2026-10-18 · **Amended 2026-10-19** — the built-in badge's look is solid brand, not subtle brand, and it is drawn at `Badge`'s own size with a margin that keeps the link's height, not forced down to 16–24px; the decision itself is unchanged

## Context
Three gaps showed up looking at the bar: a link's trailing arrow (and a group's caret) stayed one size whatever the link size; a link's `badge` was an unstyled `<span>`, so "New" and "3" read as plain words beside the text; and a bar over a hero or a page had no way to be translucent, only `ghost` (nothing) or a solid surface.

## Decision
- **A link's weight and case are not props.** A set of categories in bold capitals takes one `style` on `Navbar.Links` (`fontWeight` and `textTransform`, on the font-weight tokens); the links inherit both, and the menu panel's copy and a group's dropdown keep their own text. The Docs show the recipe. *(A `linkWeight` and a `linkTransform` at the bar, row and set were built and then removed before this record was pushed: each is one CSS property that `style` already sets, and nine more declarations to document, test and keep in order were not worth the bar-wide convenience.)*
- **A link's trailing arrow and a group's caret follow the link size**, a step behind the leading icon and never below `xs` (`xs`, `xs`, `xs`, `sm`, `md`); in the panel and in a dropdown they keep `xs`.
- **A link's `badge` is `Badge`'s solid brand look** *(Amended 2026-10-19: this originally said subtle brand; the maintainer chose the solid look, which becomes subtle on a current link drawn as a brand fill, where a solid pill would vanish)*, as a round 20px mark at every link size *(Amended 2026-10-19: this originally followed `Badge`'s sizes by link step, `xs`, `xs`, `sm`, `md`, `md`; the maintainer chose the same 20px mark the sidebar draws in its rail)*, with a negative block margin on the badge that makes its margin box one line tall, so a badged link is as tall as a plain one *(Amended 2026-10-19: this originally forced the badge's own height down to 16, 20, 20, 24 and 24px by link step to fit the link, which made a two-digit count an oval where `Badge` draws a circle; the badge is now 20px with 2px of side padding and overflows into the link's padding)*. It replaces the unstyled `.badge` span; the name and the markup order are unchanged (the count is still inside the link).
- **`variant="frosted"`**: a translucent surface (`bg.surface` mixed to 90% with `opacity.90`) with `backdrop-filter: blur(space.3)` (the radius `Backdrop` draws its blur with) and the outlined bar's line under it. At 90% the link text keeps 4.5:1 over the worst case, black behind a light surface (`text.secondary` 5.5:1); 80% measured 4.3:1 and was rejected. Without `backdrop-filter`, and in forced colours, it is a plain surface; a sticky frosted bar keeps its own surface (its bar's is transparent). No new tokens.

## Alternatives considered
- **`linkWeight` and `linkTransform` props at three levels.** Built, then rejected as more customization than the bar needs: `linkSize` sizes five things together and can't be a `style`, but weight and case are one property each.
- **Keep the plain-span badge and style it in `Navbar`.** Rejected: `Badge` is the system's badge, with its tones, contrast checks and sizes; a second pill in the bar would drift from it.
- **A new `Badge` size for links.** Rejected for now: a height override on the link is one rule, and the atom's sizes serve its other uses.
- **80% for the frosted surface.** Rejected for the contrast above.

## Consequences
- A badged link's badge is now a pill (solid brand fill), which is a visible change to the `badge` look; on a hovered link (the brand tint) its fill blends into the tint and its text still reads.
- Frosted bars show more of the page than outlined ones, so the Docs say what contrast is guaranteed (the text, over any content) and what isn't (an image's detail through the blur).

## Related
`05-component-api-conventions.md` §6, ADR-0095, ADR-0099, ADR-0100; `component-reviews/Navbar.md`.
