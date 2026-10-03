# ScrollArea

Molecule, Layout category. Item 24 of the itemized molecule build order in
`04-component-inventory.md` — a custom-styled scrollable region wrapping Radix ScrollArea
(`@radix-ui/react-scroll-area`, new dependency). Built 2026-09-29.

## What it is

A single (non-compound) component: `children` renders inside Radix's own `Viewport`, with one or
two token-driven overlay scrollbar(s) — `scrollbars` (`vertical` default / `horizontal` / `both`)
picks which axis (or axes) are actually offered; the other is clipped, not scrollable. `size` (the
standard 5-step scale) sets scrollbar thickness — originally mapped directly onto the existing
spacing tokens, revised (see the follow-up below) to a dedicated component-layer token,
4/6/8/10/12px. `variant` (`bordered` default /
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
- [x] Zero hardcoded values — every value traces to a token (one new component-layer token family,
      `scroll-area.thickness.*`, added in the follow-up below)
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
      (18 tokens after the follow-up below, the `CodeBlock`/`Stat`/`DescriptionList` drift-guard pattern)
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

## Follow-up: five real defects found by the user, live in the shipped Storybook (2026-09-29)

After the initial commit, live use in Storybook surfaced issues the original review's own
verification pass missed — checking a hover-revealed scrollbar's *presence* and *proportional
sizing* were treated as one confirmation, when they're two independently-checkable things, and the
size-comparison "Sizes" story was never screenshotted with real content wide enough to reveal a
sizing bug. All five fixed same-day, re-verified live:

1. **No visible track, only a thumb.** The scrollbar lane had no background at all — fixed by
   giving `.scrollbar` `bg.track` (the same deliberately-faint token `Slider`/`ProgressBar`/`Switch`
   use for their own tracks, ADR-0016's reasoning applies identically here: the thumb carries the
   interactive affordance, the track is just a boundary guide).
2. **The thumb always rendered at the full track's length, in every orientation** — a real, more
   serious bug than #1, not just a styling gap. Root cause: `.thumb { flex: 1; }`. `.scrollbar` is
   `display: flex`, and giving the (sole) flex child its own `flex: 1` (shorthand for
   `flex-basis: 0%`, `flex-grow: 1`) makes it grow to fill the *entire* track along the main axis,
   completely discarding Radix's own proportional sizing (the `--radix-scroll-area-thumb-width`/
   `-height` CSS custom properties it computes and sets inline from how much of the content is
   actually visible). Confirmed live via `getBoundingClientRect()`: the thumb's rect exactly
   matched the scrollbar's own rect before the fix, and correctly showed ~63% (matching the real
   viewport/content ratio) after removing `flex` from `.thumb` — the default `align-items: stretch`
   still fills the thumb's cross-axis thickness with no `flex` property needed at all. This also
   explains the user's separate "extends beyond the container, gets cropped by the border while
   scrolling" report: a thumb that's always 100% of the track reads as clipped/overflowing the
   instant the track itself is inset even slightly from the frame's own edge.
3. **The scrollbar thickness scale read heavier than intended** (`size="md"`, the default, was
   12px). Revised to 4/6/8/10/12px (`xs`–`xl`) — thinner overall, and now needs its own
   component-layer token (`component/scroll-area.json`) since only two of the five steps still land
   on the shared spacing scale; see `03-token-system-spec.md`'s own "Component-layer tokens" entry.
4. **Demo content had no padding and touched the frame's border**, and used placeholder
   "activity log" strings rather than genuinely long-form text. Fixed in `ScrollArea.stories.tsx`
   only (never in the component itself, which stays an unopinionated wrapper, same as `Box`) — every
   demo now wraps its content in `padding: var(--dbm-space-4)`, and uses three lorem ipsum paragraphs
   (vertical-scroll demos) or five long `white-space: nowrap` lines built from the same placeholder
   copy (horizontal/both-axis demos).
5. **The Horizontal and Both-axes demos were artificially narrow** (`maxWidth: "20rem"`, ~320px)
   and didn't read as full, deliberate compositions the way Vertical's own full-canvas-width demo
   did. Fixed by removing the width cap entirely (the long nowrap lines overflow horizontally
   regardless of how wide the canvas is) and sizing Horizontal's own height to its content's natural
   height (no `maxHeight` at all — five lines, no vertical scrolling needed) rather than a guessed
   pixel value. Both-axes needed its own explicit, shorter `maxHeight` (`8rem`, down from the
   inherited `12rem` default): the five-line demo content's natural height landed just *under* 12rem,
   so at that height the story only ever demonstrated horizontal overflow — a real gap in the
   original story design, not just a cosmetic sizing choice, found by measuring rather than assuming
   the box would obviously overflow both ways.

