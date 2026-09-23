# Tabs — Storybook/component review findings

**Navigation:** Tabs — built 2026-09-20, item 14 in the itemized molecule-tier build order (`04-component-inventory.md`). Adds one dependency
(`@radix-ui/react-tabs`, the same approved Radix category as `react-popover`/`react-slider`/`react-accordion`) and no token. **Finalized
2026-09-22** — the full `06-engineering-standards.md` §9 pass, five follow-ups, and a final pre-Finalize review are all complete; see "Final
review before Finalizing" below for what that last pass checked and fixed.

A compound component wrapping Radix Tabs end to end: `Tabs` (root) with `Tabs.List`, `Tabs.Trigger` and `Tabs.Content`. Each sub-part's own props get
a `### Tabs.{Part} properties` subsection on the Docs page via a hidden, docs-only stories file per
[ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md).

## Decisions made during the build

The inventory only said "wraps Radix Tabs". As with `EmptyState` and `Pagination`, none of these were put to the user first — they are mine, made
where the request left the API open, and listed so they can be reversed cheaply.

- **`variant`: `underline` (default) | `subtle` | `outlined` | `solid`.** `subtle` and `solid` are `Tag`'s and `Badge`'s own words for a tint and a fill, and `outlined`
  is the system-wide spelling of a bordered variant (`05-component-api-conventions.md` §2), so the names are shared across the system, though not every treatment is
  identical — a `Tag`'s `outlined` has no tint. `outlined` was added afterwards, at explicit direction — see the follow-ups below. `underline` is the tab-specific one:
  a bar under the selected tab, on a hairline the length of the list. A raised-chip "segmented" treatment was considered and left out (see Gaps).
- **One `icon` prop, not `leadingIcon`/`trailingIcon`.** A trigger has one icon slot, and `05-component-api-conventions.md` §5 keeps the plain name
  for a component with one. Anything else (a count, a status) is composed into the label; the Docs show a `Badge`.
- **Root settings travel by context, not by descendant CSS.** `variant`, `size`, `fullWidth`, `rounded` and the resolved `orientation` are read from a small
  context in each part, so a `Tabs` inside another's panel is styled by its own root. `align` is the one exception — it belongs to `Tabs.List` alone (see the
  align/overflow follow-up below), so it never needed to travel through this context in the first place. A `.root.solid .trigger` selector would restyle the inner one
  too. Tested (a solid outer set with a subtle inner one).
- **`orientation` accepts a breakpoint map**, resolved with the shared `useResolvedResponsiveValue` (the `Popover` `side` precedent). A vertical list
  beside its panel is the usual wide-screen layout and a horizontal strip the usual phone one; "responsive is not optional" makes that a component
  concern. It is JavaScript, not CSS, because the arrow-key pair Radix uses has to change with it. Cost, documented: a server render uses `base` until
  hydration.
- **Sizes match `Button`.** A trigger's `min-block-size` is `IconButton`'s size token for the step (which is `Button`'s real height there), so a tab
  list sits flush beside either. Icon size follows `Button`'s own mapping. The panel's spacing tracks the same step.
- **One weight, `medium`, in every state.** A heavier selected weight would widen the tab as it is selected and shift its neighbours; the selected
  state is carried by colour and the indicator instead.
- **The underline bar grows out from the middle** of the selected tab (`transform: scaleX`, on a pseudo-element). A bar that *slides* between tabs
  needs measuring in JavaScript, breaks on a first render, and needs its own right-to-left handling; this needs none, follows a scrolling tab for free,
  and is symmetric in both directions.
- **`asChild` on `Tabs.Trigger` keeps the trigger's styling** (unlike `Accordion.Trigger`, where `asChild` means a fully custom row). A tab rendered as
  a link should still look like a tab. `icon` has no effect then, and warns.
- **No first tab is selected on the consumer's behalf.** With neither `value` nor `defaultValue`, nothing is selected and no panel shows — and there is
  a development warning. Selecting the first enabled tab would be friendlier, but it needs every trigger to register with the root and a re-render
  before paint (and server output that differs from the first client render); the failure it prevents is loud and one line to fix. Listed under Gaps.
- **A horizontal list scrolls sideways, with no scrollbar, and keeps the selected tab in view.** See "Real defects found" — the scrollbar was tried first.
- **Two different reasons nothing else from Radix Tabs is exposed.** `List`'s `RovingFocusGroup` internals (`currentTabStopId`, `onEntryFocus`,
  …) aren't a choice — Radix's own `TabsList` doesn't forward them to any consumer at all, so there's nothing here to expose. `asChild` on
  `Root`/`List`/`Content` is a real, available Radix option, left off deliberately: `asChild`/Radix `Slot` (`05-component-api-conventions.md` §3,
  ADR-0007) fits a component whose rendered content genuinely *is* its children — a single interactive element the wrapper's behaviour attaches
  to (`Button`'s label, `Link`'s text) — and none of these three wrap a single child (`Root` holds a `List` plus one-or-more `Content` panels,
  `List` holds multiple `Trigger`s, `Content` often holds more than one element). If a real need for a different wrapper element ever comes up
  (e.g. `Root` as `<section>` instead of `<div>`), the fitting mechanism is the polymorphic `as` prop — the one `Stack`/`Container`/`Box` already
  use for exactly that — not `asChild`, which wouldn't cleanly apply regardless. `Tabs.List`'s `loop` and `Tabs.Root`'s `activationMode`/`dir` are
  exposed.

## Radix-primitive prop audit (the whole inheritance chain)

Read from the installed `@radix-ui/react-tabs@1.1.21` types and source, not from its docs, including `RovingFocusGroup`'s props that `List` inherits:

| Part | Radix props | Here |
|---|---|---|
| `Root` | `value`, `defaultValue`, `onValueChange`, `orientation`, `dir`, `activationMode`, `asChild` + div props | all exposed except `asChild` |
| `List` | `loop` + div props; `RovingFocusGroup`'s `currentTabStopId`, `onEntryFocus`, … are **not** passed on by `TabsList` | `loop` exposed |
| `Trigger` | `value`, `disabled`, `asChild` + button props | all exposed |
| `Content` | `value`, `forceMount` (`true`), `asChild` + div props | `value`, `forceMount` exposed |

