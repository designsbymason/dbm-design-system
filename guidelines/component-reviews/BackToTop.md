# BackToTop — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-05. Findings included a confirmed,
serious instance of the recurring `{...props}`-ordering bug — more severe than usual, since two of
the three affected attributes weren't even blocked by TypeScript — plus a real feature-completeness
gap against a component this one directly wraps, and the standard documentation-visibility gaps.

**Fixed:**
- **Confirmed instance of the `{...props}`-ordering bug (`05-component-api-conventions.md` §3) —
  and a more serious variant than usual.** `{...props}` was spread *after* the computed
  `aria-hidden`, `tabIndex`, and `onClick`. Unlike `onClick` (already `Omit`ted from the type, so
  TypeScript blocked it), **`aria-hidden` and `tabIndex` were not Omitted and were fully assignable**
  — `aria-hidden` via TypeScript's aria-*/data-* exemption, `tabIndex` because it's an ordinary,
  still-inherited native prop with no exemption needed at all. A consumer passing either would have
  silently overridden the scroll-driven computation — e.g. a stray `tabIndex={0}` would make the
  button focusable while still hidden and `pointer-events: none`. Fixed two ways at once: moved
  `{...props}` before the computed attributes, **and** added `"aria-hidden" | "tabIndex" |
  "aria-label"` to the `Omit` list in `BackToTopProps` (closing the loophole at the type level too,
  not just the ordering) — matching the exact precedent `IconButton` already set for its own
  `aria-pressed` ("fully owned... computed automatically, not a raw passthrough, so it's removed
  from the native extends entirely"). `aria-label` was included in the same fix even though it
  wasn't explicitly reported broken: `label` is the one documented naming mechanism, so a raw
  `aria-label` passthrough was never an intended API surface, and the exact same aria-*-exemption
  loophole applied to it too.
- **`className`, `style`, `id`, and `data-testid` weren't explicitly redeclared with JSDoc** on
  `BackToTopProps` — the same established documentation-visibility gap found on every other reviewed
  atom.
- **Feature-completeness gap against a component this one directly wraps:** `IconButton` already has
  a `size`/`variant` system, but `BackToTop` exposed neither, even though the wrapping already
  existed (plumbing them through required no new mechanism, just two more props). Added both,
  passed straight through to the underlying `IconButton` unchanged.
- **No Playground story existed** — the only story was one large manual-scroll demo with zero
  controllable props. Added a real Playground with `size`/`variant`/`threshold`/`label` all live via
  `args`/`argTypes`, using the same tall scrollable demo content as a shared `ScrollDemoContent`
  helper (reused by every story in the file rather than duplicated per story).
- **No static "visible" reference existed** — the only way to see the button at all was to actually
  scroll the Canvas. Added a `Visible` story using a negative `threshold` (`window.scrollY > -1` is
  already true at the very top of the page) — a direct, no-scroll-required way to show the "on"
  state as a static reference.
- **No `play`-function interaction story existed** — required per
  `07-storybook-and-documentation-standards.md` for every interactive component. Added
  `ScrollInteraction`, using `window.scrollTo()` + `waitFor()` (the same pattern `Affix`'s own play
  functions already established for scroll-driven assertions) to verify: hidden at the top of the
  page, becomes visible and tabbable past `threshold` after a real scroll, and clicking it both
  scrolls the page back to `window.scrollY === 0` and re-hides the button. Verified via
  `pnpm test:storybook` (the real Chromium-backed interaction runner, not just typecheck) — 329/329
  passing, this one included.
- Docs page (`BackToTop.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance (Playground live-control check, the Properties table's full prop list
  with no empty rows, the Visible-state gallery entry, both Do/Don't Callouts, the Accessibility
  Callout, all 7 Design-tokens rows, and both RelatedCards — `IconButton` and `Affix`), confirmed in
  both light and dark mode.

**Considered, not added (a named, judgment-level gap — flagged for a separate decision, not folded
into this pass):** Ant Design's `BackTop` — the one real precedent for this exact component type —
supports a custom scroll container via `target`; this component is hardcoded to `window`. Real value
for a scrollable-panel/dashboard context (this system's own stated enterprise use case), but real
added complexity (retargeting the scroll listener and the `scrollTo` call to an arbitrary element
instead of `window`). Not implemented without an explicit decision to take it on.

Tests: 9 → 11 (added: default size/variant class coverage, custom size/variant passthrough
coverage). The `{...props}`-ordering fix itself has no dedicated unit-test regression case — once
`aria-hidden`/`tabIndex`/`aria-label` are fully `Omit`ted from the public type, the "consumer passes
it and it's overridden" scenario can no longer even typecheck, matching `IconButton`'s own precedent
of not writing an equivalent test for its analogous `aria-pressed` omission.

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest unit
suite (940 tests package-wide) and the Storybook interaction suite (`pnpm test:storybook`, 329 tests
including the new `play` function), a real `tsup` build, and live Storybook verification of the Docs
page in both light and dark mode.

**Follow-up, 2026-09-05, at explicit direction: added `scrollContainerRef` (a custom scroll container,
the deferred item above).** Named `scrollContainerRef`, not Ant Design's `target` — this project's own
internal precedent (`Affix`'s existing prop of the identical name and shape) took priority over the
external-library naming the original finding cited, per the same reasoning `05-component-api-
conventions.md` gives generally for consistency across this system's own components.
- `RefObject<HTMLElement | null>`, matching `Affix`'s own type exactly. When provided: the scroll
  listener attaches to the container instead of `window`, `threshold` is measured against the
  container's own `scrollTop` instead of `window.scrollY`, and clicking calls the container's own
  `scrollTo({top: 0, behavior: "smooth"})` instead of `window.scrollTo(...)`. The button's own CSS
  position is unaffected either way (`position: fixed` is always relative to the viewport, never to
  the watched container) — confirmed live, and stated explicitly in the Docs page so this isn't
  assumed to work like a `position: sticky`-style relationship.
- **A real, live-discovered environment limitation, not a defect:** attempted to extend the
  `WithinScrollContainer` story with its own `play` function asserting the panel's `scrollTop` reaches
  `0` after a click, mirroring `ScrollInteraction`'s existing pattern. Found via direct live testing
  that `Element.scrollTo({behavior: "smooth"})` does not animate at all in this project's headless
  `test:storybook` Chromium runner — confirmed by testing the identical call directly against the
  panel element outside of any component code, and confirming a `behavior`-omitted (instant) call to
  the same element works immediately. `window.scrollTo({behavior: "smooth"})` (what `ScrollInteraction`
  already exercises) is unaffected by this and continues to animate correctly in the same environment —
  the gap is specific to element-level smooth scroll in headless mode, not a general smooth-scroll
  failure, and not something under this component's control. Deliberately did not add a `play`
  function asserting the click-driven scroll-reset for the container case, to avoid a test that would
  be flaky/failing for environment reasons unrelated to the component's own correctness. The unit test
  suite already covers the click behavior correctly and without this pitfall, by asserting
  `container.scrollTo` was *called* with the right arguments (jsdom, no real animation involved) rather
  than asserting the animation completed — `WithinScrollContainer` itself stays a manual, unscripted
  demo story instead, matching `Affix`'s own less-visited demo stories that don't all carry a `play`
  function either.
- New `scrollContainerRef` unit tests (jsdom): the container's own `scrollTop` drives visibility
  instead of `window.scrollY`; `window` scroll changes are correctly ignored once a container is
  provided; clicking calls the container's own (mocked) `scrollTo` with the right arguments and never
  touches `window.scrollTo`.
- New `WithinScrollContainer` Storybook story (mirroring `Affix`'s own equivalent story's structure:
  a `role="region"`/`tabIndex={0}`/`aria-label`'d scrollable panel, with the same
  `jsx-a11y/no-noninteractive-tabindex` disable-comment justification, since a scrollable
  non-interactive region genuinely needs `tabIndex` for WCAG 2.1.1 keyboard operability). Verified
  live via direct DOM manipulation (not just code review): scrolling the panel past `threshold`
  correctly reveals the button, and clicking it correctly leaves `window.scrollY` untouched (confirmed
  the container-scoped mechanism doesn't leak onto the page's own scroll).
- Docs page updated: `propOrder` (`scrollContainerRef` after `threshold`), intro paragraph,
  `PlaygroundControls`' `exclude` list, a new "Within a scroll container" Variants entry, a
  Usage-guidelines Do bullet, a code example, and the `Affix` RelatedCard's description updated to
  name the shared `scrollContainerRef` convention explicitly. `scrollContainerRef` added to the
  Playground's `argTypes` as `control: false` (a ref has no Controls-panel representation) with a
  pointer to the dedicated demo story, matching `Affix`'s own identical precedent.

Tests: 11 → 14 (added: the three `scrollContainerRef` behavior tests above).

Self-verified: `tsc --noEmit` (package + `.storybook`), `eslint --max-warnings 0`, full Vitest unit
suite (943 tests package-wide) and the Storybook interaction suite (`pnpm test:storybook`, 330 tests),
a real `tsup` build, and live browser verification of the container-scoped scroll/visibility mechanism
via direct DOM manipulation in the actual rendered story.

**Follow-up, 2026-09-05, at direct user report: `Playground` and `Visible` stretched the whole Docs
page and reset its scroll on click, instead of behaving like contained demos.** Root cause: both
stories rendered their scroll demo directly in normal page flow and relied on real `window` scroll —
correct and harmless when a story is viewed standalone (its own full page), but broken once embedded
live in the Docs page (`BackToTop.mdx`), where every story's Canvas shares one real underlying
document. A `window`-scroll demo there stretches the *entire Docs page* to the demo's own content
height, and clicking "back to top" resets the *whole Docs page's* scroll — not a contained effect,
confirmed exactly as reported by directly measuring `window.scrollY` before/after in the live Docs
page (it changed for the whole page, not just the demo section).
- Fixed by extracting a shared `BoundedScrollDemo` helper — a confined, `overflow: auto`, fixed-height
  (`20rem`) scrollable box (the same technique `WithinScrollContainer` already used, for a different
  reason) — and having `Playground`/`Visible` pass `scrollContainerRef` pointing at it instead of
  relying on `window`. Both now behave identically whether viewed standalone or embedded: a short,
  bounded Canvas height, and a click that only resets the box's own scroll. Verified live in the
  actual Docs page via direct DOM manipulation: `window.scrollY` stayed unchanged across both a scroll
  and a click inside the demo box.
- `ScrollInteraction` (the dedicated `play`-function story) deliberately kept its own real
  `window`-scroll demo content unchanged — it's never embedded in the Docs page (only reached via the
  sidebar/Interactions tab), so it remains the right place to verify the actual default, most-common
  real-world behavior (whole-page scroll) end to end, and doing so doesn't create the reported problem.
- **Reconfirmed, in a second, different browser context, the same headless smooth-scroll limitation
  already documented above:** while verifying this fix live (via the interactive CDP-driven Browser
  pane, a different runtime than the `test:storybook` Vitest-browser runner the original finding was
  made in), `Element.scrollTo({behavior: "smooth"})` again did not visibly animate an element's scroll
  position back to `0`, while an immediate (non-smooth) call to the same element worked instantly. Two
  independent automated-browser contexts now show the identical limitation, reinforcing that this is
  specific to CDP/automation-controlled Chromium rather than any one test runner's own quirk — real,
  non-automated user browsers are expected to animate this correctly, matching widespread real-world
  usage of this exact standard API. Not a defect in this component; noted here for anyone who sees the
  same thing while verifying live through an automated tool again.

Self-verified (this follow-up): `tsc --noEmit`, `eslint --max-warnings 0`, full Vitest unit suite (943
tests, unchanged — no unit-testable behavior changed) and the Storybook interaction suite
(`pnpm test:storybook`, 330 tests, unchanged), a real `tsup` build, and live verification in the actual
rendered Docs page confirming both the bounded Canvas height and the contained-click behavior.

**Follow-up, 2026-09-05, documentation only, at explicit direction: clarified that `scrollContainerRef`
never changes where the button renders, only what it measures/scrolls.** Raised as a design question
first: should the button's own position become relative to the container it watches, so a user could
visually associate it with a specific panel rather than the page? Answered before making any change,
since it's a real architectural tradeoff, not a quick fix — `position: fixed` (relative to the
viewport) is what makes "stays pinned to the visible corner while scrolling" work at all; switching to
`position: absolute` inside a `position: relative` wrapper would only track a panel's own visible
viewport correctly if that wrapper's box happens to match the panel's rendered height, which isn't
guaranteed for a tall scrollable panel. Not implemented — flagged as a real, bigger feature with its
own tradeoffs rather than folded into this pass.

What *was* a genuine, confirmed gap: two `BackToTop` instances (e.g. one default for the page, one
with `scrollContainerRef` for a panel, when both are independently scrollable) render at the *exact
same* viewport-fixed corner with no built-in way to tell them apart, since `scrollContainerRef` only
changes measurement/scroll target, never position. Documented rather than redesigned: added Do/Don't
guidance and a new Code example showing the existing `className`/`style` escape hatch (`style={{
insetInlineEnd: '...' }}`) to offset a second instance, plus a Best-practices bullet on when two
instances are actually needed (the common "app shell" layout, where only inner panels scroll, needs
only one) versus when they collide (page and panel both independently scrollable).

No code changes — purely additive Docs-page prose (`04-component-inventory.md`-style current-state
documentation, not a new ADR, since no architectural decision was actually made, only clarified and
deferred). Self-verified: `tsc --noEmit` (`.storybook`), `eslint --max-warnings 0`, full Vitest suite
(943 tests, unchanged), and the updated sections visually confirmed in a running Storybook instance.

Review pass complete — all findings actioned, including the previously-deferred `scrollContainerRef`
question and both direct-report follow-ups. Per `06-engineering-standards.md` §9, "Finalized" is a
status the user declares explicitly, not one a review pass asserts on its own.

**Final review, 2026-09-05, before finalizing: no new findings.** Re-checked the full accumulated
state (`BackToTop.tsx`, `.types.ts`, `.module.css`, `.test.tsx`, `.stories.tsx`, `.mdx`) against every
`06-engineering-standards.md` §9 checklist item — baseline correctness (`{...props}`-before-computed
ordering, `Omit`ted `onClick`/`aria-hidden`/`tabIndex`/`aria-label`), feature completeness, keyboard/
screen-reader accessibility, responsiveness, Storybook documentation completeness, and theming. The
one item not yet explicitly re-verified after the `scrollContainerRef`/`BoundedScrollDemo` follow-ups —
all 4 brand/mode combinations against the current `Visible` story — was checked live via computed
styles in a running Storybook instance: purple-light `rgb(85,72,164)`/white text, purple-dark
`rgb(185,183,239)`/dark text, emerald-light `rgb(26,110,99)`/white text, emerald-dark
`rgb(165,210,201)`/dark text — four distinct, correctly-contrasted semantic-token pairs, no leak from
`IconButton`'s own theming. Self-verified: `eslint` + `tsc --noEmit` (`.storybook`), full Vitest unit
suite (943 tests), the Storybook interaction suite (`pnpm test:storybook`, 330 tests), and a real
`tsup` build — all green.

**Finalized 2026-09-05**, at the user's explicit direction.
