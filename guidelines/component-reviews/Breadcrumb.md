# Breadcrumb

**Tier:** molecule · **Category:** Navigation · **Status:** built 2026-09-23; **not Finalized** — awaiting the user's own review pass and declaration.

## What was built

A compound component over a `<nav>` and an ordered list: `Breadcrumb` (root), `Breadcrumb.Item` (`<li>`), `Breadcrumb.Link` (the `Link` atom, restyled), `Breadcrumb.Page` (the current page, `aria-current="page"`). No Radix primitive underneath, so no new dependency; no new token. Files: the standard set plus three hidden docs-only stories files for the sub-parts ([ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md)).

Props on the root: `size` (shared 5-step scale), `separator` (`"chevron"` default, `"slash"`, or any string/element), `maxItems`/`itemsBeforeCollapse`/`itemsAfterCollapse`, `labels` (`navigation`, `expand(hiddenCount)`), `aria-label`/`aria-labelledby`, and the usual `className`/`style`/`id`/`data-testid`. `Breadcrumb.Link` and `Breadcrumb.Page` take a leading `icon`; `Breadcrumb.Link` also takes everything `Link` does (`external`, `disabled`, `asChild`, native anchor props) except `underline`.

## Decisions taken while building (none needed an ADR)

- **Compound, one item per level, rather than an `items` array.** Follows `05` §4 (a compound for anything with sub-parts) and keeps a router link a plain child (`asChild`). The cost is that the root has to look at its children to collapse them: it reads `Children.toArray(children)` and renders only `Breadcrumb.Item` elements, so a fragment wrapping several items is ignored (with a dev warning) — documented on the Docs page.
- **The separator belongs to the item, drawn by the component** — a hidden `<span>` inside each `<li>` but the last, never a CSS pseudo-element (a custom element or string can't be one), and never in the accessibility tree (the list already says how many levels there are and which one you're on). Chevron flips under RTL through `:dir(rtl)`, the same as `Pagination`'s arrows.
- **Collapsing expands in place** (a "…" `IconButton`, `variant="tertiary"`, its name from `labels.expand(n)`), rather than opening a menu of the hidden items. Expanding removes the button, so focus is moved to the first revealed item's link — the "never remove the focused control" rule in `06` §9, tested with real keyboard input in a real browser (`CollapseInteraction`) and under `StrictMode` in the unit tests. It only collapses when at least two items would be hidden; `itemsAfterCollapse` is clamped to at least 1 so the current page is never the one that collapses; a dev warning fires when before + after fill `maxItems`.
- **`labels` without `formatNumber`** ([ADR-0021](../adr/0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md)): the only number in any text is the hidden-item count inside the "…" button's accessible name, which is never shown, so a caller's own `expand` function formats it. Nothing visible needs a formatter.
- **`Breadcrumb.Link` composes `Link`** (atom-reuse audit) with `underline="hover"` — a link in a navigation list isn't running through body text, the case the atom's `always` default protects — and overrides the colour with `a.link` / `a.link:visited` (element-qualified, so it wins over the atom's own `:visited` rule whichever stylesheet loads last). `icon` is not drawn with `asChild` (the slotted element owns its content); a dev warning says so.
- **Quiet colours:** links `text.secondary`, hover and current page `text.primary`, the current page also `font-weight.semibold` so it isn't set apart by colour alone.
- **The "…" button is the smallest `IconButton` (30px) up to `lg`**, `sm` at `xl`. An `IconButton` of the trail's own size is as tall as a `Button` of that size, far taller than a line of text; even the smallest makes its own line slightly taller than the others — accepted.
- **Separators are top-aligned to the first line of a wrapped label** (`1lh`-high, `align-items: flex-start`; the "…" item centres instead through `:has()`), found by looking at a phone-width screenshot.

## Findings from the build

- **Contrast — measured, not recalled.** The first draft of the Docs page quoted contrast figures from memory and had light and dark the wrong way round; and the separators were first `icon.secondary`, which is 2.86:1 (light) / 2.12:1 (dark) on `bg.canvas`. Recomputed from the primitive values: `text.secondary` 6.88 / 10.47 on the surface and 6.05 / 5.10 on the canvas; `text.primary` 14.11 / 13.53 on the surface and 12.41 / 6.59 on the canvas. The separators moved to `icon.default` (4.70 / 8.21 on the surface, 4.13 / 2.96 on the canvas). **Still a hair under 3:1 in dark mode on the canvas (2.96)** — accepted for a purely decorative, aria-hidden glyph that only repeats what the list and the spacing show (1.4.11 doesn't bind it); recorded on the Docs page.
- **The `Link` router placeholder** — the snippet guard rejects a component the package doesn't export, so the `asChild` snippet uses a plain `<a>` and a comment saying it stands in for the router's link.
- **Storybook's `userEvent` sends synthetic events, which never match `:hover`** — the colour story asserts the resting colours and decoration, and the hover colour was checked live in a browser instead.
- **`IconButton`'s `ghost` variant is the filled one; `tertiary` is the unfilled** (see `Pagination`'s own variant mapping) — the first draft used `ghost` and drew a boxed "…".

## Verification (2026-09-23)

`pnpm lint` (eslint + both typechecks) clean; `pnpm build` clean; unit project 2,708 tests passing (30 of them Breadcrumb's: structure, roles, separators, icons, `labels`, collapsing, focus after expanding, `StrictMode`, jest-axe on plain / collapsed / expanded / slash / named-nav trails); Storybook (real Chromium) project 633 tests passing (Breadcrumb's four hidden interaction stories: collapse and focus, RTL order and chevron mirroring, wrapping in a narrow box, resting colours); component bundle-size and Foundations token-coverage checks pass. Every "Show code" snippet typechecked against the real components in a throwaway file (a planted bad prop was caught). Checked live in a running Storybook: the Docs page and its Properties tables (every default present), sizes, separators, icons, collapsed and expanded trails, RTL, dark mode, and a 375px viewport.

**Not yet done** (deliberately — the user runs the final pass): a full `06` §9 review pass on top of this build, Emerald spot-check (every token used is brand-agnostic; only the focus ring is brand-coloured), and the Finalize declaration.

## Gaps named, not built

- A "back to the parent page" single-link form for phones (a common alternative to collapsing) — `maxItems` covers the need for now.
- Truncating an individual long label with an ellipsis rather than wrapping.
- `BreadcrumbList` structured data (JSON-LD) for search engines — the consumer's concern, but an agent-usage note may belong in the eventual consumer guide.
- A menu of the hidden items (instead of expanding in place) once `Menu` exists.