Three things the source showed that the types don't:

1. **`forceMount` does not hide the inactive panel.** Radix passes `present={forceMount || isSelected}`, so a force-mounted inactive panel renders with its
   content, visible. The consumer is expected to hide it. `Tabs.module.css` does (`.content[data-state="inactive"] { display: none }`) — otherwise
   `forceMount` would show every kept panel at once. Browser-tested (hidden, not in the accessibility tree, and the typed value survives a round trip).
2. **A trigger selects on `mousedown`, not `click`,** and on focus when `activationMode` is automatic. Tests use real presses, and a click on a disabled
   or ctrl-clicked tab is `preventDefault`ed by Radix.
3. **Radix sets `data-orientation` (root) and `aria-orientation` (list) *before* spreading what it is given,** so a consumer's own would replace them.
   Both are set again here after the spread, from the resolved orientation. Regression-tested on the root, list and trigger (recurring bug class,
   `05-component-api-conventions.md` §3).

## Baseline correctness

- `forwardRef` on all four parts; `className`/`style`/`id`/`data-testid` and the relevant `aria-*` accepted and documented; every prop in
  `Tabs.types.ts` carries JSDoc; no `any`, no `@ts-*` or lint suppression.
- **Atom-reuse audit:** the icon is `Icon`; the count in the Docs and stories is `Badge`; the keep-mounted demo is `Input`. The tab control itself is
  Radix's `Trigger` styled here, not a `Button` slotted onto it: none of `Button`'s variants has a selected state or an indicator to reuse, so
  wrapping it would mean overriding most of its styling. No defect was found in any consumed atom.
- Zero hardcoded values: every value in `Tabs.module.css` is a token; the only `calc()` uses tokens (`-1 * border-width`). A class-usage cross-check
  found every class used in `Tabs.tsx` defined and every class defined used.
- Dev-mode warnings, each once and each tested: no `value`/`defaultValue`; both given; an icon-only tab with no accessible name; `icon` with `asChild`.
- **Survives `StrictMode`:** tested (mount, select, onValueChange fires once). The one effect (the observer that keeps the selected tab in view) disconnects
  in its cleanup, tested.
- SSR/RSC: no `window`/`document` at module scope or in render; the effect and `matchMedia` reads are guarded.

## Accessibility

- `tablist` / `tab` (`aria-selected`) / `tabpanel` (`aria-labelledby` its trigger; the trigger's `aria-controls` its panel) from Radix; the list's
  `aria-orientation` follows `orientation`; the panel is `tabindex="0"`. An unselected panel is not in the page (or, with `forceMount`, is `display: none`).
- Keyboard, verified by unit tests and a hidden real-browser story: `Tab` enters the list on the selected tab and next reaches the panel; arrows move
  and (automatically) select, wrapping unless `loop={false}`, skipping a disabled tab; `Home`/`End`; vertical uses `Up`/`Down` and ignores `Left`/`Right`;
  manual mode moves focus only and `Enter`/`Space` select; right-to-left swaps the arrows (real Chromium, `dir="rtl"`).
- jest-axe clean on: default, each variant, vertical + manual + full width + a disabled tab, icons + an icon-only labelled tab + a count, tabs as
  links, a kept-mounted panel, and right-to-left; axe also runs on every story in real Chromium.
- **Contrast, measured from the built token values in all four themes** (AA 4.5:1 for text, 3:1 for graphics; a script resolves each `--dbm-*` from the
  built CSS and computes the WCAG ratio): an unselected label on the surface 6.88–10.47:1; hovered, on `bg.neutral-subtle`, `text.primary` 9.66–13.53:1;
  a selected label 6.08–7.45:1 on the surface (underline), 5.83–8.29:1 on `bg.brand-subtle` (subtle; hovered 4.63–6.47:1), and `text.on-brand` on `bg.brand`
  6.08–8.51:1 (solid; hovered 9.01–10.74:1); selected + hovered underline label on `bg.neutral-subtle` 4.63–7.07:1; the underline bar (`bg.brand`) on the
  surface 6.08–8.51:1; icons 3.67–9.47:1 across their states; `border.focus` on the surface 4.16–6.49:1, on `bg.brand-subtle` 3.99–7.22:1, on
  `bg.neutral-subtle` 3.56–4.63:1. Everything clears its floor. The lowest text pairing is Emerald dark's selected + hovered label at 4.63:1 (the same
  known low point `Pagination` recorded); the lowest graphic is Emerald light's `icon.brand` on the hovered tint at 3.67:1. **Superseded by the follow-up below:** the ring on the selected `solid` tab was first drawn in `icon.on-brand` (6.08–8.51:1, because `border.focus` is
  1.31–1.64:1 on `bg.brand`); it is now `bg.brand-hover`, at explicit direction, and that is 1.24–1.48:1.
- **The focus ring is drawn inside the trigger** (a negative `outline-offset`), unlike every other component. The list scrolls sideways, and a scrolling
  box clips whatever is drawn outside its edge, so an outside ring loses its top and bottom. `radius-sm` is kept. Browser-tested: the ring is 2px, its
  offset is negative, and its colour is the one the follow-up below lists for each variant. Recorded as a convention in
  `05-component-api-conventions.md` §6.
- Touch target: the smallest size (`xs`) is a 30px-high trigger, above the 24px minimum; the Docs recommend `md`+ where touch is the main input.

## Responsiveness and theming

