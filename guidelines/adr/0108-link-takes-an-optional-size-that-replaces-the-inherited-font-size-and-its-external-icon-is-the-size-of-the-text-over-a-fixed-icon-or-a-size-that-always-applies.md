# 0108 — `Link` takes an optional `size` that replaces the inherited font size, and its external icon is the size of the text, over a fixed icon or a size that always applies

**Status:** Accepted · **Date:** 2026-10-20

## Context
`Link` had no `size`: it inherits its font size from the text around it (`link.json` says it "inherits its font size rather than owning a size scale"). That is right for a link in a sentence and leaves a link that stands alone (a call to action, a footer link) with no way to be sized except by wrapping it. The external-link icon was a fixed `xs` (12px) glyph whatever the text, so beside large text it looked like a speck, and its `em` offset (`link.icon-offset-inline`) was measured against that fixed 12px, not the text it sat beside. The same gap showed in `Navbar` and `Sidebar`, which draw their own external icons.

## Decision
- **`size` is optional and has no default.** Left out, the link has no font-size rule and inherits: from the text around it, and with no text around it, from its nearest ancestor that sets one (the page's base size if none does). The default behaviour is unchanged.
- **When set, `size` replaces the inherited size.** It is on the scale `Text` and `Heading` use (`xs` to `6xl`, the font-size tokens), as `05` §2 allows for a component whose `size` drives typography, so a link and the text beside it can be sized in the same words. With `asChild` the class goes on the child element.
- **The external icon is the size of the text, one to one, whichever way the size arrives.** Its width and height are a new token, `link.icon-scale` (1em), measured against the link's own text (a link at `sm` has an `sm` icon), so it follows an inherited size, a set one and a size that changes with the viewport. The icon's offset and vertical nudge (`em`) are now measured against that scaled icon.

## Alternatives considered
- **A default size** (`base`). Rejected: a link in a sentence would stop following the sentence, which is the common use and the reason it has none.
- **A separate `iconSize` prop for the icon.** Rejected: a fixed icon size needs choosing for every text size, which is what scaling with the text does for free, and it would be a second way to get the wrong pairing.
- **Pick the icon's `Icon` size from `size`** (a map from text step to icon step). Rejected: it works only when `size` is set, and the common case is an inherited size the component cannot read in JavaScript.
- **One step of the type scale smaller than the text** (0.833em), which was built first and is the pairing `Navbar` and `Sidebar` use for their trailing icons. Rejected at the maintainer's direction: for a link the icon is read as part of the word, and one to one keeps it from looking small beside it.
- **Leave the icon at 12px.** The status quo, rejected after it was seen beside 20px icons in `Sidebar` and `Navbar` and beside large text.

## Consequences
- The external icon is larger in body text (16px beside 16px text, where it was 12px) and scales up in large text. It is drawn by `Link`, so `Breadcrumb.Link` and any other consumer's external links change with it.
- `Navbar` and `Sidebar` draw their own external icons, sized one step below their own leading icon (`Navbar`'s `linkTrailingIconSize`, the sidebar's `externalIconSizeFor`), and are unchanged by this.
- `link.icon-scale` joins `link.icon-offset-inline` and `link.icon-vertical-align` in `03-token-system-spec.md`.

## Related
`05-component-api-conventions.md` §2; ADR-0021; `component-reviews/Link.md`.
