# 0042 — Yellow is an anchored scale with its own light-end chroma, and its semantic family is named `highlight`

**Status:** Accepted · **Date:** 2026-10-04

## Context
The system had no yellow. Its closest scale, `amber` (hue 75, `amber.600` = `#9C6800`), reads as brown, so a rating's stars, a text marker and a featured badge all looked muddy. The user wanted a general highlight and accent colour for `Highlight`, `Badge`, `RatingInput` and others, anchored at `#949415` as `yellow.600`, and a darker single mustard (not a bright fill plus outline) so that an icon passes the 3:1 non-text floor on its own.

Two things made this more than another scale. The shared OKLCH generator tapers chroma toward the light end the way blue and purple do, which left yellow's `50` to `300` a dull olive-grey (`#FAFBF5`, `#F0F1E5`, `#DFE1C0`), so a marker drawn from them would barely show. And yellow's anchor is only 3.23:1 against white: it passes 3:1 for an icon or a border but cannot hold white text or small text, so the roles can't all sit on the same step the way they do for amber.

## Decision
- **`yellow` is an 11-step primitive scale after `amber`, anchored at `#949415` = `yellow.600`**, lightness from the same anchored curve as purple and emerald, but with **its own chroma curve**: each step takes a fixed share of the largest chroma sRGB can show at that lightness and hue (`50` 0.30 … `500` 0.83, `700` and darker 0.85), so the light end stays plainly yellow. This is a documented exception to the shared taper, in the generator and in `03`.
- **The generator gains `--only=<scale>`**, which writes one scale and leaves every other value alone. A run without it regenerates every scale and would overwrite the manual purple overrides, so yellow is added and maintained with `--only=yellow`.
- **The semantic family is named `highlight`**, by what it is for (existing families are named by meaning, not hue: `brand`, `danger`, `warning`, `success`, `info`, `neutral`), not `yellow`, and not a status. It is the full set (5 `bg`, 2 `text`, 3 `border`, 2 `icon`), shared across both brands, in light and dark.
- **Steps follow the measured contrast, not one step for every role:** light `icon`/`border` 600 (3.23:1), `text` 800 (6.89:1; 700 would be 4.50:1 on the subtle fill and 4.16:1 on its hover), solid `bg` 700 (white on it 4.67:1; 600 gives 3.23:1), subtle 50 and subtle-hover 100; dark `icon`/`text`/`border`/solid `bg` 300 (8.97:1) with `on-highlight` 900 (6.42:1), subtle 950 and subtle-hover 900.
- **It is adopted as a `highlight` tone** on `Icon` (with `on-highlight`), `Highlight`, `Badge` and `RatingInput`, where it is the default. `warning` (amber) is unchanged and stays an option everywhere; `Highlight`'s own default stays `warning`.

## Alternatives considered
- **The stock curve (scale A):** no exception to maintain, but `yellow.50` and `yellow.100` are near-white greys and the marker tint disappears.
- **A hue-eased variant (a warmer yellow in the light steps):** closer to a classic highlighter yellow, but it moves the light steps off the anchor's own hue; the user chose to keep the anchor's hue throughout.
- **Naming the family `yellow` or `accent`:** a hue name breaks "semantic over primitive"; `accent` reads as a second brand colour. A purpose name (`highlight`) is what the family is for.
- **A bright yellow fill with a darker outline carrying the 3:1:** looks most like a classic star, but needs two tokens per use and was not chosen.
- **A minimal semantic set (icon and subtle only):** smaller now, but several components will use it and every one of them would then have asked for the missing tokens one at a time.

## Consequences
- The light-mode `icon.highlight` and `border.highlight` sit right at the floor (3.23:1) and fall under it on `bg.canvas` (2.84:1) and on `bg.highlight-subtle-hover` (2.87:1); they are not used there, and `03` says so.
- A future scale with a similar gamut can reuse the tuned-chroma path in the generator.
- Every further component that wants a `highlight` tone (`Tag`, `Alert`, `Stat`, `Card`, `EmptyState`) is an additive change to a Finalized component and gets its own scoped pass.

## Related
`03-token-system-spec.md` (scale generation, the semantic tables and the notable exceptions); `packages/tokens/scripts/generate-color-scales.mjs`; [Icon.md](../component-reviews/Icon.md), [Highlight.md](../component-reviews/Highlight.md), [Badge.md](../component-reviews/Badge.md), [RatingInput.md](../component-reviews/RatingInput.md).
