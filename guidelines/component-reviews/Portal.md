# Portal

**Tier:** Atom · **Category:** Utility · **Finalized:** ✅ 2026-09-09

## Review pass (2026-09-09)

Full `06-engineering-standards.md` §9 pass — first review for this component. Findings, in the
order fixed (Playground-missing first, Docs-page-missing last, per the standing reporting
convention):

1. **Playground story added.** `Portal.stories.tsx` previously had no `argTypes` and no dedicated
   Playground — `Default`/`CustomContainer`/`DisabledPortal`/`AsChild` existed as fixed
   demonstrations only. Added a full `argTypes` map (`disablePortal`/`asChild` as real, live
   boolean switches with `table.defaultValue.summary: "false"`; `children`/`container`/`id`/
   `className`/`style`/`data-testid` correctly set to `control: false` with real descriptions —
   none of these are meaningfully live-editable: `children` is a fixed illustrative badge,
   `container` needs a real DOM node reference (see the dedicated `CustomContainer` story instead),
   the rest are escape hatches with no visual effect of their own). The new `Playground` story's
   badge is deliberately plain, inline styling (no `position: fixed`, unlike `Default`'s) so
   `disablePortal`'s effect is directly visible without opening devtools: with the portal active
   (default), the badge renders at the very end of `<body>` and the box looks empty; toggling
   `disablePortal` makes it appear inside the box instead.

2. **Baseline correctness: type already correctly extended Radix's own `PortalProps`** — unlike
   `FocusTrap`'s own type-drift bug (see [FocusTrap.md](FocusTrap.md)), `Portal.types.ts` was
   already `extends RadixPortalProps`, so `asChild` support was already present and correctly
   typed. No fix needed here; JSDoc was expanded to document `asChild`'s single-child constraint
   and its interaction with `disablePortal` (finding 3 below), plus a second `@example`.

3. **A real, previously-undocumented interaction between `asChild` and `disablePortal` had no test
   coverage.** `disablePortal` short-circuits to `<>{children}</>` before Radix's own `Portal`
   (and therefore its `Slot`-based `asChild` handling) is ever reached — so `asChild` is silently a
   no-op whenever `disablePortal` is also set. This was true of the existing implementation already
   (no code change needed), but was untested and undocumented. Added a permanent regression test
   (`"asChild has no effect when disablePortal is also true"`) and a "Don't" bullet in the Docs
   page's Usage guidelines section.

4. **A real, confirmed pre-existing bug found in `CustomContainer`'s own story: the target box was
   permanently empty.** The original story read `document.getElementById(targetId)` synchronously
   during a sibling component's render — but React computes the whole tree before committing any of
   it to the real DOM, so the target `<div>` hadn't been created yet at the moment the lookup ran,
   and nothing ever re-triggered it afterward. Reproduced on the untouched, pre-existing standalone
   story before making any changes, confirming this was not caused by this review session. A first
   fix attempt (`useState` + `useEffect` re-checking the DOM after mount) worked functionally
   (verified live) but failed `pnpm lint`'s `react-hooks/set-state-in-effect` rule. Checked
   precedent (`Tag.stories.tsx`'s `render: function RemovableAndSelectableStory() {...}` pattern,
   which calls hooks directly inside a named-function `render`) and rewrote the story to eliminate
   the helper component and `document.getElementById` lookup entirely, replacing both with a ref
   callback (`ref={setContainer}`) directly on the target `<div>` — a ref callback isn't an effect,
   so it isn't subject to the rule, and fires earlier/more reliably (during commit). Passes
   `pnpm lint` clean. Live-verified on a fresh Storybook instance: the "Portaled into custom
   container" badge now renders correctly inside the target box, both on the standalone story and
   the Docs page's own embedded Canvas.

5. **A real, confirmed visual bug: two stories' fixed-position badges collided when mounted
   simultaneously on the Docs page.** `Default`'s and `AsChild`'s own demo badges both used
   `position: fixed; bottom: var(--dbm-space-4); right: var(--dbm-space-4)` — harmless as
   standalone stories, but the Docs page's Variants section embeds both Canvases at once, so only
   the later-mounted badge was ever visible, silently hiding the other entirely. Fixed by moving
   `AsChild`'s badge to `top: var(--dbm-space-4); right: var(--dbm-space-4)` instead (top-right
   instead of bottom-right), with a code comment explaining why. Live-verified via direct DOM
   inspection (`getBoundingClientRect`/`getComputedStyle` on both badges simultaneously) — both now
   render with real, non-overlapping dimensions and `visibility: visible` at the same time.

