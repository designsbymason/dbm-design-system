# Pagination — Storybook/component review findings

**Data Display:** Pagination — built 2026-09-19, item 13 in the itemized molecule-tier build order
(`04-component-inventory.md`). Adds no new dependency and **no new token** — its controls are sized with `IconButton`'s existing
size tokens. **Not Finalized** — the full `06-engineering-standards.md` §9 pass below is complete, but only the user declares a
component Finalized.

A single props-driven component: a `<nav>` holding a list of previous / page-number / next controls (and, optionally, first / last),
with a gap standing in for the pages that don't fit and a compact "Page 3 of 20" form on a phone. Every control is a `Button`.

## Decisions made during the build

The inventory only said "data-bound, cross-listed with Navigation". As with `EmptyState`, none of these were put to the user first —
they are mine, made where the request left the API open, and listed so they can be reversed cheaply.

- **One component, not a compound.** Unlike `Card` and `EmptyState`, there are no sections for a consumer to compose — it is one
  control. `Select`, `Slider`, and `NumberInput` are the precedent.
- **`pageCount`, not `totalItems` + `pageSize`.** Two ways to say the same thing would be mutually exclusive props. The Docs show
  `Math.ceil(totalItems / pageSize)`. `0` renders nothing, so the component can sit above data that hasn't arrived; anything that isn't
  a whole number of at least zero warns and is treated as `0`.
- **`value` / `defaultValue` / `onValueChange`, not `page`.** `05-component-api-conventions.md` §3 names those for any custom controlled
  value, and internal consistency beats a slightly friendlier name. Pages are 1-based, and a value outside `1..pageCount` is clamped.
- **`onValueChange(page, event)` passes the click event as a second argument.** Additive to the convention, and it is what makes link mode
  usable with a client-side router: call `event.preventDefault()` and navigate yourself. Not called for the page already current, and — in
  link mode — not for a modified click (Ctrl/Cmd/Shift/Alt, or the middle button), which is the browser's to handle.
- **The page window is my own derivation** (`paginationRange.ts`), not copied from anywhere: the row always has `2 × boundary + 2 × sibling + 3`
  slots, gaps included, so the controls never shift sideways as you move; it has three shapes (near the start, in the middle, near the end);
  and a gap always stands in for at least two pages (a gap for one page would be no shorter than the page). Tested exhaustively over every page of
  a spread of page counts (those either side of where the row starts needing gaps for each combination, plus 25 and 100) for six
  sibling/boundary combinations — for constant slot count, ordering, no repeats, valid pages, and gap size.
- **Every control is a `Button` slotted (`asChild`) onto a `<button>` or, with `getPageHref`, an `<a href>`** — even in button mode. The reason
  is focus: a natively `disabled` button drops out of the tab order, so pressing Previous to reach page 1 would disable the very button that has
  focus and focus would fall back to the top of the page. Slotted, an unavailable control is `aria-disabled` (`Button`'s existing mechanism) and
  stays focusable, per the WAI-ARIA guidance the repo already follows for `disabled` on `asChild` components. It also makes the two modes one code
  path. An unavailable link keeps an `href` (the current page's) so it is still a link to assistive technology; `Button`'s guard blocks the
  navigation.
- **The current page is `Button`'s `primary`, the others `tertiary`, and there is no `variant` prop.** Nothing asked for outlined or filled
  items; named as a gap, not built.
- **Compact form by CSS, not JavaScript.** Below the `sm` breakpoint the numbers are `display: none` and a "Page 7 of 20" `<li>` shows instead —
  no `matchMedia`, so it is SSR-safe, and the hidden numbers leave the tab order and the accessibility tree along with the screen. `compact` is
  `auto` (default), `always` (a narrow sidebar), or `never`. The breakpoint is the same documented literal (`640px`) as `Card`, `Stack`, `Grid`,
  and `EmptyState`.
- **`labels`, an object of every string the component supplies** (the nav's name, previous/next/first/last, `page(n)`, and the compact
  `summary(page, count)`), English by default. No i18n library, per `06-engineering-standards.md` §7 — text is passed in, not baked in.
- **`align` (`start`/`center`/`end`)** — end-aligned is the usual place under a table; logical, so it mirrors under right-to-left text.
- **The arrows flip under RTL with `:dir(rtl)`** on the icon (as `Switch` does for its thumb), because `Icon`'s `mirrored` prop is unconditional
  and the component has no reason to know the direction itself.
- **Not built into the component, shown as a composition instead:** a range summary ("Showing 6–10 of 47") and a rows-per-page `Select`. They
  belong to a data table's footer; `DataTable` will compose them. The "table footer" story is that composition, built from real `Table`,
  `Select`, `Text`, and `Pagination`.

## Baseline correctness

- `forwardRef` to the `<nav>`; `className`/`style`/`id`/`data-testid` and the relevant `aria-*` accepted and documented; `{...rest}` is spread first,
  the computed `aria-label`/`aria-labelledby` after it. Every prop in `Pagination.types.ts` carries JSDoc; no `any`.
- **Atom-reuse audit:** every control is `Button`; the arrows are `Icon`; the compact summary is `Text`; and the controls are sized with
  `IconButton`'s size tokens (the `IconButton` component itself isn't used: slotted onto a link it doesn't render its icon and warns on every
  render). What is hand-rolled: the `<nav>`/`<ul>`/`<li>` elements, the gap (`…`, a plain character — no atom fits it), and the row's flex layout
  (`Stack` could have laid it out, but its alignment and compact behaviour hang off custom properties and classes the component sets — the same
  call `EmptyState.Actions` and `Card.Footer` made). No defect was found in any consumed atom. `Button`'s slotted-disabled guard is bubble-phase (`05-component-api-conventions.md` §3 notes it can't stop a slotted
  child's own `onClick`); it isn't exposed here because the component's own handler already returns for an unavailable control (an edge page is
  out of range, or `disabled` is set) — covered by tests.
