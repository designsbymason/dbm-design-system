# Tabs — Storybook/component review findings

**Navigation:** Tabs — built 2026-09-20, item 14 in the itemized molecule-tier build order (`04-component-inventory.md`). Adds one dependency
(`@radix-ui/react-tabs`, the same approved Radix category as `react-popover`/`react-slider`/`react-accordion`) and no token. **Not Finalized** —
the full `06-engineering-standards.md` §9 pass below is complete and every finding is actioned, but "Finalized" is a status the user declares, not
one a review pass asserts on its own; awaiting that.

A compound component wrapping Radix Tabs end to end: `Tabs` (root) with `Tabs.List`, `Tabs.Trigger` and `Tabs.Content`. Each sub-part's own props get
a `### Tabs.{Part} properties` subsection on the Docs page via a hidden, docs-only stories file per
[ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md).

## Decisions made during the build

The inventory only said "wraps Radix Tabs". As with `EmptyState` and `Pagination`, none of these were put to the user first — they are mine, made
where the request left the API open, and listed so they can be reversed cheaply.

- **`variant`: `underline` (default) | `subtle` | `solid`.** `subtle` and `solid` are `Tag`'s and `Badge`'s own words for a tint and a fill, so the same
  name means the same treatment across the system. `underline` is the tab-specific one: a bar under the selected tab, on a hairline the length of the
  list. A fourth, raised-chip "segmented" treatment was considered and left out (see Gaps).
- **One `icon` prop, not `leadingIcon`/`trailingIcon`.** A trigger has one icon slot, and `05-component-api-conventions.md` §5 keeps the plain name
  for a component with one. Anything else (a count, a status) is composed into the label; the Docs show a `Badge`.
- **Root settings travel by context, not by descendant CSS.** `variant`, `size`, `fullWidth` and the resolved `orientation` are read from a small
  context in each part, so a `Tabs` inside another's panel is styled by its own root. A `.root.solid .trigger` selector would restyle the inner one
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
- **Not exposed from Radix Tabs:** `asChild` on `Root`/`List`/`Content` (nothing here needs a different element there), and `List`'s roving-focus
  internals (`Tabs.List` itself only forwards `loop`). `Tabs.List`'s `loop` and `Tabs.Root`'s `activationMode`/`dir` are exposed.

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
  known low point `Pagination` recorded); the lowest graphic is Emerald light's `icon.brand` on the hovered tint at 3.67:1. **One failure found and
  designed around:** `border.focus` on `bg.brand` is 1.31–1.64:1, so a standard ring on the selected `solid` tab would all but vanish — that one ring
  uses `icon.on-brand` (6.08–8.51:1).
- **The focus ring is drawn inside the trigger** (a negative `outline-offset`), unlike every other component. The list scrolls sideways, and a scrolling
  box clips whatever is drawn outside its edge, so an outside ring loses its top and bottom. `radius-sm` is kept. Browser-tested: the ring is 2px, its
  offset is negative, and its colour is `border.focus` (or the on-brand icon token on the selected solid tab). Recorded as a convention in
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

## Gaps named, not built

Left out deliberately; each can be added without breaking the current API:

- **`tone`** (a colour accent other than brand). Tabs are rarely tone-coded; each tone would need its own contrast pairings measured.
- **A raised-chip "segmented" variant.** In dark mode the selected chip would have to be *lighter* than its track to read as raised, and the existing
  surface tokens run the other way (`bg.surface` is darker than `bg.neutral-subtle` there). Needs a token decision first.
- **Selecting the first enabled tab when nothing is selected** (see Decisions).
- **Closable, reorderable or addable tabs** (dynamic tabs, as in an editor). A separate, larger interaction model.
- **An overflow menu ("More") or scroll buttons/edge fades** for a strip that doesn't fit. The strip scrolls and reveals the selected tab; a menu is a
  bigger design choice.
- **`rounded` and `align`** on the list, as `Button`/`Pagination` have. `align` needs care: centring a scrolling flex row cuts off its start.
- **A sliding indicator** (see Decisions).

## Not verified

No real screen reader (VoiceOver, NVDA, JAWS) was run against it; roles, names and states are checked through the accessibility tree and axe. The
scrolling strip was checked with overlay scrollbars only; a platform with permanent scrollbars now shows none, by design.