A sixth issue reported alongside the other five — the Playground's `aria-label` control showing an
inert "Set string" placeholder instead of a real text field — was the same class of bug this
project has hit repeatedly (`06-engineering-standards.md` §9's Storybook checklist): an arg left
`undefined` in the Playground's own top-level `args` renders as a non-interactive placeholder.
Fixed by giving `"aria-label"` a real default (`"Scrollable content"`). That default's own second-
order effect was caught immediately by the real-browser test suite, not missed: the `Sizes` story
renders five `ScrollArea` instances side by side, and giving all five the identical inherited
`aria-label` produced five identically-named `role="region"` landmarks — a genuine
`landmark-unique` axe violation (`jest-axe`'s browser-mode equivalent), not a false positive. Fixed
by giving each size its own distinct label (`` `Scrollable content, size ${size}` ``).

Full re-verification after all five: `tsc`, `eslint --max-warnings 0`, the full unit + real-browser
(Chromium) test suites (5559 + hidden interaction stories, all passing), `pnpm build`, the
component bundle-size check (still 0.95KB JS / 0.45KB CSS, within budget), and the Foundations
token-coverage check (unaffected — no semantic token changed) all clean. Re-verified live in the
browser: track + proportionally-sized thumb in every orientation and both dark/light modes, the
Horizontal/Both/Sizes/Ghost stories' new content and sizing, and the `aria-label` control now a
real, editable text field.

## Second follow-up: track visibility, tone, and a genuine "both axes" demo (2026-10-02)

Five more changes, all at explicit direction:

1. **The scrollbar track defaults to transparent again** — reverting the first follow-up's own
   `bg.track` default, after live use showed a floating thumb with no track reads as the more
   expected overlay-scrollbar treatment. A new `showTrack?: boolean` prop (default `false`) opts
   back into the visible track; it affects only `.scrollbar`'s own background, never the thumb,
   which keeps its own styling regardless.
2. **A new `tone?: "neutral" | "brand"` prop** (default `"neutral"`) colors the thumb and, when
   `showTrack` is set, the track: `"brand"` uses `bg.brand`/`bg.brand-hover` for the thumb and
   `bg.brand-subtle` for the track — all three already-verified, existing semantic tokens, no new
   contrast check needed. Implemented as CSS custom properties defined once on `.toneBrand`
   (applied to the scrollbar element) and consumed via `var(--scroll-area-thumb-color, ...)`-style
   fallbacks on `.thumb`/`.showTrack` — the same "define per tone, consume generically" pattern
   `Table`'s own tone classes use, relying on ordinary custom-property inheritance from the
   scrollbar element down to its thumb child rather than a second class on the thumb itself.
   Verified live against both brand themes (Purple and Emerald) and both color modes — the brand
   tone correctly follows whichever brand is active, not a hardcoded purple.
3. **The demo content is no longer lorem ipsum.** Replaced with real, educational sentences about
   `ScrollArea` itself (what it is, how input/visibility work, its keyboard-accessibility model) —
   genuinely informative rather than placeholder text, and long enough (individually and combined)
   to overflow every demo's own bounds. One shared sentence array feeds both the wrapped-paragraph
   form (vertical-scroll demos) and the one-sentence-per-line nowrap form (horizontal/both-axis
   demos), so the two demo styles read as one real piece of writing rather than two disconnected
   placeholder snippets.
4. **A real defect, found as a direct consequence of fix #3:** the Playground's own `scrollbars="both"`
   previously showed only a horizontal scrollbar — its demo content's natural height landed just
   under the inherited 12rem default, so vertical content never actually overflowed. The new,
   longer educational content (seven sentences instead of five) comfortably exceeds 12rem on its
   own, so switching `scrollbars` to `"both"` in the Playground now genuinely demonstrates both
   axes without a separate, hidden height override — confirmed live via `scrollHeight`/`clientHeight`
   measurement before and after (`255 > 190` vertically, `1382 > 642` horizontally, at the
   Playground's own default `maxHeight`). The dedicated `Both axes` story's own previous `8rem`
   override (added in the first follow-up specifically to force this) was removed as no longer
   needed.
5. Added a `Tone` gallery story (neutral vs. brand, both with `showTrack` set so the track's own
   tint is visible too, not just the thumb) and extended the Playground's `argTypes`/`args`,
   `scrollAreaPlaygroundSnippet`, and `storySnippets.test.ts`'s own dedicated describe block for
   both new props.

A real mistake caught and fixed during this pass, not shipped: a first attempt at the new
`<TokenRow usage="...">` strings used backslash-escaped double quotes (`tone=\"brand\"`) — MDX
doesn't support that escape inside a JSX attribute (the same class of bug this project's own
guidelines already document, found originally on `Avatar`) and would have broken the whole Docs
page had it shipped. Caught before verifying live, fixed with single quotes instead
(`tone='brand'`).

Full re-verification: `tsc`, `eslint --max-warnings 0`, the full unit suite (5569 passing) and the
real-browser Chromium suite for `ScrollArea` specifically (9 stories, including the new `Tone`
story), `storySnippets.test.ts` (818 passing, including two new describe blocks for `showTrack`/
`tone`), `pnpm build`, and the component bundle-size check (1.01KB JS / 0.50KB CSS, a small
increase from the new props, still comfortably within budget) — all clean. Re-verified live: the
default transparent track, `showTrack` toggling a visible one, `tone="brand"` on both the thumb and
(with `showTrack`) the track, in both brand themes and both color modes, the Playground's `both`
scrollbars now showing genuine two-axis overflow, and the Docs page's Properties table and embedded
Playground panel both showing `showTrack`/`tone` in the correct position with correct defaults.

## Third follow-up: `showTrack`'s own hover/active opacity (2026-10-02)

At explicit direction: `showTrack`'s track now renders at half-opacity at rest, going fully opaque
the moment it's hovered or actively dragged — rather than one fixed opacity regardless of
interaction state.

A plain CSS `opacity` on `.scrollbar` itself was not an option: the thumb is a child of that same
element and would fade along with the track, which must stay fully opaque always. `color-mix()`
blends only `.scrollbar`'s own `background-color` toward transparent instead, leaving the thumb's
separate `background-color` declaration completely unaffected — `.showTrack`'s resting rule became
`color-mix(in srgb, var(--scroll-area-track-color, var(--dbm-bg-track)) calc(var(--dbm-opacity-50) * 100%), transparent)`,
with `.showTrack:hover, .showTrack:active` restoring the plain, fully-opaque `background-color`.

**New primitive token:** `opacity.50` (`other.json`) — the existing scale jumped `40` → `60` with
no half-opacity step; added to fill that gap rather than reusing an adjacent, numerically-wrong
step. Documented in `03-token-system-spec.md`'s `other.json` row.

**Why one selector pair covers "hovered or interacted with":** Radix sets pointer capture on the
scrollbar element at drag-start (confirmed in its own source), so `:hover` and `:active` both stay
true for the entire drag even if the pointer moves outside the scrollbar's visible bounds mid-drag
— there's no separate "actively dragging but not hovering" state to handle.

**No dedicated automated test added for the hover/active transition itself** — following this
project's own established precedent (`Breadcrumb`'s `ColourInteraction` story, which documents via
a comment that "Storybook's `userEvent` sends synthetic events, which never match `:hover`" rather
than attempting to force the state). The existing unit tests (`ScrollArea.test.tsx`) already cover
`showTrack`'s class application; the opacity/hover mechanism itself is pure CSS, verified live
instead (below).

Verified live in the browser (`Tone` story, both tones, both color modes): computed
`background-color` at rest resolves to the expected 0.5-alpha `color()` value for both the neutral
and brand tracks; hovering one scrollbar with real mouse coordinates flips only that element's own
background to fully opaque (`sb.matches(':hover')` → `true`), while the other, non-hovered
scrollbar stays at 0.5 alpha — confirming per-element scoping, not a global state leak; the thumb's
own `background-color` stays solid and unaffected in both the hovered and non-hovered cases.

Full re-verification: `tsc --noEmit` and `eslint --max-warnings 0` both clean; the full unit suite
(4695 passing, package-wide) and the full real-browser Chromium suite (875 passing, package-wide)
both clean — the docs-test drift guard (`ScrollArea.docs.test.ts`) initially caught the new
`--dbm-opacity-50` reference missing its `<TokenRow>` entry in the MDX, fixed by adding one; `pnpm
build` clean; the component bundle-size check (1.01KB JS / 0.56KB CSS, a small increase from the
new rule, still comfortably within budget); the Foundations token-coverage check unaffected (no
semantic token changed, only a new primitive).

## Not yet Finalized

Per the standing rule, only the user declares a component Finalized — this review documents a
complete pass with no outstanding gaps found, awaiting that confirmation.
