# ScrollArea

Molecule, Layout category. Item 24 of the itemized molecule build order in
`04-component-inventory.md` — a custom-styled scrollable region wrapping Radix ScrollArea
(`@radix-ui/react-scroll-area`, new dependency). Built 2026-09-29.

## What it is

A single (non-compound) component: `children` renders inside Radix's own `Viewport`, with one or
two token-driven overlay scrollbar(s) — `scrollbars` (`vertical` default / `horizontal` / `both`)
picks which axis (or axes) are actually offered; the other is clipped, not scrollable. `size` (the
standard 5-step scale) sets scrollbar thickness, mapped directly onto the existing spacing tokens
(`space.1`–`space.5`, 4–20px) — no new component-layer token needed. `variant` (`bordered` default /
`ghost`) follows `Table`'s own exact vocabulary and default. `scrollbarVisibility` (`auto` / `always`
/ `scroll` / `hover` default) and `scrollHideDelay` map straight onto Radix's own `type`/
`scrollHideDelay`. `maxHeight` is a convenience shortcut (`Table`'s own precedent) for the region's
block-axis size — without it, or an equivalent `style`/`className` rule, the region simply grows to
fit its content and never scrolls. `dir` defaults to `'ltr'` and isn't read from the page, matching
`Slider`/`Tabs`/`Accordion`/`RadioGroup`'s established convention; Radix positions the vertical
scrollbar and corner on the correct side automatically, so nothing else needed its own mirroring.

`ref` forwards to the outer frame (`Root`); `viewportRef` is a second, explicitly-named prop reaching
the real scrolling element (`Viewport`) for imperative scrolling/measurement. `onScroll` is
redeclared and routed to `Viewport` specifically, since a plain native `onScroll` on `Root` would
never fire — `Root` itself never scrolls. See [ADR-0028](adr/0028-scrollarea-puts-native-props-on-the-outer-frame-and-routes-only-scroll-relevant-props-to-the-viewport.md)
for the full reasoning behind this split, which is the reverse of [ADR-0019](adr/0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md)'s
`Table` (there, native props go to the *inner* `<table>`; here, to the *outer* frame) — the two
aren't in tension, since each follows the same underlying rule (props go where the consumer already
means "the component"), just applied to a different DOM shape.

The keyboard-reachable-region pattern is `Table`'s own (`useScrollableRegion`), generalized to a
specific axis via a colocated `useIsScrollable` hook (`ScrollArea/useIsScrollable.ts`) rather than
touching `Table`, an already-Finalized component, to extract a shared version without asking first —
flagged below as a DRY opportunity, not acted on. `Viewport` gets `tabIndex={0}`, and — only
alongside a real name from `aria-label`/`aria-labelledby` — `role="region"`, both only while the
requested axis (or axes) actually overflow. No enlarged invisible pointer-target on the scrollbar
thumb (unlike `Slider`'s own thumb) — considered and deliberately not applied; see the CSS module's
own comment for the reasoning (a scrollbar thumb is a secondary affordance next to content with no
buffer around it, unlike an isolated slider thumb).

## Two real defects found only by live-browser measurement

Both invisible to `tsc`/`eslint`/`vitest` (jsdom has no real layout) — caught only once genuinely
measuring `getBoundingClientRect()`/`scrollHeight`/`clientHeight` in a real browser, per the standing
rule in `06-engineering-standards.md` §9.

1. **`maxHeight` didn't actually bound scrolling.** The first implementation gave `Root` a plain
   block box (`max-block-size` from `maxHeight`) and `Viewport { height: 100% }`. CSS percentage-height
   resolution requires the ancestor to have a real, definite `height` — `max-height` alone leaves
   `height` at `auto`, so `Viewport`'s `100%` silently fell back to its own content height instead of
   `Root`'s clamped box: confirmed live, `Viewport.clientHeight` measured 300px (the content's own
   height) against a `Root` whose own rendered height was genuinely 192px. Nothing ever overflowed,
   so no scrollbar ever had a reason to appear.
2. **The fix's own first attempt (`display: flex; flex-direction: column` on `Root`, `Viewport { flex: 1 }`)
   collapsed the region to near-zero instead.** `flex: 1` is shorthand for `flex-basis: 0%` — with no
   explicit `height` on `Root` (only `max-height`), the flex algorithm has nothing to grow *from*,
   so the container's own auto height resolved to almost nothing (confirmed live: `Root`'s rendered
   height measured 23.5px with content that should have needed 192px). Fixed by `flex: 1 1 auto`
   instead: `flex-basis: auto` restores content-based sizing as the starting point (a short list
   stays exactly as tall as its content), and `flex-shrink` still clamps it back down once `Root`'s
   own `max-height` actually engages — which is what makes it scroll. `min-height: 0`/`min-width: 0`
   on `Viewport` were needed either way, overriding flexbox's own default `min-size: auto`, which
   would otherwise stop `flex-shrink` from clamping below the content's natural size.