6. **`asChild` control genuinely works but has no visible effect in the Playground** — same
   situation `ClientOnly`'s `fallback` and `FocusTrap`'s `asChild` both hit (see
   [FocusTrap.md](FocusTrap.md) finding/post-review-fix #3). Per the established precedent, kept the
   control live (it's real and correctly wired — verified via DOM inspection, not assumed) and
   added an explanatory `Callout` above the Playground's Canvas, linking to the Variants section's
   own dedicated, isolated demo of the same behavior.

7. **Feature-completeness:** compared against comparable production portal implementations —
   `container`, `disablePortal`, and `asChild` cover the standard surface. Considered a convenience
   prop for "portal only above a certain breakpoint" (a common overlay pattern) and deliberately did
   not add one — that's a consumer-side composition concern (wrap in a conditional using existing
   responsive utilities), not something a thin, faithful Radix wrapper should special-case, matching
   the same minimal-surface precedent `FocusTrap`/`VisuallyHidden` already established.

8. **Docs page added** (`Portal.mdx`) — the third Docs page in the Utility category (after
   `ClientOnly`, `FocusTrap`), full 10-section template. Body copy explicitly notes that `Portal`
   has no shared state between instances (confirmed by reading Radix `Portal`'s own source: just a
   local `useState` for `mounted` + `ReactDOM.createPortal`, no module-level singleton) — unlike
   `FocusTrap`'s Radix `FocusScope`, which shares a module-level `focusScopesStack` and caused real,
   documented problems when two instances co-mounted on one Docs page. This is why `Portal.mdx`
   safely embeds all four story Canvases in its Variants section (`Default`, `CustomContainer`,
   `DisabledPortal`, `AsChild`) where `FocusTrap.mdx` could not. Related components: `FocusTrap`
   (focus management once content is portaled) and `Backdrop` (the dimming scrim that typically
   pairs with portaled overlay content) — both `RelatedCard`s render live, correctly-scoped previews.
   One authoring mistake caught and fixed before verification: the two `RelatedCard` `href`s were
   initially written in the bare-path Markdown-link convention just established for this project's
   *Markdown-syntax* links, but `RelatedCard`'s `href` is a raw JSX anchor prop requiring the
   opposite, full `/?path=/docs/...` form (see `07-storybook-and-documentation-standards.md` §4.1's
   own entry on the two deliberately-different conventions) — corrected to match every other
   already-Finalized component's `RelatedCard` usage before running any live verification.

## Verification

`tsc --noEmit` (main package build via `tsup`'s `.d.ts` generation, and `.storybook`), `eslint`
(whole package, zero warnings), full `vitest` unit suite (1064/1064 passing across the whole
package, 11/11 for `Portal` itself, up from 8), `tsup` build, and the `@storybook/addon-vitest`
Storybook test project (`pnpm test:storybook`, 370/370 across all 50 component story files,
including `Portal`'s own) all run and passing. `pnpm build-storybook`, `pnpm
check-component-bundle-size` (`Portal` at 0.34KB JS / 0.00KB CSS, well within budget), and `pnpm
check-foundations-token-coverage` all clean.

Live-verified in a running Storybook instance: the `CustomContainer` ref-callback fix was confirmed
by direct observation (the badge renders inside the target box, both standalone and on the Docs
page); the `Default`/`AsChild` badge-collision fix was confirmed via direct DOM inspection
(`getBoundingClientRect`/`getComputedStyle` on both simultaneously, not just visually); the a11y
panel showed zero violations on all four stories (`Default`, `CustomContainer`, `DisabledPortal`,
`AsChild`); dark mode and the Emerald brand theme were both toggled on the Docs page and
re-screenshotted, with no breakage to the shared chrome/Callouts/code blocks/badges/RelatedCards;
console showed zero component-related errors (only generic Storybook manager/devtools
instrumentation noise present on every page, unrelated to `Portal`).

No prior `component-reviews/` entry existed for this component (first pass).

## Post-review fix: `Default`/`AsChild` demo badges escaped to the whole Docs page (2026-09-09, same day, user-reported)

User report, immediately after the review pass above: on `Portal.mdx`, two fixed-position purple
badges ("Portaled content" bottom-right, "Portaled as itself (asChild)" top-right) stayed pinned to
the screen corners no matter what section of the Docs page was scrolled into view.

**Root cause, confirmed by reading the actual rendered DOM directly (not guessed):** a Storybook
Docs page embeds every `<Canvas>` into one single shared `document`/`document.body` — confirmed via
`document.querySelectorAll('iframe')` returning exactly one `#storybook-preview-iframe` for the
whole page, not one per embedded Canvas. `Default`'s badge (`position: fixed`, bottom-right) and
`AsChild`'s badge (`position: fixed`, top-right — itself already moved there earlier in this same
review to avoid colliding with `Default`'s, see finding 5 above) both pin to *that* shared document's
own viewport, i.e. the entire Docs page, not just their own Variants-section Canvas — so they
persisted through Properties, Accessibility, Related components, everywhere. A third, related but
distinct symptom in the same root cause: the `Playground` story's own badge (no `position: fixed`,
just portaled to the real `document.body` by default) landed as the literal last element of that
same shared `<body>` — past every other section — rather than near the Playground section itself,
silently defeating the whole point of a *live* Playground (toggling `disablePortal` produced no
observable change without scrolling past the entire rest of the page). This is **not** the same
mechanism as `FocusTrap`'s shared `focusScopesStack` problem (that was stateful cross-instance
interference; this is a purely visual/DOM-architecture one) and is **not** a bug in `Portal` or
Radix's own `Portal` (confirmed no shared state exists between instances) — it's a consequence of
how Storybook's Docs page composes multiple stories into one document, invisible until a component
whose whole purpose is "move content elsewhere in the DOM" got embedded more than once on one page.

**Fix, two parts:**
1. **`Playground` rewritten to target a locally-scoped portal destination instead of the real
   `document.body`.** Added a plain ref-callback-captured `<div>` ("Portal target") in the same
   render and passed it as `Portal`'s own `container` prop (the same mechanism the dedicated
   "Custom container target" story already demonstrates directly) — `disablePortal`/`asChild`
   still drive the real prop and its real behavior; only the *target* is a local stand-in for
   `document.body`, chosen specifically so the effect is fully observable within this one Canvas
   without scrolling anywhere. Live-verified: toggling `disablePortal` moves the badge between the
   local render area and the target box instantly, visible without leaving the Playground section.
