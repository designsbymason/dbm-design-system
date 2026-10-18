# 0101 — `Navbar` draws a link's badge with `Badge`, scales its icons with the link and gains a `frosted` variant, and leaves weight and case to a `style`

**Status:** Accepted · **Date:** 2026-10-18

## Context
Three gaps showed up looking at the bar: a link's trailing arrow (and a group's caret) stayed one size whatever the link size; a link's `badge` was an unstyled `<span>`, so "New" and "3" read as plain words beside the text; and a bar over a hero or a page had no way to be translucent, only `ghost` (nothing) or a solid surface.

## Decision
- **A link's weight and case are not props.** A set of categories in bold capitals takes one `style` on `Navbar.Links` (`fontWeight` and `textTransform`, on the font-weight tokens); the links inherit both, and the menu panel's copy and a group's dropdown keep their own text. The Docs show the recipe. *(A `linkWeight` and a `linkTransform` at the bar, row and set were built and then removed before this record was pushed: each is one CSS property that `style` already sets, and nine more declarations to document, test and keep in order were not worth the bar-wide convenience.)*
- **A link's trailing arrow and a group's caret follow the link size**, a step behind the leading icon and never below `xs` (`xs`, `xs`, `xs`, `sm`, `md`); in the panel and in a dropdown they keep `xs`.
- **A link's `badge` is `Badge`'s subtle brand look**, at the size that goes with the text (`xs`, `xs`, `sm`, `md`, `md`), with its height kept to the link's own by a rule on the link (the atom's boxes are 25–34px, taller than a line of link text, which would have made a badged link taller than a plain one): 16, 20, 20, 24, 24px by link step. It replaces the unstyled `.badge` span; the name and the markup order are unchanged (the count is still inside the link).
- **`variant="frosted"`**: a translucent surface (`bg.surface` mixed to 90% with `opacity.90`) with `backdrop-filter: blur(space.3)` (the radius `Backdrop` draws its blur with) and the outlined bar's line under it. At 90% the link text keeps 4.5:1 over the worst case, black behind a light surface (`text.secondary` 5.5:1); 80% measured 4.3:1 and was rejected. Without `backdrop-filter`, and in forced colours, it is a plain surface; a sticky frosted bar keeps its own surface (its bar's is transparent). No new tokens.

## Alternatives considered
- **`linkWeight` and `linkTransform` props at three levels.** Built, then rejected as more customization than the bar needs: `linkSize` sizes five things together and can't be a `style`, but weight and case are one property each.
- **Keep the plain-span badge and style it in `Navbar`.** Rejected: `Badge` is the system's badge, with its tones, contrast checks and sizes; a second pill in the bar would drift from it.
- **A new `Badge` size for links.** Rejected for now: a height override on the link is one rule, and the atom's sizes serve its other uses.
- **80% for the frosted surface.** Rejected for the contrast above.

## Consequences
- A badged link's badge is now a pill (subtle brand fill), which is a visible change to the `badge` look; on a hovered link (the brand tint) its fill blends into the tint and its text still reads.
- Frosted bars show more of the page than outlined ones, so the Docs say what contrast is guaranteed (the text, over any content) and what isn't (an image's detail through the blur).

## Related
`05-component-api-conventions.md` §6, ADR-0095, ADR-0099, ADR-0100; `component-reviews/Navbar.md`.