Both re-verified live afterward: a short-content case shrinks to fit with no wasted space (`Root`
measured 23.5px for one line), a tall-content case clamps to `maxHeight` and genuinely overflows
(`scrollHeight` 300 vs `clientHeight` 190), and a `scrollbars="both"` case with genuinely wide-and-tall
content (the original demo was only one line tall, not a real two-axis case — fixed in
`ScrollArea.stories.tsx`'s own `DemoWideTall`) clamps and overflows on both axes at once, with both
scrollbars and the corner tile rendering correctly on hover.

## A third finding: this environment can't verify native keyboard-triggered scrolling

The first interaction-test draft asserted that a simulated `PageDown` on a focused, genuinely-overflowing
region actually moved `scrollTop`. It failed — but so does the identical assertion against a plain,
unrelated `tabindex="0"; overflow: scroll` `<div>` built from scratch in the same live browser session,
confirming this is a limitation of synthetic key events in this automated environment, not a component
defect: the browser's own native default-action scrolling for a focused element apparently isn't
triggered by this harness's synthetic `keydown`/`keyup` pair, real user input aside. This matches
`Table`'s own test suite, which never asserts this either (checked before concluding). The interaction
test (`KeyboardScrollInteraction`) was rewritten to assert what's actually provable here — `tabIndex`,
focus, genuine overflow (`scrollHeight > clientHeight`), and that setting `scrollTop` directly moves the
content (proving `Viewport` really is the scrolling element) — while documenting why the
keyboard-specific claim was dropped, in the story's own comment.

## DRY opportunity flagged, not acted on

`useIsScrollable` (this component's folder) and `Table`'s own `useScrollableRegion` are near-identical
implementations of the same `useSyncExternalStore`-based overflow-detection technique, now used in two
places — the normal trigger for promoting a hook into `packages/primitives` per `06-engineering-standards.md`
§1. Not done here: `Table` is already Finalized, and touching it (even in a zero-behavior-change way)
needs the user's go-ahead first per the standing Finalized-components rule. Worth a small follow-up
session if authorized: extract a shared, axis-parameterized version, have both components call it, and
re-verify `Table` stays Finalized under the three-question test (a pure internal refactor with zero
visible/API surface change — the same shape as `Divider`'s own `useResolvedResponsiveValue` extraction).

## Definition of done — checklist

- [x] Full TypeScript types, no `any`; JSDoc complete on the component and every prop
- [x] `forwardRef` to `Root`; `className`/`style`/`id`/`data-testid` accepted (on `Root`);
      `aria-label`/`aria-labelledby` redeclared (routed to `Viewport`, only while scrollable);
      `onScroll` redeclared and routed to `Viewport`; `dir` defaulted, not inherited
- [x] Zero hardcoded values — every value traces to an existing token (no new component-layer token)
- [x] Storybook: Docs page (`ComponentName.mdx`) first in the group, Playground second, full template
      (Intro, Playground, Properties, Variants gallery, Usage guidelines, Best practices,
      Accessibility, Code examples, Design tokens used, Related components)
- [x] Every visible story's "Show code" is a hand-written snippet (`ScrollArea.snippets.ts`), the
      Playground builds its own from live controls — both typechecked and exercised in
      `storySnippets.test.ts` (a dedicated `describe` block, matching `ButtonGroup`/`ToggleGroup`'s
      own precedent)
- [x] Properties table's Default column populated correctly for every prop with a real default
      (verified live — this component's `component: ScrollArea` meta shape, with every default
      expressed as a plain destructuring default, was not one of the three shapes known to break
      docgen's inference, and this was confirmed rather than assumed)
- [x] `ScrollArea.docs.test.ts` — the Design tokens table matches the stylesheet, checked by a test
      (17 tokens, the `CodeBlock`/`Stat`/`DescriptionList` drift-guard pattern)
- [x] Unit tests (jsdom, `ScrollArea.test.tsx`, 22 tests) covering rendering, ref/viewportRef split,
      variant/size/scrollbars classes, `onScroll` routing, tabIndex/role appearing only once
      scrollable, `dir`, native prop passthrough, and jest-axe with zero violations (both scrollable
      and non-scrollable states)
- [x] Real-browser tests (`storybook` Vitest project, 8 stories) covering keyboard-reachability,
      genuine scrollability, and the fits-content/no-tab-stop case
- [x] Live-verified: hover-to-reveal scrollbar (default `scrollbarVisibility="hover"`), real wheel
      scrolling (vertical and horizontal), both scrollbars + corner together, dark mode, `dir="rtl"`
      (scrollbar/corner reposition automatically via Radix, confirmed scrolling still works), all 5
      sizes, `variant="ghost"` embedded in a `Card` with no doubled border
- [x] `pnpm --filter @dbm-design-system/components run check-component-bundle-size` — 0.95KB JS /
      0.43KB CSS gzipped, comfortably within budget (comparable to `Avatar`'s 1.88KB baseline)
- [x] Full package `lint`/`typecheck`/`build`/`test` clean (one pre-existing, unrelated flaky timeout
      in `CodeBlock.stories.test.ts`, confirmed passing in isolation, not caused by this change)

## Not yet Finalized

Per the standing rule, only the user declares a component Finalized — this review documents a
complete pass with no outstanding gaps found, awaiting that confirmation.
