# 0099 — `Navbar` sizes its links apart from its height with `linkSize`, on `Menu`'s five steps and defaulting to the height step, over one `size` or padding-driven rows

**Status:** Accepted · **Date:** 2026-10-18

## Context
`Navbar`'s `size` set the row's height (as tall as an `IconButton` of the step plus room), the default size of the row's controls, and, only at `lg`, a larger link font. A shop header wants a roomy logo row with small links, and the reverse; the demo had to override the link font with a `style`. Making the row's height padding-driven was weighed too: a row would then be as tall as its tallest child plus padding.

## Decision
- **`linkSize?: "xs" | "sm" | "md" | "lg" | "xl"`** on `Navbar`, `Navbar.Row` and `Navbar.Links` (the nearest wins), after `size` in the prop order. It sets a link's text size, icon size and padding: text `font-size.xs`/`sm`/`base`/`md`/`lg` as `Menu`'s sizes do; padding a link bar's (`space.1`/`2`, `2`/`3`, `2`/`3`, `3`/`4`, `3`/`4`); icon `xs`/`sm`/`sm`/`md`/`lg`. No new tokens.
- **Left out, it follows `size` step for step:** `xs` → `xs`, `sm` → `sm`, `md` → `md`, `lg` → `lg`, so a taller bar has larger links. A `quiet` set reads one step below its size, set or followed (never below `xs`). *(Amended 2026-10-18, before this record was pushed: the first draft mapped `md` to `sm` and `lg` to `md` and read a quiet set as `xs`, to leave every existing bar unchanged, which left `sm` and `md` bars with identical links; the component is unreleased, so the mapping follows the step.)*
- **`size` stays the row's height, a floor** (`min-block-size`): a taller child still grows the row, and the height does not depend on what the row holds, so bars of different content are as tall as their step says. It also stays the default for the row's controls (menu and search buttons), so there are two props and not three.
- **A `Navbar.Group`'s dropdown takes the set's size for its items** when one was set (`Menu.Content`'s `size`), and `Menu`'s own default otherwise. A link's icon follows the step in the bar; in a group's list and in the menu panel it keeps its own. **The menu panel's links keep their own sizing** (touch rows): the step is set on the bar's `<nav>`, which the panel's copy is not inside.
- Removed: the one-off `.sizeLg .links` and `.quiet.links` font rules, now the default mapping.

## Alternatives considered
- **A padding-driven row height.** Rejected: a row of links only would be shorter than a row with a logo and buttons, so a bar's height would depend on its content. The floor keeps `size` meaning one height.
- **A third size for the controls (`controlSize`).** Rejected: controls already take `size` and each part's own `size`; a third prop on one bar is more than the cases need.
- **`size` meaning the padding only, with `linkSize` the umbrella.** Rejected: `<Navbar size="lg">` would stop being the one prop that makes a bar bigger.
- **Copying `Menu`'s padding exactly.** Rejected: its rows are list rows; a link bar wants a little more inline room.

## Consequences
- A bar's default links are larger than they were at `md` (text 16px, not 14px) and `lg`, and a `quiet` set in an `md` or `lg` bar is larger than the old fixed `xs`. A real-browser check asserts the default `md` bar reads the `md` step exactly.
- The bar's height does not move with `linkSize` until a link is taller than the row's floor; the Docs say so.
- Navbar's stylesheet grows by about 0.6KB.

## Related
`05-component-api-conventions.md` §2, ADR-0091, ADR-0092, ADR-0095, ADR-0096; `component-reviews/Navbar.md`.