- **Horizontal strip that scrolls.** Wider than its container, the list scrolls inside itself (`overflow-x: auto`), the page never scrolls sideways
  (measured: page scroll width equals its client width at 375px), and the selected tab is brought fully into view — on first render without animating
  (a tab selected off-screen shouldn't be seen sliding into place), and smoothly afterwards, instantly for `prefers-reduced-motion`. Measured from
  bounding rectangles and applied with `scrollBy`, so it is right in right-to-left (where `scrollLeft` counts the other way) and never scrolls the page,
  which `scrollIntoView` would. Implemented with a `MutationObserver` on `data-state` (so it follows keyboard, click and controlled changes alike).
- Breakpoint-map orientation checked live at 375px: `{ base: "horizontal", md: "vertical" }` resolves to a horizontal strip, `aria-orientation`
  and the flex direction agreeing. A story pinned to a phone width (`OnAPhone`) asserts it, after first asserting the viewport really is narrow.
- Themes: verified live in Purple light, Purple dark, Emerald light and Emerald dark (all three variants each) — the dark-mode `solid` fill is the
  light-fill-dark-text pattern of [ADR-0005](../adr/0005-dark-mode-light-fill-dark-text-pattern.md). Every colour is a semantic token.

## Storybook and documentation

Docs page follows the §4 template in full (ten sections, hidden Intro heading, TOC exactly the template's; every Properties row across the four tables
has a description — checked in the DOM). Sixteen visible stories: Playground, All variants, All sizes, Vertical, Vertical on a wide screen / horizontal
on a phone, With icons, With a count, One tab disabled, Full width, Manual activation, Controlled, Too many tabs for the width, Keeping a panel mounted,
Tabs as links, Right-to-left, On a phone. The Playground is keyed by `defaultValue` so choosing another starting tab in the controls takes effect (an
uncontrolled Radix root would otherwise ignore it). Checked live: `variant=solid size=xl orientation=vertical dir=rtl defaultValue=settings` in Emerald
dark drives the canvas (61px trigger, vertical, `dir="rtl"`, the right tab selected, light fill).

Two visible stories (`Too many tabs for the width` and `On a phone`) have `play` functions that only *measure*, so the demo never changes. Every
state-changing or real-layout assertion lives in a hidden `!dev` twin: keyboard, manual activation, right-to-left order and arrows, scroll-into-view
after a selection, keep-mounted, and the focus ring.

**"Show code":** every visible story sets `parameters.docs.source.code` to a hand-written snippet from `Tabs.snippets.ts`; the Playground builds its own
from the live controls. Checked three ways: the guard test (`storySnippets.test.ts`, extended with the Tabs builder), a throwaway typecheck of every
snippet and 18 Playground combinations against the real components (clean; a planted `variant="pill"` was rejected, so it bites), and a settled read
of all 16 panels on the live Docs page (no scaffolding, no `() => {}`, no generated placeholders).

## Real defects found while building (each has a test that fails without the fix)

1. **A dead CSS-module class.** `Tabs.tsx` referenced `styles.listFullWidth`, a class never defined — CSS Modules return `undefined` silently, so it applied
   nothing and nothing complained. Found by a unit test that asserted the class; the reference is removed (the triggers carry `fullWidth`), and a
   used-vs-defined cross-check of every class in the component now comes back clean both ways.
2. **A scrollbar painted over the selected tab's underline.** Found by looking at a phone-width screenshot, not by any test: with overlay scrollbars the
   thin scrollbar thumb sat over the bottom edge of the tab strip, hiding the brand bar under the last tab. The scrollbar is now hidden
   (`scrollbar-width: none` plus the WebKit fallback) because the list already says what it would — a cut-off tab means more, the selected tab is always
   revealed, and the keyboard and touch still scroll it. `OnAPhone` asserts it (`scrollbarWidth` is `none`); reverting the fix fails that story.
3. **Radix's own orientation attributes could be overridden** by a stray consumer prop (see the audit above).
4. **A test spread a value cast to `never`,** which does not typecheck — caught by `tsc` only after the file existed. Fixed with a loose record type.

Not a defect, worth knowing: two interaction tests failed at first because they read a panel while it was still fading in (`opacity: 0` at the start of
the animation is correctly "not visible"); they now wait for it. The fade is intended.

## Functional verification

*Figures in this section are from the first build (2026-09-20); the current ones, after the 2026-09-21 follow-up, are in that section below.*

- 69 unit tests (React Testing Library + jest-axe) for `Tabs`, plus 20 in `storySnippets.test.ts` for its snippets: structure and roles, id/aria wiring,
  selection (click, controlled, parent-owned state, no selection), keyboard (enter once, arrows, wrap, `Home`/`End`, no-loop, vertical, manual,
  right-to-left), disabled, variants/sizes/full width/orientation classes and attributes, nested tabs, responsive orientation (base, a matching
  breakpoint, following a change), triggers (icon, icon-only, `asChild`, a badge in the label), `forceMount`, refs and the standard props, attribute
  order, the four warnings, `StrictMode`, keeping the selected tab in view (six cases including reduced motion, a vertical list, no `scrollBy`, and
  unmount), and axe scenarios.
- 25 real-Chromium tests (16 visible stories + 6 hidden twins + the three hidden sub-part files), each also under axe.
- **Guards checked by breaking the code on purpose,** each failing the intended test: dropping the rule that hides a force-mounted inactive panel; drawing
  the focus ring outside the trigger; using the standard ring colour on the selected solid tab; never scrolling the selected tab into view; not setting
  `aria-orientation` after the spread; ignoring a responsive orientation; putting the scrollbar back.
- Full package: `eslint --max-warnings 0` and both `tsc --noEmit` passes clean; the whole unit project (68 files, 2,635 tests) and the whole
  Storybook browser project (92 files, 604 tests) pass; `tsup` build; `storybook build` and its bundle-size check; the per-component size check
  (`Tabs`: 2.25KB JS / 1.30KB CSS gzipped, within budget); the Foundations token-coverage check; `pnpm audit`: no known vulnerabilities. The visual-regression
  suite was not run — no `Tabs` story is in it.

## Follow-up (2026-09-21, at explicit direction) — hover fills, ring colours, `outlined`, `rounded`

`Tabs` is not Finalized, so all of it was changed freely. What was asked, and what was found:

- **Unselected-tab hover fill: `bg.neutral-subtle` → `bg.brand-subtle`** in the `underline`, `subtle` and `solid` variants. Every text and icon pairing on it clears
  its floor (measured in all four themes: `text.primary` 13.46–15.05:1, `text.brand` 5.83–8.29:1, `icon.default` 4.48–9.14:1, `icon.brand` 3.99–9.47:1). Two
  consequences worth knowing: the fill is barely visible against the page on its own (1.04–1.11:1, the same as the token everywhere else), so the hover is
  carried mostly by the label changing from `text.secondary` to `text.primary`; and in the `subtle` variant a hovered unselected tab now has the *same* fill
  as the selected one, so the two are told apart by label colour alone (`text.primary` against `text.brand`).
- **Solid variant, selected tab's focus ring: `icon.on-brand` → `bg.brand-hover`. This fails the 3:1 floor, and is a deliberate, user-directed exception.**
  `bg.brand-hover` against the tab's own `bg.brand` fill is **1.24–1.48:1** (Purple light 1.46, Purple dark 1.39, Emerald light 1.48, Emerald dark 1.24), and it
  is the *same colour* as the fill while the tab is hovered, so the ring is invisible then. Seen live: a `rgb(62, 49, 128)` ring on a `rgb(85, 72, 164)` fill
  reads as a faint darker edge. Because automatic activation selects the tab as focus arrives, the focused tab is usually the selected one, so a keyboard
  reader on `solid` can see the selection change but not where focus is. The Docs page says so. Not changed: it was asked for by name.
- **New variant `outlined`:** `subtle` with a border on every tab — `border.brand` on the selected tab, `border.brand-subtle` on the others (one border width
  in every state, so nothing moves on selection; box-sizing is `border-box`, so heights are unchanged). Hover: `bg.brand-subtle` on an unselected tab,
  `bg.brand-subtle-hover` on the selected one. **Ring: `bg.brand-hover` on both.** It is drawn *inside* the border with a gap of one border width (offset
  `-(2 + 2 × border)`), because laid on the border it would be almost the same colour (1.24–1.48:1); read against the tab's fill and the page it is 8.64–11.74:1,
  which passes. The unselected tabs' borders are a faint decorative tint (`border.brand-subtle`, 1.08–1.24:1 against the page) — nearly invisible in dark mode —
  so the selected border and the labels carry the state.
- **New prop `rounded`** (default `false`, on the root, like `Button`'s, `IconButton`'s and `Pagination`'s): fully rounds the ends of every tab in `subtle`, `outlined`
  and `solid`, and has **no effect on `underline`** — `Tabs.tsx` does not apply the class there. The ring goes fully round too (`radius-full`), per
  `05-component-api-conventions.md` §6.
- **Naming:** built as `outlined` (as asked); renamed to `outlined` the same day on request, to match `Tag`; and back to `outlined` once that spelling was made the rule for every component (see the last follow-up below).

**Tests (each checked by breaking the code on purpose, and failing the intended test):** a hidden story reads the compiled hover rule for each variant (a story's
pointer events are synthetic and never set `:hover`, so the fill can't be read from a hovered element — it was confirmed with a real mouse live instead); a
hidden `outlined` story checks the borders, that heights match, and the ring's colour, width and offset on a selected *and* an unselected tab under real keyboard
focus; the focus-ring twin now expects `bg.brand-hover` on `outlined` and `solid`; a visible `Rounded` story measures every tab's radius against half its height
(and `underline` at 0), with a hidden twin checking the ring is round too; unit tests for the class on each variant, none by default, none on `underline`,
and nested sets. Reverted, in turn: the underline hover fill, the solid ring colour, the outlined ring offset, the outlined border colour, `rounded` reaching
`underline`, and the round ring — six failures, one per guard. Full package after the change: lint and both `tsc` passes clean; unit 68 files / 2,646 tests
(`Tabs`: 78); Storybook browser 92 files / 608 tests; build, `storybook build` and its size check, the per-component size check (`Tabs`: 2.30KB JS / 1.37KB CSS
gzipped), the Foundations coverage check and `pnpm audit` all clean. Live, in a real browser: a real-mouse hover on an unselected `solid` tab reads
`rgb(249, 249, 255)` (`bg.brand-subtle`, not the old `rgb(250, 250, 251)`); the `outlined` ring shows as a clear double line; `rounded` gives pills on three variants
and leaves `underline` alone; Emerald dark checked.

**Docs page:** `outlined` and a `Rounded` gallery entry added; `rounded` in the Playground and Properties (14 rows on the root table); the token list and the
Accessibility section rewritten to the numbers above, including the `solid` ring's contrast stated plainly.

## Follow-up (2026-09-21, later) — variant renames, and the panel's focus ring

- **`outlined` → `outlined` → `outlined`.** Renamed to `outlined` on request so it matched `Tag`. Then the spelling was settled for the whole system as **`outlined`**, and `Tag` and
  `Indicators` were renamed to it instead (see the next follow-up and `05-component-api-conventions.md` §2), so `Tabs` went back. Net effect on `Tabs`: none — the variant is
  `outlined`, as first built. Both renames were mechanical (type, CSS class, stories, snippets, tests, Docs page, this record) and left every other component's own `outlined` alone.
- **A real defect: the panel's focus ring was cut off by the tab list** (reported with a screenshot, subtle variant, keyboard focus on the panel). Reproduced first, then
  measured: the space between the list and the panel was *padding inside the panel* (20px at `md`), so the list-to-panel gap was **0px**. The panel takes focus and draws the
  standard ring outside its box (4px offset + 2px line = 6px), so the ring started 6px *inside* the tab list — and the tabs, being positioned elements, painted over the top
  edge of it. It also made the ring a tall box with the text pinned to its bottom. **Fix:** that spacing is now `margin-block-start` (`margin-inline-start` when vertical) instead
  of padding, at the same size steps, so the ring sits in the gap: measured live, gap 20px against a 6px ring at `md`; at the smallest step it is 12px against 6px. The cost, worth
  knowing: the ring now hugs the panel's content (4px), since the panel has no inner padding of its own — the same as every other focusable box here.
- **Guard:** a hidden `!dev` story focuses the panel with the keyboard and asserts the list-to-panel gap is at least as wide as the ring, at `xs` and `xl` horizontally and `xs`
  vertically. It failed on the old code with `expected 0 to be >= 6` before the fix, and passes after. Recorded as a convention in `05-component-api-conventions.md` §6.
- Verification after both changes: lint and both `tsc` passes clean; unit 68 files / 2,646 tests; Storybook browser 92 files / 609 tests; build, `storybook build` and its size
  check, the per-component size check (`Tabs`: 2.30KB JS / 1.38KB CSS gzipped), the Foundations coverage check and `pnpm audit` all clean.

## Follow-up (2026-09-21, later still) — `outlined` is the rule, and `Tag`/`Indicators` were renamed to it

A survey of every component's variant values found `outline` on `Tag`, `Indicators` and (briefly) `Tabs`, and `outlined` on `Card`, `EmptyState` and `Pagination`. `outlined` was chosen as the
one spelling; the rule is in `05-component-api-conventions.md` §2. `Tabs` needed no work beyond the rename back — its two pseudo-class selectors (`.outlined:focus-visible`,
`.outlined:not(:disabled):hover`) were the only ones a first pass missed (the pattern that protected CSS `outline:` properties also skipped a class followed by `:`); the browser tests caught both.

## Follow-up (2026-09-22, at explicit direction) — `align`, and overflow fades/buttons

Three of the four ideas named in the review's own "Gaps named, not built" section were asked for; the fourth (auto-selecting the first tab) was
recommended against and left as it was — see the standalone review this follow-up records, not repeated here. `Tabs` is still not Finalized, so
all of it was built freely.

- **New `Tabs.List` prop `align`: `"start"` (default) | `"center"` | `"end"`.** Sets `justify-content` on the list; visible only while the list has
  room to spare. It lives on `Tabs.List`, not the root — unlike `variant`/`size`/`rounded`, it says nothing about how a tab looks, only where the row
  sits, the same reasoning `loop` (also list-only) already follows.
- **The "centring cuts off the start" risk, resolved with CSS, not a restriction.** `justify-content: safe center` / `safe flex-end` on the horizontal
  list: browsers that support the `safe` keyword fall back to start-alignment the moment the row can't fully fit, so the first tab is never pushed
  out of the scrollable range — confirmed live (`scrollLeft` reads `0` at rest on a centred, overflowing row, with the first tab already fully
  visible, no scrolling needed) and by a hidden real-browser story. An unsupporting browser doesn't apply a broken partial value either: an invalid
  `justify-content` declaration is dropped whole, leaving the plain (pre-`safe`) `.alignCenter`/`.alignEnd` rule in effect underneath — centred
  without the safety net, not broken.
- **Overflow: a fade and a button at whichever edge has more**, closing two of the three ideas named under "Better overflow handling" (the third,
  a "More" menu, is still a gap — see below). Both are built fresh, hand-rolled rather than reusing an atom:
  - **The fade** is a `linear-gradient` on the list wrapper's own `::before`/`::after`, opaque `bg.surface` at the edge fading to transparent, shown
    only while that edge has more tabs (`data-overflow-start`/`data-overflow-end` on the wrapper, driving CSS opacity — no extra DOM node). The
    gradient's own direction is physical, so it needs the same `:dir(rtl)` flip `Pagination`'s own arrows use.
  - **The button** scrolls a page (the list's own `clientWidth`) at a time, smoothly unless the reader prefers less motion. Hand-rolled rather than
    `IconButton`, which has no way to flip its icon for direction — `Pagination`'s own reason for the same choice. The icon is the same `CaretLeft`/
    `CaretRightIcon` pair `Pagination` uses, with the identical local `:dir(rtl)` flip class (`Icon`'s own `mirrored` is unconditional, not
    direction-aware, so it can't do this alone).
  - **Detecting overflow**: a new hook, `useTabsOverflow.ts`, modelled directly on `Table`'s own `useScrollableRegion` (`guidelines/adr/0019`'s
    named standing pattern) but answering a different question — not just "does this scroll" but "which edge" — so it compares each end tab's own
    bounding rectangle against the list's, the same direction-agnostic technique `revealTab` already uses, rather than reading `scrollLeft` (whose
    sign convention in a right-to-left list differs across browsers). `useSyncExternalStore`, correct on the first frame; re-checks on `scroll`
    (position changes, no `ResizeObserver` would ever fire from these), the list's own `ResizeObserver` (size changes), and a `MutationObserver`
    watching for tabs added or removed (a `ResizeObserver` on the list alone would miss this — the list's own box doesn't change, only its
    `scrollWidth`).
  - **A button that just ran out of anything to scroll to stays, inert, while it still has keyboard focus** — the same rule `Pagination`'s own
    arrows follow (`06-engineering-standards.md` §9's "a responsive or measured collapse never removes the control that has keyboard focus"),
    applied here to a control that disappears from the reader's own scrolling rather than from a responsive resize. `aria-disabled`, never native
    `disabled`: confirmed live, breaking it on purpose, that a *natively* disabled button really is dropped from the page (and focus with it) the
    instant it becomes disabled, in a real browser — this is not a theoretical risk. Released on blur, mirroring `Pagination`'s own `keyboardFocus`
    test helper (jsdom's own `:focus-visible` is order-dependent, so it is stubbed explicitly rather than trusted, the same reasoning).

**Real findings while building it, none in the shipped component:**

- **Three of my own hidden tests assumed the wrong thing, each caught by actually running them, not by reasoning about the code.** A `userEvent.click()`
  in this real-Chromium test environment apparently does satisfy `:focus-visible` on the clicked element (unlike an ordinary mouse click in a real
  browser, which normally doesn't) — a test that clicked a scroll button repeatedly expecting it to eventually vanish instead found it correctly held,
  inert, because the click itself had focused it. Fixed by testing what each story is actually *for* — click-to-scroll functionality, not the
  hold/release behaviour, which already has its own dedicated story — rather than asserting an unmount that depended on this environment's own click
  semantics. Separately, an `align="center"` overflow test assumed a "start" button would need clicking to reach the first tab — wrong: "safe"
  centring already starts the row at `scrollLeft: 0`, so there is nothing to scroll to reach it, which is a stronger proof of the fix than the
  assumption it replaced. And a focus-release test used `Tab` to move focus away, which lands **inside** the (still scrollable) tablist itself,
  where the browser's own native scroll-into-view for a newly focused element could re-move `scrollLeft` and reintroduce overflow, confounding the
  assertion — fixed by releasing focus onto the panel instead, outside the scrollable region entirely.
- **The class-selector guard that keeps `outline:` (the CSS property) untouched while renaming the variant also skipped two real class selectors**
  the FIRST time the very same protective pattern was used for the `outline`→`outlined` rename (see that follow-up) — not a finding from this pass,
  restated here only because this pass is what finally exercised both of the renamed selectors' own hover/focus rules and would have caught it again
  had it recurred; it did not.

**Tests:** 15 new unit tests (`align` defaults and each value, including a vertical list; overflow button presence in all four start/end
combinations, a vertical list showing none regardless; scroll direction and amount in each direction; a button that is inert never scrolling; the
hold-while-focused and release-on-blur behaviour; a mouse-produced (non-keyboard) focus never holding; the hook's own cleanup on unmount) and 3 new
hidden real-browser stories (button presence/click/right-to-left mirroring including the fade's own gradient direction; the focus-hold-and-release
sequence; `align`'s own centred/end-aligned layout and the safe-centring proof), plus the existing "Too many tabs" story now also confirms a
button appears and the opposite one doesn't. Every new CSS/behavioural guard was checked by breaking it on purpose: the `align` class mapping
swapped, the `safe` keyword removed, the RTL gradient override removed, the RTL icon flip removed, `aria-disabled` swapped for native `disabled`
(caught only by the real-browser suite, not the unit one — confirming the finding above), the rounding-slack constant zeroed, and overflow
detection disabled outright — each failed the test built to catch it. Full package after: lint and both `tsc` passes clean; unit 68 files / 2,663
tests (`Tabs`: 94); Storybook browser 92 files / 613 tests; `pnpm test:storybook` and `pnpm test` both green.

**Docs:** `align` added to `Tabs.List`'s own Properties table and a new "Align" gallery entry; the "Too many tabs for the width" entry's own text
now mentions the fade and button; the Accessibility section states the scroll buttons' own tab order and hold-while-focused behaviour and the
native-vs-`aria`-`disabled` finding; new token rows (`bg.surface`, `bg.neutral-subtle`, `space.10`, `z-index.dropdown`, `z-index.sticky`) and an
extended `icon.default` row (now also the scroll buttons' own icon colour). No new dependency, no new component-level token — every value traces to
an existing primitive or semantic token.

**A real gap, found the same day it landed: `align` was documented (its own Properties row) but not live — the Docs page's Playground had no
control for it, since it is genuinely `Tabs.List`'s own prop, not the root's, and the Playground is typed and driven off the root `Tabs`' own args.**
Fixed by adding it as a Playground-story-scoped arg rather than a root one: `align`'s `argTypes`/`args` entry sits on the `Playground` story object
itself (`Tabs.stories.tsx`), not on `meta`, so it drives the one demo that already renders a real `Tabs.List` underneath without also appearing a
second time in the root Properties table (whose `<PropertiesTable of={TabsStories}>` reads `meta`-level argTypes only) — the sub-part's real
documentation stays solely under "Tabs.List properties" (ADR-0013), never duplicated. `DemoTabs` (the shared gallery-story component) now accepts
and forwards `align` to its own `<Tabs.List>`; every other story that uses `DemoTabs` leaves it `undefined`, which `Tabs.List`'s own `align = "start"`
default already covers, so nothing else changed. Positioned in `rootPropOrder` (shared by the root Properties table and the Playground panel) right
after `fullWidth` — the other prop governing how the tabs occupy the list's own width — and before `dir`; default `"start"`, matching the real
component default. `tabsPlaygroundSnippet` (the "Show code" builder) now also writes `align` onto the `<Tabs.List>` tag, not the root `<Tabs>` tag,
only when it differs from `"start"`.

Note, not a defect: Storybook's *native* per-story Controls tab (as opposed to the Docs page's own custom `PlaygroundControls` block) still lists
`align` last regardless of `rootPropOrder` — confirmed live. That panel's row order isn't governed by our `order` prop at all; per the standing
finding in `07-storybook-and-documentation-standards.md` §4.1, it comes from react-docgen's extraction of a real component's own `*Props` interface
position, which a Playground-story-only synthetic arg was never going to have. The Docs page's own Playground panel — the one `06-engineering-standards.md`
§9 and `07` §5's ordering checklist items are actually about — is correctly ordered; verified live.

**Asked and left as-is (2026-09-22):** a fix exists — move `align` into `meta.argTypes` itself (positioned correctly, with `table: { disable: true }`
to keep it out of the root Properties table) and add `align: { control: false }` to `noControls` so the other fixed-render gallery stories don't
pick up a live-but-inert control for it — but it touches several more places across the file for a cosmetic mismatch confined to a panel this
project's own checklist doesn't govern. Declined; not revisited unless a future pass decides otherwise.

Verified live: the control shows a `select` with `start`/`center`/`end`, defaults to `start`; choosing `center` visibly re-centers the tab row and
the Canvas and "Show code" both update (checked after the ~3s settle, per `07-storybook-and-documentation-standards.md` §4.2); "Reset to defaults"
returns it to `start`. `storySnippets.test.ts` extended with two more Tabs Playground cases (`align` alone, `align` combined with another prop) and
one more explicit assertion (`align` written onto `Tabs.List`, omitted at its default, never onto the root). Full package: lint and both `tsc`
passes clean; unit 68 files / 2,666 tests (up from 2,663 — three new `storySnippets.test.ts` cases).

**Recorded as standing conventions, not just this component's own choices:** `05-component-api-conventions.md` §2 (variant names come from one
shared vocabulary — the rule the earlier `outline`→`outlined` follow-up established, unaffected by this pass) needed no change here; the "control
that has keyboard focus" checklist item in `06-engineering-standards.md` §9 now cites `Tabs` as a second confirmed instance, generalised slightly to
cover a control removed by the reader's own scrolling, not only by a responsive resize.

## Final review before Finalizing (2026-09-22)

A last full pass before the user's own Finalized declaration — the automated suite re-run fresh rather than trusted from earlier logged
numbers, plus a live, cross-theme, consolidated look now that all five follow-ups above (hover fills/`outlined`/`rounded`, the panel ring fix,
the two naming sweeps, `align`/overflow) have landed together, since each was verified individually but never all at once in one final check.

**Full self-verification, re-run clean:** `eslint` and both `tsc --noEmit` passes; unit 68 files / 2,666 tests; the real-Chromium Storybook
project 92 files / 613 tests; `tsup` build; `pnpm build-storybook` plus its bundle-size check (13.4MB / 20MB budget); the per-component bundle-size
check (`Tabs`: 3.05KB JS / 1.65KB CSS gzipped, within budget); the Foundations token-coverage check; `pnpm audit` (no known vulnerabilities).

**Live, consolidated across all four variants in Purple/Light and Emerald/Dark** (`All variants`, `Rounded`): no regression from any of the five
follow-ups landing together — the `solid` variant's light-fill-dark-text pattern, the `outlined` borders, and the rounded pill treatment all read
correctly in both checked themes.

**Composed tab order through the scroll buttons, verified live for the first time as one sequence** (the individual pieces were tested before —
the hold-while-focused behaviour, the button's own presence — but not the full linear order together): focusing the selected tab and pressing
Shift+Tab lands on the start scroll button when it's shown; from the selected tab, Tab reaches the panel directly. Confirmed via real keyboard
events and `document.activeElement` in the live iframe, not inferred from the DOM order alone.

**A real defect found and fixed: every Properties table's Default column was empty, system-wide across all four of Tabs' tables, even for props
with an unambiguous, documented `@default`** (`variant`, `size`, `rounded`, `orientation`, `activationMode`, `fullWidth` on the root; `loop`,
`align` on `Tabs.List`; `asChild` on `Tabs.Trigger` — 9 rows total). Root-caused, not just patched: Storybook's docgen only auto-populates a
prop's Default column when a table's `component:` meta field resolves to something it can trace back to the real function source. Two distinct
failure modes, both confirmed live:
- **The root table has no `component:` at all** — `Tabs.stories.tsx`'s meta is typed against a synthetic `PlaygroundArgs` interface (it also
  carries the `align` passthrough, §*align* follow-up above), never a real component reference, so nothing was ever auto-extracted for any root
  prop.
- **Every sub-part table's `component: Tabs.List` / `Tabs.Trigger` / `Tabs.Content`** — a property access on the compound `Tabs` export, not a
  directly-exported identifier — never resolves far enough for docgen to find the real default, even though the same mechanism *does* extract
  correct prop names, types, and descriptions (those come from the separately-exported `*Props` TypeScript interface, a different code path).

**This is not a Tabs-only gap.** Checked directly: `Select.Option`'s table (the original ADR-0013 precedent) has the identical empty-Default
symptom. **Corrected 2026-09-22, the same day, once the sitewide pass actually ran:** this entry originally inferred the same failure across
`Accordion`, `Card`, `EmptyState`, `Popover`, and `Table` from the `component:`-field pattern alone (no `component:` on the compound root, a
property-accessed `component: Parent.Sub` on every sub-part) — checked live at the time only for `Accordion` and `Select.Option`, both confirmed
affected. Checking the rest individually, live, found the inference didn't hold: `Card`, `EmptyState`, and `Table` were already fully correct —
each author had already hand-annotated every `table.defaultValue.summary`, something the `component:`-field grep alone couldn't see. Only
`Accordion` and `Popover` (plus `Select.Option`) were genuinely affected. The lesson, not just the correction: a shared root cause across several
components doesn't mean every component sharing that code shape is actually broken by it — verify each one live rather than extending a confirmed
finding by pattern-match. Fixed the same day; see `07-storybook-and-documentation-standards.md` §4.1 for the consolidated write-up (one entry,
not repeated per component, matching how the Icon default-weight change was logged).

**Fixed for `Tabs`'s own four tables** (unrestricted — not yet Finalized): explicit `table: { defaultValue: { summary: "..." } }` added to each
of the 9 affected argTypes, matching the exact string already in each prop's own JSDoc `@default` tag — the same established remediation pattern
this project already uses when docgen drops a description (`07-storybook-and-documentation-standards.md` §5), applied to a default-value dropout
instead. `Tabs.Content` needed no change — none of its props carry a `@default` tag, so its all-empty Default column was already correct.
Verified live, all 4 tables, before and after. Full package re-verified clean after the fix (see the numbers above, already current).

**Outcome:** `Tabs`'s own checklist is clean — nothing else found in this pass. **Declared Finalized by the user, 2026-09-22.**

## Gaps named, not built

Left out deliberately; each can be added without breaking the current API:

- **`tone`** (a colour accent other than brand). Tabs are rarely tone-coded; each tone would need its own contrast pairings measured.
- **A raised-chip "segmented" variant.** In dark mode the selected chip would have to be *lighter* than its track to read as raised, and the existing
  surface tokens run the other way (`bg.surface` is darker than `bg.neutral-subtle` there). Needs a token decision first.
- **Auto-selecting the first tab** when nothing is selected, instead of the current no-selection-plus-warning (see Decisions). Recommended against
  when asked (2026-09-22) — it would be the first component in this system to guess an initial selection rather than require one, and needs every
  trigger to register with the root and a re-render before paint, with a server render that would then differ from the first client render.
- **Closable, reorderable or addable tabs** (dynamic tabs, as in an editor). A separate, larger interaction model — scoped out as its own organism, `EditorTabs`; see the section below rather than this one-line note.
- **An overflow menu ("More")** listing every tab that doesn't fit, for a strip long enough that scrolling through it a page at a time is itself
  tedious. Scroll buttons and edge fades are built (2026-09-22, see the follow-up above); a menu needs a real menu component, and `Menu` isn't built
  yet (organism tier) — reach for it once `Menu` exists, rather than hand-rolling a second one here.
- **A sliding underline** that animates *between* tabs, rather than growing out from the middle of the newly-selected one (see Decisions). Needs
  measuring the previous and next tab's position in JavaScript, has no correct answer on the very first render, and needs its own right-to-left handling
  — the current `scaleX` approach avoids all three for free.

## EditorTabs — scoped out as a separate organism (2026-09-22)

The "closable, reorderable, addable tabs" gap above was discussed in full and turned into a real inventory entry rather than left as a bare
bullet. Recorded here since the reasoning — not just the outcome — is what a future session would otherwise have to re-derive.

**Not a `Tabs` retrofit.** `Tabs` is declarative: the consumer hand-writes `Tabs.List`/`Tabs.Trigger`/`Tabs.Content` children. Closable,
reorderable and addable tabs need an array-driven API instead (a `tabs` array plus `onClose`/`onReorder`/`onAdd` callbacks), since the consumer
has to mutate an ordered list — reimplementing that in userland on top of static JSX children would defeat the point. Mirrors the `Table` →
`DataTable` relationship already in this system: a plain compositional molecule, and a separate, richer organism for the harder job. Scoped as a
new organism, `EditorTabs`, that wraps `Tabs` internally for the keyboard/ARIA mechanics rather than reimplementing them.

**Naming considered:** `EditorTabs` (chosen, at explicit direction — matches the gap's own "as in an editor" framing, reads concretely, mirrors
how this system already prefers role-based names over generic ones) versus `DynamicTabs` (more neutral, doesn't tie the name to one scenario).

**Where it would be useful**, named specifically rather than left abstract: multi-record workspaces (a CRM/support-desk/admin tool pinning an
open record per tab — the same enterprise-tooling niche `DataTable`/`Sidebar` already serve), editor-style apps (multiple open files),
user-created views (a saved query or filter per tab in a BI/dashboard tool), comparison workflows (several items open side by side, closed once
done), and browser-style app shells. The common thread: the tab *set itself* is part of the user's own working state, not an author-defined,
fixed navigation structure — the line that separates it from the base `Tabs`.

**Open technical question, not resolved yet: hand-rolled reorder vs. a new dependency.** Nothing in this codebase has solved "drag one item among
flex/grid siblings and reflow the row" — `Slider`'s pointer-drag moves one thumb along a track (a value mapping), and `Tabs`' own
`revealTab`/`useTabsOverflow` do direction-agnostic rect math but never move a sibling — so this is genuinely unproven territory, not a repeat of
an established pattern. Decided: don't commit to an approach on paper — build a small, throwaway spike isolating just the reorder/drag mechanism
before choosing, matching this project's own "verified, not assumed" practice. A spike would need to clear:
- Live reflow of neighbouring tabs during drag (extending the rect-comparison technique `revealTab` already uses; a smooth reflow needs the FLIP
  technique).
- The touch-gesture conflict between drag-to-reorder and the tab list's own existing drag-to-scroll — needs a real device/touch-emulated check,
  not reasoning.
- Auto-scroll while dragging past the edge of an already-scrolling strip.
- RTL correctness, with the same care already taken for `revealTab`/overflow detection.
- A currently-correct accessible live-reordering pattern (`aria-grabbed`/`aria-dropeffect` are deprecated; current WAI-ARIA APG guidance needs
  checking directly, not assumed from memory).

If the spike clears those, hand-roll — no new dependency, keeping the "no/limited dependencies" principle intact. If it visibly struggles on one,
that is the trigger to evaluate a real DnD dependency instead, a genuine exception needing the same justification weight as the original
Radix/Motion decisions, not something added quietly. Whichever way this resolves, it is a real fork-in-the-road decision once `EditorTabs` is
actually built, and gets its own ADR then — this note is the pre-build reasoning, not the decision itself.

**Keyboard reordering has no equivalent open question.** A modifier+arrow-key convention moving the focused tab is just an array splice and a
focus move, with a direct analogue in WAI-ARIA APG's reorderable-list guidance — the primary *accessible* path regardless of what the drag spike
finds, not a fallback bolted on afterward once drag ships.

**Other decisions still open, to ask rather than assume once this is scheduled:** whether closing a tab auto-selects an adjacent one (likely yes,
matching common editor/browser convention, but a real decision, not to be assumed the way auto-selecting the first tab on the base `Tabs` was
rejected above) or leaves selection to the consumer; whether a newly added tab takes focus/selection automatically; whether drag-to-reorder ships
in a first pass at all or keyboard-only ships first with drag following later.

**Outcome:** added to `04-component-inventory.md`'s Navigation category as `EditorTabs`, organism-tier, ⚪ (real, not blocking v1) — see that
doc's own 2026-09-22 update note. Not yet sequenced within the organism tier itself: organisms haven't started (Phase 6,
`01-vision-and-goals.md` §13) and have no itemized build order yet the way molecules do, so the ⚪ tier alone is what currently expresses "lowest
priority, build last."

## Not verified

No real screen reader (VoiceOver, NVDA, JAWS) was run against it; roles, names and states are checked through the accessibility tree and axe. The
scrolling strip was checked with overlay scrollbars only; a platform with permanent scrollbars now shows none, by design.