- Zero hardcoded values: the only literal in `Pagination.module.css` is the `640px` in an `@media` condition.
- Dev-mode warnings: an invalid `pageCount` (once per change, not per render) and `value` together with `defaultValue`.
- **Survives `StrictMode`** (the checklist item added after `EmptyState`): tested. There are no timers, so nothing to remember across a remount.

## Accessibility

- A `<nav>` landmark, named "Pagination" unless given `aria-label`/`aria-labelledby`; the Docs tell authors to name each one on a page separately.
  A list inside it; the current page has `aria-current="page"`; a page's accessible name is "Page 3", which contains the number it shows (label
  in name). The gaps are `aria-hidden`.
- Keyboard: Tab through the controls in reading order; Enter activates any control, Space a button (a link takes Enter only, as links do).
  Verified by tests (tab order, Enter, Space) and, for the unavailable arrows, that focus is kept.
- **Contrast, measured from the built token values in all four themes** (AA 4.5:1 for text, 3:1 for graphics): the current page's label on its fill
  6.08–8.51:1 (hovered 9.01–10.74:1); the other pages' labels on the surface 6.08–7.45:1, and hovered 4.63–6.47:1; the gap and summary text
  6.88–10.47:1; the arrows 4.16–8.51:1. Everything clears its floor; the lowest text pairing is Emerald dark's hovered page number at 4.63:1.
  These are `Button`'s existing pairings plus `text.secondary` on the surface — no new pairing was introduced.
- The smallest size (`xs`) is a 30px square, above the 24px target minimum; the Docs recommend `md`+ where touch is the main input.
- jest-axe clean on the default, the last page, first/last, links, disabled links, disabled buttons, a single page, the compact row, and a labelled
  landmark; axe also runs on every story in real Chromium.
- RTL verified live under `dir="rtl"`: Previous moves to the right of Next, the arrows flip (`matrix(-1, 0, 0, 1, …)`), and `align="start"`/`"end"`
  swap sides.

## Responsiveness and theming

- **A real defect, found by the phone-width story:** at 320px the compact row with first/last buttons (four 42px arrows plus "Page 7 of 20" and
  padding) needed 291px, but a normal phone with 16px gutters gives 288px — it wrapped by 3px. Fixed by trimming the summary's side padding to
  `space.1` (283px). The story then hit a second, test-side problem: Storybook's own wrapper pads every story by `space.6`, so it was really
  testing 272px. It now cancels that padding and applies a real 16px gutter, so it asserts what a real 320px phone would see. Verified the guard
  bites: putting the padding back fails it (`expected 2 to be 1`).