2. **`Default`'s and `AsChild`'s Canvases removed from `Portal.mdx`'s Variants section embed** —
   the same "sidebar-only" treatment already established for `FocusTrap`'s own `MergedOntoChild`
   (and, before that, `BackToTop`/`Affix`'s real-viewport-dependent stories): a story whose entire
   point is demonstrating the true, unscoped default (real `document.body`, a real screen-corner
   `position: fixed` pin) can't be forced into a locally-scoped substitute without misrepresenting
   what "default" means, so instead of compromising the demo, each is replaced in the Variants
   section with a `Callout` explaining why (naming the real mechanism, not hand-waved) plus a
   Markdown-syntax link (`[text](/story/atoms-utility-portal--default)` /
   `[text](/story/atoms-utility-portal--as-child)`, bare-path form, no `?path=` prefix — the
   established correct convention for internal Markdown links, `07-storybook-and-documentation-
   standards.md` §4.1) to the standalone story, where each renders exactly as intended with nothing
   else on the page to conflict with. `CustomContainer` and `DisabledPortal` needed no change —
   both already target a locally scoped element, so neither ever exhibited this symptom.

The intro paragraph's own claim ("mounting more than one at once ... never causes one to interfere
with another") was accurate only for *functional* interference (no shared React/JS state) and did
not cover this separate *visual* one — revised to name both explicitly and point to the Variants
section for the full explanation, so a reader isn't left wondering why two of the four variants
link out instead of rendering inline.

Live-verified end to end after the fix: zero fixed-position or off-screen-portaled elements remain
anywhere on the Docs page at any scroll position (confirmed via direct DOM query across the full
page height, not just visually); the Playground's `disablePortal` toggle is now immediately
observable within its own Canvas; both standalone-story links render and navigate correctly, each
landing on a page where its own demo works exactly as designed; zero new console errors (the one
pre-existing `element.ref` React-19 warning present is unrelated — confirmed identical on
`ClientOnly.mdx`, a page untouched by this fix). Full suite re-run clean: `tsc`, `eslint`, `tsup`
build, 1064/1064 unit tests (unchanged — this was a Storybook/MDX-only fix, no runtime code
touched), `addon-vitest` 370/370, `build-storybook`, `check-component-bundle-size` (`Portal`
unchanged at 0.34KB/0.00KB), `check-foundations-token-coverage`. Recorded as a general Storybook
architecture gotcha (not Portal-specific) in `07-storybook-and-documentation-standards.md` §4.1,
since any future component built on `Portal` (`Tooltip`, `Popover`, `Dialog`, `Toast`) will hit the
identical shared-document mechanism the first time one of its own Docs pages embeds more than one
demo of it.

## Post-review fix #2: inert controls on the four fixed-render stories (2026-09-09, same day, user-reported)

User report: toggling `disablePortal`/`asChild` in the Controls panel on `Default`, `Custom
container target`, `disablePortal (renders in place)`, and `asChild (no wrapper div)` produced no
change — only `Playground`'s controls actually did anything.

Confirmed live on all four: each uses a fixed `render` (`() => (...)` or a named function with no
parameter) that never reads `args` at all, so the Controls panel — inherited from `meta.argTypes` —
displays live-looking `disablePortal`/`asChild` toggles with nothing wired to consume them. This is
not a Portal-specific bug: the identical pattern was confirmed on `FocusTrap`'s own already-Finalized
`Default` story (toggling `trapped` there does nothing either), and traces back to this project's own
founding problem statement (§1 of `07-storybook-and-documentation-standards.md`: "Showcase stories...
use `render: () => (...)` with hardcoded values — they don't respond to the Controls panel at all") —
a gap the original Storybook pass closed by *adding* a working `Playground` story, without also
dashing out the now-provably-inert controls on the other, fixed-render stories.

**Fix:** each of the four stories now gets its own `argTypes: { disablePortal: { control: false },
asChild: { control: false } }`, overriding just the `control` field for the two props its render
ignores — the shared `description`/`table.defaultValue` from `meta.argTypes` are unaffected (a
per-key merge, not a full replacement) and the Docs page's own `PropertiesTable` (driven by
component-level docgen, not any one story) shows no change at all. Live-verified: all four stories
now show `-` for both props in their Controls panel; the Docs page's Properties table still shows
full `true`/`false` value options and descriptions for both.

**Recorded as a new, generalizable convention** (not just a Portal fix) in
`07-storybook-and-documentation-standards.md` §5's own Controls-panel checklist item. Swept across
every other already-Finalized atom the same day, at explicit user request — found and fixed 5
components with real, partial gaps (`Box`, `Divider`, `Highlight`, `Tag`, `Tooltip`); see each
component's own `component-reviews/ComponentName.md` and `07`'s own §5 entry for the full sweep
writeup.

Full suite re-run clean: `eslint`, `tsc`, 1064/1064 unit tests (unchanged — Storybook-metadata-only
fix), `addon-vitest` 370/370.

## Final review (2026-09-09)

A full top-to-bottom re-pass of the checklist before finalizing, after both post-review fixes above
were in place. No new findings — everything checked out:

- **Baseline correctness**: `Portal.tsx`'s implementation (the `forwardRef`, the `disablePortal`
  short-circuit, the dev-mode `ref` warning) re-read fresh, unchanged since the initial pass.
