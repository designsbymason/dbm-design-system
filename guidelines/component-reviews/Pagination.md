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
- **The current page is `Button`'s `primary`, always.** How the *other* controls look is the `variant` prop — see the follow-up below (the
  first build had no `variant`).
- **Compact form by CSS, not JavaScript (for `auto`).** Below the `sm` breakpoint the numbers are `display: none` and a "Page 7 of 20" `<li>` shows
  instead — no `matchMedia`, so it is SSR-safe, and the hidden numbers leave the tab order and the accessibility tree along with the screen. `compact`
  is `auto` (default), `container` (see the follow-up), `always` (a narrow sidebar), or `never`. The breakpoint is the same documented literal (`640px`) as `Card`, `Stack`, `Grid`,
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
description — checked in the DOM). Fifteen visible stories — Playground, All sizes, All variants, Where you are in the pages, Siblings and boundaries, First and last,
Jump to a page, As links, Announcing a page change, Disabled, Alignment, Compact, Collapses to fit its container, On a phone, and the table-footer
composition. **Six of them have `play` functions that only measure** (so the demo never changes) and six more interaction tests live in **hidden twins** (see
the next paragraph). The measuring plays and the twins together are twelve; the last two twins assert against real layout: sizes (every control is a
square and each step larger), where-you-are (the row shape at seven positions, always seven slots), links (real anchors, `aria-current`, the click
reported), disabled (all `aria-disabled`, still focusable, a click changes nothing), alignment (flush start, centred, flush end), compact (the
summary shows, the numbers leave the accessibility tree, next still works), on-a-phone (see above), and the table footer (page 2, the last page,
next dimmed). The Playground is genuinely controlled through `useArgs`: choosing a page in the canvas writes it back to the `value` control, the
window, and the snippet — confirmed live (5 → 6, `1 … 5 6 7 … 20`, `useState(6)`).