- Above `sm` the numbers are back; `compact="never"` wraps rather than overflows if there is ever too little room.
- Themes: verified live in Purple light (sizes, table footer) and Emerald dark (first/last), and the rest by tokens alone — every colour is a
  `Button` or `Text` token.

## Storybook and documentation

Docs page follows the §4 template (ten sections, hidden Intro heading; the TOC lists exactly the template's sections, and every Properties row has a
description — checked in the DOM). Eleven visible stories — Playground, All sizes, Where you are in the pages, Siblings and boundaries, First and last,
As links, Disabled, Alignment, Compact, On a phone, and the table-footer composition. **Eight have `play` functions**: sizes (every control is a
square and each step larger), where-you-are (the row shape at seven positions, always seven slots), links (real anchors, `aria-current`, the click
reported), disabled (all `aria-disabled`, still focusable, a click changes nothing), alignment (flush start, centred, flush end), compact (the
summary shows, the numbers leave the accessibility tree, next still works), on-a-phone (see above), and the table footer (page 2, the last page,
next dimmed). The Playground is genuinely controlled through `useArgs`: choosing a page in the canvas writes it back to the `value` control, the
window, and the snippet — confirmed live (5 → 6, `1 … 5 6 7 … 20`, `useState(6)`).

**"Show code":** every visible story sets `parameters.docs.source.code` to a hand-written snippet from `Pagination.snippets.ts`; the Playground
builds its own from the live controls, naming the controlled state in a comment. Checked three ways: the guard test, a throwaway typecheck of every
snippet and 324 Playground combinations against the real component (clean; a planted bad value was caught), and a settled read of all eleven panels
on the live Docs page. **One finding for the guard test:** it banned `preventDefault` outright as "demo wiring", which also rejected the
client-side-routing snippet (`event.preventDefault(); navigate(…)`, genuine usage). It now bans only the demo pattern
(`onClick={(event) => event.preventDefault()}`), with tests for both directions.

**Two errors of mine, caught before they shipped.** The Docs page first claimed the default seven-slot row "fits a phone-width container"; it is
nine controls (seven slots plus Previous and Next), about 410px at `md` — which is exactly why the compact form exists — and is corrected. And the
table-footer story's page-size `Select` stretched to full width and pushed the pagination onto its own line; it now has a fixed width.

## Functional verification

- 51 tests for the window algorithm and 77 for the component (React Testing Library + jest-axe): structure and order, the current page, clamping,
  the row shapes, controlled and uncontrolled, previous/next and the focus-keeping behaviour, first/last, disabled, keyboard, link mode (including
  modified clicks and blocked navigation), labels, naming the landmark, compact, size and alignment, the RTL flip class, invalid page counts,
  `StrictMode`, and jest-axe scenarios.
- **The guards were checked by breaking the code on purpose:** the summary padding back to `space.2` fails the phone story; removing the compact
  hiding fails it too (`expected <button …> to be null`); removing the modified-click rule fails the link test; and making the arrows natively
  disabled fails the focus tests.
- Full package: `eslint --max-warnings 0` and both `tsc --noEmit` passes clean; `tsup` build; `storybook build`; every size, coverage, and audit
  check (`Pagination`: 3.71KB JS / 1.51KB CSS gzipped, which includes `Button`, `Icon`, and `Text`, within budget; `pnpm audit`: no known
  vulnerabilities).

## Gaps named, not built

Left out deliberately; each can be added without breaking the current API:

- **Announcing a page change.** When the user picks a page, focus stays on the control and the content elsewhere changes; nothing tells a
  screen-reader user which page they are now on beyond the re-marked `aria-current`. A polite live region ("Page 3 of 20") would. This is a
  *persistent* region whose content changes — a different shape from `EmptyState`'s fill-after-mount `announce`, which settles the question of
  whether the two should share a helper: not yet, and probably not.
- **A `variant`** (outlined or filled items) — nothing asked for it.
- **A container-width compact form** (collapsing on the component's own width, not the viewport's), the same limitation `Card`'s `orientation`
  names.
- **A jump-to-page input**, for very long lists.
- **A built-in range summary and page-size select** — deliberately left to the table footer (`DataTable`).
- **A router-link integration** (`asChild` onto a framework's `Link`) — `getPageHref` with `event.preventDefault()` covers it without coupling to
  any router.