- **Playground defaults**: `meta.args` (`disablePortal: false, asChild: false`) matches the real
  `@default false` documented on both props and the Properties table's own `Default` column — no
  mismatch (the exact class of bug `FocusTrap`'s own final review caught; checked specifically for
  it here and found none).
- **Controls wiring**: every story's Controls panel re-verified live — `Playground` drives the
  canvas correctly (including the post-fix local-container behavior); `Default`/`CustomContainer`/
  `DisabledPortal`/`AsChild` all correctly show `-` for `disablePortal`/`asChild` (the inert-controls
  fix above).
- **Accessibility**: zero violations confirmed via `jest-axe` (`Portal.test.tsx`, including the
  `asChild` variant) and, live, on `Default`/`CustomContainer`/`DisabledPortal`/`AsChild`'s own
  Accessibility panels. `Playground`'s own live panel couldn't be independently re-checked this
  session — Storybook's a11y panel requires a persistent `pnpm test:storybook:watch` process
  (`ADR-0003`), which doesn't survive this environment's non-interactive shell (confirmed: the
  watcher exits after one run instead of staying alive, even under `nohup`/`disown`). Same standing
  environmental limitation already noted in `Tooltip.md`'s own review, not a `Portal`-specific gap —
  covered instead by the `jest-axe` suite and `Playground`'s own structurally-simple markup (a
  paragraph and a styled badge, the same accessible patterns already verified elsewhere in this
  file).