**Interaction tests are in hidden twins, not in the visible stories (2026-09-20, after the user reported the selected page "changing a couple of times
before settling" in several stories).** It was Storybook running the stories' `play` functions — a script that clicked and typed on load, so "Jump to a page"
went 42 → 250 → 500 → 1 in about 110ms and ended on a page it hadn't started on — not the component: sampled every 10ms from the first frame with no `play`
attached (a throwaway story, since deleted), the component showed exactly one state, including in `compact="container"`. The six stories whose play changed
what they showed (Jump, As links, Announcing, Compact, Collapses to fit its container, the table footer) are now play-free, and each has a twin —
`XInteraction`, `...X` with `tags: ["!dev"]` — that carries the same assertions verbatim: hidden from the sidebar and Docs, still run as a test (the story
project is now 21 stories for this component, from 15). Re-sampled after the change, all six visible stories show one state, the one they start in. The
container-collapse boxes now have `resize: horizontal`, so a person can drag one and watch the row switch instead of being shown a script doing it.
The rule is recorded in `07-storybook-and-documentation-standards.md` §5. (Verifying a live resize in the development pane wasn't possible — the pane reports
`visibilityState: "hidden"`, where even an unrelated `ResizeObserver` never fires — so the resize behaviour rests on the headless-Chromium test, which
resizes the boxes both ways and waits for the collapse to follow.)

**"Show code":** every visible story sets `parameters.docs.source.code` to a hand-written snippet from `Pagination.snippets.ts`; the Playground
builds its own from the live controls, naming the controlled state in a comment. Checked three ways: the guard test, a throwaway typecheck of every
snippet and Playground combination against the real component (324 in the first build, 192 more with the follow-up's props; clean, and a planted
bad value was caught), and a settled read of every panel on the live Docs page (fifteen after the follow-up). **One finding for the guard test:** it banned `preventDefault` outright as "demo wiring", which also rejected the
client-side-routing snippet (`event.preventDefault(); navigate(…)`, genuine usage). It now bans only the demo pattern
(`onClick={(event) => event.preventDefault()}`), with tests for both directions.

**Two errors of mine, caught before they shipped.** The Docs page first claimed the default seven-slot row "fits a phone-width container"; it is
nine controls (seven slots plus Previous and Next), about 410px at `md` — which is exactly why the compact form exists — and is corrected. And the
table-footer story's page-size `Select` stretched to full width and pushed the pagination onto its own line; it now has a fixed width.

## Functional verification

- 51 tests for the window algorithm and 125 for the component (React Testing Library + jest-axe), plus 6 for `useAnnouncement`: structure and order, the current page, clamping,
  the row shapes, controlled and uncontrolled, previous/next and the focus-keeping behaviour, first/last, disabled, keyboard, link mode (including
  modified clicks and blocked navigation), labels, naming the landmark, compact, size and alignment, the RTL flip class, invalid page counts,
  `StrictMode`, and jest-axe scenarios.
- **The guards were checked by breaking the code on purpose:** the summary padding back to `space.2` fails the phone story; removing the compact
  hiding fails it too (`expected <button …> to be null`); removing the modified-click rule fails the link test; and making the arrows natively
  disabled fails the focus tests.
- Full package: `eslint --max-warnings 0` and both `tsc --noEmit` passes clean; `tsup` build; `storybook build`; every size, coverage, and audit
  check (`Pagination`: 5.25KB JS / 2.12KB CSS gzipped, which includes `Button`, `Icon`, `Text`, `Input`, `FieldLabel`, and `VisuallyHidden`, within budget; `pnpm audit`: no known
  vulnerabilities).

## Follow-up (2026-09-20, at explicit direction) — the four named gaps built

The user asked for the four ideas this file had named as not built: announcing a page change, a variant for the items, collapsing by the
component's own width, and a jump-to-page input. `Pagination` is still not Finalized, so all four were built freely. Decisions:

- **Announcing a page change — `announce`, on by default.** A visually hidden `role="status"` region (the existing `VisuallyHidden` atom) that is
  in the page from the start and only has its text changed — "Page 6 of 20", the `summary` label, so it translates — a moment after the page
  changes, then cleared about a second later. **On by default**, unlike `EmptyState`'s `announce`: there, announcing is right only when the
  empty state appears because of a user action, so it is opt-in; here the page changing *is* always the user's action, forgetting it is an
  accessibility bug, and a duplicate announcement (if the consumer's own region also speaks) is a milder failure than silence. `announce={false}`
  opts out, and the Docs say when to. This is the *persistent-region* shape the earlier review predicted was different from `EmptyState`'s
  fill-after-mount shape — and it is: the region needs no delay before it exists, only a change. What the two share is the timing (put text in
  after a short delay, take it out again, cancel on unmount), and that is now a real second consumer, so it is extracted:
  **`useAnnouncement` in `packages/primitives`** (`06-engineering-standards.md` §1's "2+ places"), tested from the components package (primitives
  has no runner of its own), including under `StrictMode`. **`EmptyState` was moved onto it afterwards** (2026-09-20, at the user's go-ahead, since `EmptyState` is Finalized)
  — an internal refactor that changed no behaviour, recorded in `EmptyState.md`.
- **`variant` — `ghost` (default), `outlined`, `filled`.** Names follow `Card`'s (no surface / bordered / tinted), mapped onto `Button`'s variants
  (`tertiary` / `secondary` / `ghost` respectively — `Button`'s own `ghost` is a tint, which is why the names differ). The current page is
  `primary` in all three, so the position is always the strongest signal. Contrast, measured for the pairings the new variants introduce, in all
  four themes: `filled` text on its tint 5.83–8.29:1 (hovered 4.63–6.47:1), the icons on it 3.99–9.47:1, the `outlined` border against the page
  6.08–8.51:1. Everything clears its floor; the new low points are the icon on the `filled` tint in Emerald light (3.99:1, above the 3:1 for
  graphics) and Emerald dark's hovered text (4.63:1, unchanged from before).
- **`compact="container"` — collapse by the width the component is given.** Measured in JavaScript, and the reasons CSS container queries
  weren't used are worth keeping: (1) a query container must be size-contained, which strips the element's intrinsic width — so a pagination in a
  flex row would collapse to nothing; (2) a `@container` condition can't use a custom property, so the thresholds would be literals that depend on
  the size step, on `showFirstLast`, and on `siblingCount`/`boundaryCount` (ten-plus values, wrong for every non-default count); (3) JS reads the
  actual row. So: the row is measured while its numbers show (`list.scrollWidth`, with the row set not to wrap in this mode), remembered, and
  compared with the component's own width (`ResizeObserver`, so it follows resizing). Until the first measurement — and on the server — it behaves
  like `auto`, so there's no jump; the measurement runs in a layout effect, before paint. The state maps onto the existing `compactAuto` /
  `compactAlways` classes, so there is no new collapse CSS. In this mode the component fills the space it is given (`flex: 1 1 0`, so in a flex
  row it takes what the others leave), because a component whose width depends on its own content can't tell whether it "fits"; the Docs say so.
  `auto` (the screen's width) is unchanged and remains the default.
- **`showJump` — a "Go to page" field.** A real `<form>`: a visible label tied to a number `Input` with `<label for>`, and a "Go" button —
  needed because a numeric touch keyboard often has no Enter key. A number outside the range goes to the **nearest page** rather than showing an
  error (an empty field, or the page already showing, does nothing), and the field is emptied afterwards; `noValidate`, or the browser would refuse
  to submit a value outside `min`/`max` before the clamp ever ran (a unit test proves it — removing it fails). It stays available in the compact
  form, where it is the way to reach a page the summary hides. In link mode the form isn't a link, so it follows `getPageHref(page)` itself — by
  clicking a real anchor, so anything watching link clicks sees it — unless `onValueChange` cancelled the default. To pass the form's submit event
  as well as a click, `onValueChange`'s event parameter is widened from `MouseEvent` to `SyntheticEvent`. The field's width per size is `space.16`–
  `space.24`; the label, field, and button are `FieldLabel`, `Input`, and `Button`. Natively disabled (not `aria-disabled`) while `disabled` is
  set, because it is a form control; the Docs say so.
- **The four `onValueChange` sources are now click and submit**, and the tests cover each.

**Findings while building the follow-up:**

- **A real limit, found by the phone story:** with a three-digit page count, the compact row *with* first and last ("Page 7 of 200" between four
  buttons) needs about 305px, more than the 288px a 320px phone leaves once the page has its gutters, so it wraps. It degrades gracefully (the row
  wraps rather than overflowing) and is documented; the phone story now checks the two realistic configurations separately — first/last with a
  two-digit count, and the jump field with a three-digit one — instead of silently depending on a short count.
- **Two of my own tests were too weak, caught only by mutating the code.** Both "says nothing on mount" and "goes to the nearest page" passed with
  their guard removed: the first advanced the clock 2000ms in one step, past when a message would have appeared *and* cleared; the second checked the
  displayed page, which is clamped anyway, and not the page *reported*. Both now check what would actually differ (at 500ms; the value passed to
  `onValueChange`).
- **The container story's `play` left its boxes swapped**, so the labels above them became untrue if a play function runs on the Docs page. It now
  puts them back.
- **`StrictMode`** was tested for both `announce` and the hook (checklist item from `EmptyState`).
- **Verified the new guards bite by breaking the code on purpose:** announcing on mount, no clamp, no `noValidate`, a container that never collapses,
  an `outlined` variant with no border, a form that submits natively, a jump that follows a cancelled link, an announce that never fills, and a
  non-wrapping nav (the jump field off the screen on a phone) — each fails the intended test (or story).
- **The snippet guard** needed nothing new this time; its `preventDefault` refinement from the first build already covers the routing example. All
  snippets and 192 Playground combinations were typechecked against the real component (a planted bad value was caught).

## Follow-up (2026-09-20, at explicit direction) — `rounded`

The user asked for a `rounded` prop so the numbered page buttons and the icon controls can be round. Pagination isn't Finalized, so it was built freely.

- **`rounded` (default `false`)** — every page number and arrow a circle, and a pill for a page number too wide to be a square (`1234`). Named as `IconButton`'s
  `rounded` is. **Now `Button`'s own `rounded` prop, passed through (2026-09-20, at explicit direction — see the note at the end of this section).**
  It was first built before `Button` had the prop, with `Pagination`'s own CSS (`.rounded .item`, two classes, `radius.full`).
- **The focus ring is round too**, following the repo's rule (`05-component-api-conventions.md` §6) that a fully round element gets a `radius.full`
  ring instead of the standard small one. That rule now lives in `Button` (`.rounded:focus-visible`), where it *is* guarded: removing it fails both `Button`'s
  own hidden twin and `Pagination`'s `RoundedInteraction`. (While `Pagination` carried its own copy it was the one rule here no test could reach, because
  the load order made it redundant; moving it to `Button` removed that gap rather than papering over it.)
- **The jump field and its "Go" button are deliberately *not* rounded.** The first build rounded them too, so a round row wouldn't end in a
  square-cornered field; the user asked for that to be reverted, so `rounded` affects only the page numbers and the arrows and the field and
  button keep their own corners. The story asserts it (both stay well short of half their height).
- **Nothing else changes:** the current page is still `primary`, variants, `compact`, the arrows' RTL flip, and all colour pairings are as before, so
  no contrast was re-measured (only corner radii differ).
- **Tests:** unit tests that every page number and arrow (including an `aria-disabled` one, and links in the compact form) carries `Button`'s `rounded` class and
  the `radius.full` token, that the Go button doesn't, and that the default is `radius.md`; and a visible "Rounded" story that *measures* (so the demo never changes) that every page number's and arrow's
  corner is at least half its height, the jump field and its button are *not* round, a narrow number is a circle and `1234` a pill, and the default
  row stays a rounded square. The keyboard focus ring is checked in a hidden twin (`RoundedInteraction`), since focusing would leave a ring on the demo.
  Breaking the CSS on purpose: un-rounding the controls, rounding the jump field, and rounding the Go button each fail the story; the focus-ring rule is
  the one that doesn't (above).
- **Docs:** a `rounded` Playground control and Properties row, a "Rounded" gallery entry (with a jump-field row showing it keeps its corners), usage guidance (softer for a consumer app; square-cornered
  where it should match a dense data screen's table and form controls), a code example, the `radius.full` token row, and a snippet (all typechecked
  against the real component).

## Gaps named, not built

Left out deliberately; each can be added without breaking the current API:

- **A jump field that validates visibly** (an inline "1–500" message). Clamping was chosen because it is forgiving and needs no extra layout;
  visible validation would be a different, more explicit contract.
- **`variant` values beyond the three** (a neutral outlined item, a pill). Each maps to a `Button` variant today; anything else needs a `Button`
  change first.
- **A built-in range summary and page-size select** — deliberately left to the table footer (`DataTable`).
- **A router-link integration** (`asChild` onto a framework's `Link`) — `getPageHref` with `event.preventDefault()` covers it without coupling to
  any router.

**Moved onto `Button`'s `rounded` (2026-09-20, at explicit direction).** `Button` gained its own optional `rounded` prop (see `Button.md`), so `Pagination` passes it to each page number and arrow instead of styling them itself: `rounded={rounded}` on the `Button` in `control()`, and the `.rounded` root class and its two rules removed from `Pagination.module.css`. The Go button is a `Button` too but is deliberately not given it. What a reader sees is unchanged (the Rounded story's measurements are the same and still pass); what changes is that there is one implementation of the shape and its focus ring, in the atom, rather than two. Mutation-checked: not passing the prop fails the unit tests and both stories; also rounding the Go button fails the unit test and the Rounded story; removing `Button`'s focus-ring rule fails `RoundedInteraction`. Docs, snippets and the public prop are unchanged.