- **Responsiveness**: mobile viewport (375px) checked live on the Docs page — zero horizontal
  overflow confirmed via direct DOM measurement (`scrollWidth === clientWidth`), and specifically
  checked `Playground`'s own two-column flex layout in both toggle states (`disablePortal` off,
  where the first column is empty since the badge portals away, and on, where both columns hold
  real content) — both lay out cleanly with no squeezing or overlap.
- **Theming**: both brand themes × both color modes re-confirmed on the Docs page (dark mode,
  Emerald brand) — no breakage to the shared chrome/Callouts/badges, consistent with `Portal`
  itself referencing no tokens of its own.
- **Console**: zero `Portal`-specific errors on repeated fresh loads. The one recurring
  `Accessing element.ref was removed in React 19` warning is confirmed pre-existing and unrelated
  (identical on `ClientOnly.mdx`, a page untouched by any of this component's own fixes).
- **Full suite**: `tsc`, `eslint`, `tsup` build, 1064/1064 unit tests, `addon-vitest` 370/370 —
  all re-run clean, all cache hits (confirming zero code drift since the last verified-passing run).

## Finalized

**2026-09-09** — confirmed by the user after a full top-to-bottom final review pass covering every
checklist section: baseline correctness (implementation unchanged and re-verified since the initial
pass), feature-completeness (`container`/`disablePortal`/`asChild` cover the standard surface
against comparable production portal implementations, a convenience prop for breakpoint-gated
portaling deliberately not added — consumer-side composition, not this component's job),
accessibility (zero `jest-axe`/live-panel violations across every story, including `asChild`;
`Playground`'s own live panel blocked only by a documented, pre-existing environmental limitation,
not a real gap), responsiveness (mobile viewport spot-checked, including both `Playground` toggle
states), theming (confirmed brand-agnostic — no tokens of its own; the shared Docs chrome/Callouts/
badges spot-checked across both brands and both modes with no breakage), and functional
verification (`tsc`, `eslint`, full 1064-test suite, `tsup` build, `addon-vitest`, `build-storybook`,
bundle-size and foundations-token-coverage checks all clean).

This review surfaced and fixed two real, independent issues beyond the initial pass — the
`Default`/`AsChild` demo badges escaping to the whole Docs page's shared viewport instead of
staying near their own section (fixed architecturally, matching `FocusTrap`'s own `MergedOntoChild`
precedent), and inert Controls-panel toggles on all four fixed-render stories (fixed, and the same
convention swept across 5 other already-Finalized atoms the same day) — each verified live in a
running Storybook instance, not assumed from the code. No further changes without asking first, per
`06-engineering-standards.md` §9's finalization rule.
